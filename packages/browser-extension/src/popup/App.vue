<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from '../composables/useI18n'
import { useSettings } from '../composables/useSettings'
import logoSvg from '../assets/wcagify-icon.svg'
import ClearableSelect from './components/ClearableSelect.vue'
import ConnectionSettings from './components/ConnectionSettings.vue'
import ContrastChecker from './components/ContrastChecker.vue'
import ElementPicker from './components/ElementPicker.vue'
import IssueForm from './components/IssueForm.vue'
import SettingsPage from './components/SettingsPage.vue'

const picker = ref<InstanceType<typeof ElementPicker>>()
const { t } = useI18n()
const { reports, reportSlug, scanStatus } = useSettings()

const currentView = ref<'main' | 'settings'>('main')
const openPanel = ref<number | null>(null)

function togglePanel(index: number) {
  openPanel.value = openPanel.value === index ? null : index
}

// Element state forcing via chrome.debugger (CSS.forcePseudoClasses)
let debuggerTabId: number | undefined

const activeStates = ref<string[]>([])

const PSEUDO_STATES = computed(() => [
  { key: 'active', label: t('elementState.active') },
  { key: 'hover', label: t('elementState.hover') },
  { key: 'focus', label: t('elementState.focus') },
  { key: 'focus-within', label: t('elementState.fWithin') },
  { key: 'focus-visible', label: t('elementState.fVisible') },
  { key: 'target', label: t('elementState.target') }
])

async function applyPseudoClasses(tabId: number, selector: string | string[], states: string[]) {
  // For shadow DOM the picker returns an array; use the outermost selector
  const selectorStr = Array.isArray(selector) ? selector[0] : selector
  if (!selectorStr) return

  if (states.length === 0) {
    if (debuggerTabId !== undefined) {
      await chrome.debugger
        .sendCommand({ tabId: debuggerTabId }, 'Runtime.evaluate', {
          expression: `(function(){ try { if (document.activeElement !== document.body) document.activeElement?.blur?.(); } catch(e){} })()`
        })
        .catch(() => {})
      await chrome.debugger
        .sendCommand({ tabId: debuggerTabId }, 'Input.dispatchMouseEvent', {
          type: 'mouseMoved',
          x: 0,
          y: 0,
          button: 'none',
          buttons: 0,
          clickCount: 0
        })
        .catch(() => {})
      await chrome.debugger.detach({ tabId: debuggerTabId }).catch(() => {})
      debuggerTabId = undefined
    }
    return
  }

  if (debuggerTabId !== tabId) {
    if (debuggerTabId !== undefined) {
      await chrome.debugger.detach({ tabId: debuggerTabId }).catch(() => {})
      debuggerTabId = undefined
    }
    await chrome.debugger.attach({ tabId }, '1.3')
    debuggerTabId = tabId
  }

  await chrome.debugger.sendCommand({ tabId }, 'DOM.enable', {})
  await chrome.debugger.sendCommand({ tabId }, 'CSS.enable', {})

  // DOM.getDocument must be called to initialize the DOM agent before any
  // node lookups or DOM.requestNode calls will work correctly
  const doc = (await chrome.debugger.sendCommand({ tabId }, 'DOM.getDocument', {
    depth: 1
  })) as { root: { nodeId: number } }

  // Primary: CDP DOM.querySelector (direct, no JS evaluation overhead)
  let nodeId = 0
  const queryResult = (await chrome.debugger.sendCommand({ tabId }, 'DOM.querySelector', {
    nodeId: doc.root.nodeId,
    selector: selectorStr
  })) as { nodeId: number }
  nodeId = queryResult.nodeId

  // Fallback: native browser querySelector via Runtime.evaluate + DOM.requestNode
  // Handles edge cases where CDP's own querySelector fails for complex selectors
  if (!nodeId) {
    const evalResult = (await chrome.debugger.sendCommand({ tabId }, 'Runtime.evaluate', {
      expression: `document.querySelector(${JSON.stringify(selectorStr)})`,
      returnByValue: false
    })) as { result: { objectId?: string } }

    if (evalResult?.result?.objectId) {
      const nodeResult = (await chrome.debugger.sendCommand({ tabId }, 'DOM.requestNode', {
        objectId: evalResult.result.objectId
      })) as { nodeId: number }
      nodeId = nodeResult.nodeId
    }
  }

  if (!nodeId) {
    console.warn('[WCAGify] Element not found by selector:', selectorStr)
    return
  }

  try {
    await chrome.debugger.sendCommand({ tabId }, 'CSS.forcePseudoClasses', {
      nodeId,
      forcedPseudoClasses: states
    })
    return
  } catch (e: unknown) {
    const msg = String(e)
    if (!msg.includes('-32601') && !msg.includes("wasn't found")) throw e
  }

  // Fallback when CSS.forcePseudoClasses is unavailable: simulate via browser APIs
  if (states.some((s) => ['focus', 'focus-visible', 'focus-within'].includes(s))) {
    await chrome.debugger.sendCommand({ tabId }, 'DOM.focus', { nodeId }).catch(() => {})
  }

  if (states.includes('hover')) {
    const posResult = (await chrome.debugger.sendCommand({ tabId }, 'Runtime.evaluate', {
      expression: `(() => { const r = document.querySelector(${JSON.stringify(selectorStr)})?.getBoundingClientRect(); return r ? JSON.stringify({ x: r.left + r.width / 2, y: r.top + r.height / 2 }) : null })()`,
      returnByValue: true
    })) as { result: { value?: string } }
    if (posResult?.result?.value) {
      const pos = JSON.parse(posResult.result.value) as { x: number; y: number }
      await chrome.debugger
        .sendCommand({ tabId }, 'Input.dispatchMouseEvent', {
          type: 'mouseMoved',
          x: pos.x,
          y: pos.y,
          button: 'none',
          buttons: 0,
          clickCount: 0
        })
        .catch(() => {})
    }
  } else {
    // Move the synthetic cursor away so any previously applied hover is cleared
    await chrome.debugger
      .sendCommand({ tabId }, 'Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: 0,
        y: 0,
        button: 'none',
        buttons: 0,
        clickCount: 0
      })
      .catch(() => {})
  }
}

async function toggleState(key: string) {
  const tabId = picker.value?.selectedTabId
  const selector = picker.value?.selector as string | string[] | undefined
  if (!tabId || !selector) return

  const prev = activeStates.value
  const next = prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
  activeStates.value = next

  try {
    await applyPseudoClasses(tabId, selector, next)
  } catch (e) {
    console.error('[WCAGify] Failed to force pseudo-class:', e)
    activeStates.value = prev
    if (debuggerTabId !== undefined) {
      await chrome.debugger.detach({ tabId: debuggerTabId }).catch(() => {})
      debuggerTabId = undefined
    }
  }
}

watch(
  () => picker.value?.selector,
  async () => {
    if (activeStates.value.length > 0 && debuggerTabId !== undefined) {
      await chrome.debugger.detach({ tabId: debuggerTabId }).catch(() => {})
      debuggerTabId = undefined
      activeStates.value = []
    }
  }
)

function onDebuggerDetach(source: chrome.debugger.Debuggee) {
  if (source.tabId === debuggerTabId) {
    debuggerTabId = undefined
    activeStates.value = []
  }
}

onMounted(() => chrome.debugger.onDetach.addListener(onDebuggerDetach))
onUnmounted(() => {
  chrome.debugger.onDetach.removeListener(onDebuggerDetach)
  if (debuggerTabId !== undefined) {
    chrome.debugger.detach({ tabId: debuggerTabId }).catch(() => {})
    debuggerTabId = undefined
  }
})
</script>

<template>
  <UApp>
    <SettingsPage v-if="currentView === 'settings'" @back="currentView = 'main'" />

    <div v-show="currentView === 'main'" class="min-h-screen p-4 font-sans">
      <!-- Header -->
      <div class="flex items-center gap-2">
        <img :src="logoSvg" alt="" aria-hidden="true" class="size-7" />
        <h1 class="text-lg font-bold text-black dark:text-white">WCAGify</h1>

        <UButton
          @click="currentView = 'settings'"
          :aria-label="t('settings.title')"
          icon="i-lucide-settings"
          size="xl"
          color="neutral"
          variant="ghost"
          :ui="{
            base: 'cursor-pointer selectable-focus ml-auto',
            leadingIcon: 'size-5'
          }"
        />
      </div>

      <USeparator class="mt-3 mb-4" aria-hidden="true" />

      <div class="space-y-4">
        <ElementPicker v-if="reports.length > 0" ref="picker" class="flex-1" />

        <div v-else-if="scanStatus !== 'done'" class="w-full">
          <USkeleton class="h-10 w-full rounded-md mb-4" />
          <div class="w-full space-y-2.5">
            <USkeleton class="h-3.5 w-24 rounded-md" />
            <USkeleton class="h-9 w-full rounded-md" />
          </div>
        </div>

        <!-- Setup screen when no instance is connected -->
        <div v-else class="space-y-5 max-w-2xl mx-auto">
          <div class="flex flex-col items-center text-center pt-2">
            <img :src="logoSvg" alt="" aria-hidden="true" class="size-16 mb-3" />
            <h1 class="text-lg font-bold text-black dark:text-white mb-1">
              {{ t('setup.title') }}
            </h1>
            <p class="text-sm text-muted">
              {{ t('setup.description') }}
            </p>
          </div>

          <section class="bg-elevated rounded-sm p-4">
            <ConnectionSettings />
          </section>

          <div
            class="rounded-sm border border-dashed border-gray-300 dark:border-gray-700 p-4 space-y-2"
          >
            <h2 class="text-sm font-semibold text-black dark:text-white flex items-center gap-1.5">
              <UIcon name="i-lucide-info" class="size-4 text-muted" />
              {{ t('setup.helpTitle') }}
            </h2>
            <ol class="text-sm text-muted list-decimal list-inside space-y-1">
              <li>{{ t('setup.step1') }}</li>
              <li>{{ t('setup.step2') }}</li>
              <li>{{ t('setup.step3') }}</li>
            </ol>
            <a
              href="https://wcagify.com/guide/getting-started"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline selectable-focus mt-1"
            >
              {{ t('setup.docsLink') }}
              <UIcon name="i-lucide-external-link" class="size-3.5" />
            </a>
          </div>
        </div>

        <template v-if="reports.length > 0">
          <!-- Report Selection remove for now, need to implement when their are more reports -->
          <!-- <UFormField
            :label="t('connection.report')"
            :hint="`(${t('connection.required')})`"
            name="wcagify-report"
            :ui="{
              label: 'label-title',
              labelWrapper: 'flex items-center justify-start gap-1',
              hint: 'label-hint'
            }"
          >
            <ClearableSelect
              id="wcagify-report"
              v-model="reportSlug"
              :items="reports.map((r) => ({ label: r.title, value: r.slug }))"
              :placeholder="t('connection.selectReport')"
              required
            />
          </UFormField> -->

          <div>
            <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {{ t('contrast.testOptions') }}
            </label>

            <div class="grid grid-cols-2 gap-2">
              <UButton
                :label="t('contrast.title')"
                :color="openPanel === 0 ? 'primary' : 'neutral'"
                :variant="openPanel === 0 ? 'subtle' : 'outline'"
                icon="i-lucide-test-tube"
                :ui="{ leadingIcon: 'size-4' }"
                block
                @click="togglePanel(0)"
              />
              <UButton
                :label="t('elementState.title')"
                :color="openPanel === 1 ? 'primary' : 'neutral'"
                :variant="openPanel === 1 ? 'subtle' : 'outline'"
                icon="i-lucide-layers"
                :ui="{ leadingIcon: 'size-4' }"
                block
                @click="togglePanel(1)"
              />
              <UButton
                :label="t('zoomCheck.title')"
                :color="openPanel === 2 ? 'primary' : 'neutral'"
                :variant="openPanel === 2 ? 'subtle' : 'outline'"
                icon="i-lucide-zoom-in"
                :ui="{ leadingIcon: 'size-4' }"
                block
                @click="togglePanel(2)"
              />
              <UButton
                :label="t('test.title')"
                :color="openPanel === 3 ? 'primary' : 'neutral'"
                :variant="openPanel === 3 ? 'subtle' : 'outline'"
                icon="i-lucide-play"
                :ui="{ leadingIcon: 'size-4' }"
                block
                @click="togglePanel(3)"
              />
            </div>

            <UCollapsible :open="openPanel === 0" @update:open="(v) => (openPanel = v ? 0 : null)">
              <template #content>
                <div class="bg-muted p-2 space-y-3 rounded mt-2">
                  <ContrastChecker
                    :fg-color="picker?.foregroundColor"
                    :bg-color="picker?.backgroundColor"
                  />
                </div>
              </template>
            </UCollapsible>

            <UCollapsible :open="openPanel === 1" @update:open="(v) => (openPanel = v ? 1 : null)">
              <template #content>
                <div class="bg-muted grid grid-cols-2 sm:grid-cols-3 gap-2 p-2 rounded mt-2">
                  <button
                    v-for="state in PSEUDO_STATES"
                    :key="state.key"
                    type="button"
                    :disabled="!picker?.selector"
                    :class="[
                      'px-3 py-1.5 text-sm rounded border transition-colors w-full',
                      'disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
                      activeStates.includes(state.key)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-transparent border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    ]"
                    @click="toggleState(state.key)"
                  >
                    {{ state.label }}
                  </button>
                </div>
              </template>
            </UCollapsible>

            <UCollapsible :open="openPanel === 2" @update:open="(v) => (openPanel = v ? 2 : null)">
              <template #content>
                <div class="bg-muted p-2 space-y-3 rounded mt-2">
                  <!-- Zoom Check content -->
                </div>
              </template>
            </UCollapsible>

            <UCollapsible :open="openPanel === 3" @update:open="(v) => (openPanel = v ? 3 : null)">
              <template #content>
                <div class="bg-muted p-2 space-y-3 rounded mt-2">
                  <!-- Test content -->
                </div>
              </template>
            </UCollapsible>
          </div>

          <IssueForm
            :reports="reports"
            :selector="picker?.selector ?? ''"
            :page-url="picker?.pageUrl ?? ''"
            :page-title="picker?.pageTitle ?? ''"
          />
        </template>

        <template v-else-if="scanStatus !== 'done'">
          <div class="space-y-3">
            <div v-for="n in 2" :key="n" class="w-full space-y-2.5">
              <USkeleton class="h-3.5 w-24 rounded-md" />
              <USkeleton class="h-9 w-full rounded-md" />
            </div>
            <div class="flex gap-3 w-full">
              <div v-for="n in 2" :key="n" class="w-full space-y-2.5">
                <USkeleton class="h-3.5 w-24 rounded-md" />
                <USkeleton class="h-9 w-full rounded-md" />
              </div>
            </div>
            <div class="w-full space-y-2.5">
              <USkeleton class="h-3.5 w-24 rounded-md" />
              <USkeleton class="h-41.75 w-full rounded-md" />
            </div>
            <USkeleton class="h-10 w-full rounded-md" />
          </div>
        </template>
      </div>
    </div>
  </UApp>
</template>
