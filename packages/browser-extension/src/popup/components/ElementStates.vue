<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from '../../composables/useI18n'

const props = defineProps<{
  tabId?: number
  selector?: string | string[]
}>()

const { t } = useI18n()

let debuggerTabId: number | undefined

const activeStates = ref<string[]>([])

async function applyPseudoClasses(tabId: number, selector: string | string[], states: string[]) {
  // For shadow DOM the picker returns an array; use the outermost selector
  const selectorStr = Array.isArray(selector) ? selector[0] : selector
  if (!selectorStr) return

  if (states.length === 0) {
    if (debuggerTabId !== undefined) {
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

  await chrome.debugger.sendCommand({ tabId }, 'CSS.forcePseudoState', {
    nodeId,
    forcedPseudoClasses: states
  })
}

async function toggleState(key: string) {
  const tabId = props.tabId
  const selector = props.selector
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
  () => props.selector,
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
  <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
    <UButton
      :disabled="!selector"
      :variant="activeStates.includes('active') ? 'solid' : 'outline'"
      size="sm"
      :ui="{ base: 'cursor-pointer selectable-focus w-full justify-center' }"
      :label="t('elementState.active')"
      @click="toggleState('active')"
    />

    <UButton
      :disabled="!selector"
      :variant="activeStates.includes('hover') ? 'solid' : 'outline'"
      size="sm"
      :ui="{ base: 'cursor-pointer selectable-focus w-full justify-center' }"
      :label="t('elementState.hover')"
      @click="toggleState('hover')"
    />

    <UButton
      :disabled="!selector"
      :variant="activeStates.includes('focus') ? 'solid' : 'outline'"
      size="sm"
      :ui="{ base: 'cursor-pointer selectable-focus w-full justify-center' }"
      :label="t('elementState.focus')"
      @click="toggleState('focus')"
    />

    <UButton
      :disabled="!selector"
      :variant="activeStates.includes('focus-within') ? 'solid' : 'outline'"
      size="sm"
      :ui="{ base: 'cursor-pointer selectable-focus w-full justify-center' }"
      :label="t('elementState.fWithin')"
      @click="toggleState('focus-within')"
    />

    <UButton
      :disabled="!selector"
      :variant="activeStates.includes('focus-visible') ? 'solid' : 'outline'"
      size="sm"
      :ui="{ base: 'cursor-pointer selectable-focus w-full justify-center' }"
      :label="t('elementState.fVisible')"
      @click="toggleState('focus-visible')"
    />

    <UButton
      :disabled="!selector"
      :variant="activeStates.includes('target') ? 'solid' : 'outline'"
      size="sm"
      :ui="{ base: 'cursor-pointer selectable-focus w-full justify-center' }"
      :label="t('elementState.target')"
      @click="toggleState('target')"
    />
  </div>
</template>
