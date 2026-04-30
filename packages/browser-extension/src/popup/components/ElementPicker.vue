<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from '../../composables/useI18n'

const { t } = useI18n()

function toHex(color: string): string {
  if (!color) return color
  const hex = color.match(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/)
  if (hex) return color.toLowerCase()
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
  if (a === 255) {
    return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
  }
  return '#' + [r, g, b, a].map((v) => v.toString(16).padStart(2, '0')).join('')
}

const selector = ref('')
const pageUrl = ref('')
const pageTitle = ref('')
const foregroundColor = ref('')
const backgroundColor = ref('')
const picking = ref(false)
const pickerTabId = ref<number | undefined>()

defineExpose({ selector, pageUrl, pageTitle, foregroundColor, backgroundColor })

function onMessage(message: {
  type: string
  selector?: string
  url?: string
  pageTitle?: string
  foregroundColor?: string
  backgroundColor?: string
}) {
  if (message.type === 'element-picked') {
    selector.value = message.selector ?? ''
    pageUrl.value = message.url ?? ''
    pageTitle.value = message.pageTitle ?? ''
    foregroundColor.value = toHex(message.foregroundColor ?? '')
    backgroundColor.value = toHex(message.backgroundColor ?? '')
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

  pickerTabId.value = tab.id
  picking.value = true
  selector.value = ''
  pageUrl.value = ''
  pageTitle.value = ''
  foregroundColor.value = ''
  backgroundColor.value = ''

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
      :ui="{ leadingIcon: 'size-5', base: 'cursor-pointer selectable-focus w-full justify-center' }"
      :label="picking ? t('picker.picking') : t('picker.pickElement')"
    />

    <div v-if="selector" class="space-y-1 rounded bg-muted p-2 text-sm">
      <div>
        <span class="font-medium text-gray-600 dark:text-gray-400">{{ t('picker.selector') }}</span>
        <code class="ml-1 break-all text-gray-800 dark:text-gray-200">{{ selector }}</code>
      </div>
      <div>
        <span class="font-medium text-gray-600 dark:text-gray-400">{{ t('picker.url') }}</span>
        <span class="ml-1 break-all text-gray-800 dark:text-gray-200">{{ pageUrl }}</span>
      </div>
      <div>
        <span class="font-medium text-gray-600 dark:text-gray-400">{{ t('picker.page') }}</span>
        <span class="ml-1 text-gray-800 dark:text-gray-200">{{ pageTitle }}</span>
      </div>
      <div v-if="foregroundColor" class="flex items-center gap-1">
        <span class="font-medium text-gray-600 dark:text-gray-400">{{
          t('picker.foregroundColor')
        }}</span>
        <span
          class="ml-1 inline-block size-3.5 rounded-sm border border-gray-300 dark:border-gray-600 shrink-0"
          :style="{ backgroundColor: foregroundColor }"
          aria-hidden="true"
        />
        <code class="text-gray-800 dark:text-gray-200">{{ foregroundColor }}</code>
      </div>
      <div v-if="backgroundColor" class="flex items-center gap-1">
        <span class="font-medium text-gray-600 dark:text-gray-400">{{
          t('picker.backgroundColor')
        }}</span>
        <span
          class="ml-1 inline-block size-3.5 rounded-sm border border-gray-300 dark:border-gray-600 shrink-0"
          :style="{ backgroundColor: backgroundColor }"
          aria-hidden="true"
        />
        <code class="text-gray-800 dark:text-gray-200">{{ backgroundColor }}</code>
      </div>
    </div>
  </div>
</template>
