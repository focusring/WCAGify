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

function buttonClass(isActive: boolean) {
  return [
    'px-3 py-1.5 text-sm rounded border transition-colors w-full',
    'disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
    isActive
      ? 'bg-primary text-white border-primary'
      : 'bg-transparent border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
  ]
}

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
    <button
      type="button"
      :disabled="!selector"
      :class="buttonClass(activeStates.includes('active'))"
      @click="toggleState('active')"
    >
      {{ t('elementState.active') }}
    </button>

    <button
      type="button"
      :disabled="!selector"
      :class="buttonClass(activeStates.includes('hover'))"
      @click="toggleState('hover')"
    >
      {{ t('elementState.hover') }}
    </button>

    <button
      type="button"
      :disabled="!selector"
      :class="buttonClass(activeStates.includes('focus'))"
      @click="toggleState('focus')"
    >
      {{ t('elementState.focus') }}
    </button>

    <button
      type="button"
      :disabled="!selector"
      :class="buttonClass(activeStates.includes('focus-within'))"
      @click="toggleState('focus-within')"
    >
      {{ t('elementState.fWithin') }}
    </button>

    <button
      type="button"
      :disabled="!selector"
      :class="buttonClass(activeStates.includes('focus-visible'))"
      @click="toggleState('focus-visible')"
    >
      {{ t('elementState.fVisible') }}
    </button>

    <button
      type="button"
      :disabled="!selector"
      :class="buttonClass(activeStates.includes('target'))"
      @click="toggleState('target')"
    >
      {{ t('elementState.target') }}
    </button>
  </div>
</template>
