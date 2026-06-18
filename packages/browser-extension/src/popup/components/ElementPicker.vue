<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from '../../composables/useI18n'

const { t } = useI18n()

const selector = ref('')
const pageUrl = ref('')
const pageTitle = ref('')
const picking = ref(false)
const pickerTabId = ref<number | undefined>()

// Long-lived port to the page tab; its disconnect on panel close is what the content script uses to tear down any active or persisted highlight overlay.
let pickerPort: chrome.runtime.Port | undefined = undefined
let pickerPortTabId: number | undefined = undefined

defineExpose({ selector, pageUrl, pageTitle })

function connectPickerPort(tabId: number) {
  if (pickerPort && pickerPortTabId === tabId) return
  pickerPort?.disconnect()
  const port = chrome.tabs.connect(tabId, { name: 'wcagify-picker' })
  pickerPort = port
  pickerPortTabId = tabId
  port.onDisconnect.addListener(() => {
    void chrome.runtime.lastError
    if (pickerPort === port) {
      pickerPort = undefined
      pickerPortTabId = undefined
    }
  })
}

function onMessage(message: { type: string; selector?: string; url?: string; pageTitle?: string }) {
  if (message.type === 'element-picked') {
    selector.value = message.selector ?? ''
    pageUrl.value = message.url ?? ''
    pageTitle.value = message.pageTitle ?? ''
    picking.value = false
    pickerTabId.value = undefined
  }
  if (message.type === 'picker-cancelled') {
    picking.value = false
    pickerTabId.value = undefined
  }
}

function cancelPicker() {
  if (!picking.value) return
  picking.value = false
  if (pickerTabId.value !== undefined) {
    chrome.tabs.sendMessage(pickerTabId.value, { type: 'cancel-picker' }).catch(() => {})
    pickerTabId.value = undefined
  }
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') cancelPicker()
}

onMounted(() => {
  chrome.runtime.onMessage.addListener(onMessage)
  globalThis.addEventListener('keydown', onKeyDown)
})
onUnmounted(() => {
  cancelPicker()
  // Disconnecting the port triggers the content script's teardown, removing any persisted highlight that outlived the picking session.
  pickerPort?.disconnect()
  pickerPort = undefined
  pickerPortTabId = undefined
  chrome.runtime.onMessage.removeListener(onMessage)
  globalThis.removeEventListener('keydown', onKeyDown)
})

async function pickElement() {
  // Side panel lives in the same window — find the active page tab directly
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  const tab = tabs.find(
    (item) => item.url && !item.url.startsWith('chrome') && !item.url.startsWith('extension')
  )
  if (!tab?.id) return

  connectPickerPort(tab.id)
  pickerTabId.value = tab.id
  picking.value = true
  selector.value = ''
  pageUrl.value = ''
  pageTitle.value = ''

  chrome.tabs.sendMessage(tab.id, { type: 'start-picker' }).catch(() => {
    picking.value = false
  })
}
</script>

<template>
  <div class="space-y-2">
    <UButton
      @click="pickElement"
      :disabled="picking"
      variant="outline"
      icon="i-lucide-square-mouse-pointer"
      size="xl"
      :ui="{ leadingIcon: 'size-5', base: 'w-full justify-center' }"
      :label="picking ? t('picker.picking') : t('picker.pickElement')"
    />

    <div v-if="selector" class="space-y-1 rounded bg-muted p-2 text-sm">
      <div>
        <span class="label-title">{{ t('picker.selector') }}</span>
        <code class="ml-1 break-all text-highlighted">{{ selector }}</code>
      </div>
      <div>
        <span class="label-title">{{ t('picker.url') }}</span>
        <span class="ml-1 break-all text-highlighted">{{ pageUrl }}</span>
      </div>
      <div>
        <span class="label-title">{{ t('picker.page') }}</span>
        <span class="ml-1 text-highlighted">{{ pageTitle }}</span>
      </div>
    </div>
  </div>
</template>
