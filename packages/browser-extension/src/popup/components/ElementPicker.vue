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
const textColors = ref<string[]>([])
const iconColors = ref<string[]>([])
const elementColor = ref('')
const backgroundColor = ref('')
const borderColors = ref<string[]>([])
const picking = ref(false)
const pickerTabId = ref<number | undefined>()
const selectedTabId = ref<number | undefined>()

defineExpose({
  selector,
  pageUrl,
  pageTitle,
  textColors,
  iconColors,
  elementColor,
  backgroundColor,
  borderColors,
  selectedTabId
})

function onMessage(message: {
  type: string
  selector?: string
  url?: string
  pageTitle?: string
  textColors?: string[]
  iconColors?: string[]
  elementColor?: string
  backgroundColor?: string
  borderColors?: string[]
}) {
  if (message.type === 'element-picked') {
    selector.value = message.selector ?? ''
    pageUrl.value = message.url ?? ''
    pageTitle.value = message.pageTitle ?? ''
    textColors.value = (message.textColors ?? []).map(toHex)
    iconColors.value = (message.iconColors ?? []).map(toHex)
    elementColor.value = toHex(message.elementColor ?? '')
    backgroundColor.value = toHex(message.backgroundColor ?? '')
    borderColors.value = (message.borderColors ?? []).map(toHex)
    selectedTabId.value = pickerTabId.value
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
  selectedTabId.value = undefined
  picking.value = true
  selector.value = ''
  pageUrl.value = ''
  pageTitle.value = ''
  textColors.value = []
  iconColors.value = []
  elementColor.value = ''
  backgroundColor.value = ''
  borderColors.value = []

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
      <div v-if="textColors.length" class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span class="label-title">{{ t('picker.text') }}:</span>
        <span v-for="(color, i) in textColors" :key="`text-${i}`" class="flex items-center gap-1">
          <span
            class="inline-block size-3.5 rounded-sm border border-gray-300 dark:border-gray-600 shrink-0"
            :style="{ backgroundColor: color }"
            aria-hidden="true"
          />
          <code class="text-highlighted">{{ color }}</code>
        </span>
      </div>
      <div v-if="iconColors.length" class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span class="label-title">{{ t('picker.icon') }}:</span>
        <span v-for="(color, i) in iconColors" :key="`icon-${i}`" class="flex items-center gap-1">
          <span
            class="inline-block size-3.5 rounded-sm border border-gray-300 dark:border-gray-600 shrink-0"
            :style="{ backgroundColor: color }"
            aria-hidden="true"
          />
          <code class="text-highlighted">{{ color }}</code>
        </span>
      </div>
      <div v-if="elementColor" class="flex items-center gap-1">
        <span class="label-title">{{ t('picker.element') }}:</span>
        <span
          class="ml-1 inline-block size-3.5 rounded-sm border border-gray-300 dark:border-gray-600 shrink-0"
          :style="{ backgroundColor: elementColor }"
          aria-hidden="true"
        />
        <code class="text-highlighted">{{ elementColor }}</code>
      </div>
      <div v-if="backgroundColor" class="flex items-center gap-1">
        <span class="label-title">{{ t('picker.background') }}:</span>
        <span
          class="ml-1 inline-block size-3.5 rounded-sm border border-gray-300 dark:border-gray-600 shrink-0"
          :style="{ backgroundColor: backgroundColor }"
          aria-hidden="true"
        />
        <code class="text-highlighted">{{ backgroundColor }}</code>
      </div>
      <div v-if="borderColors.length" class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span class="label-title">{{ t('picker.border') }}:</span>
        <span
          v-for="(color, i) in borderColors"
          :key="`border-${i}`"
          class="flex items-center gap-1"
        >
          <span
            class="inline-block size-3.5 rounded-sm border border-gray-300 dark:border-gray-600 shrink-0"
            :style="{ backgroundColor: color }"
            aria-hidden="true"
          />
          <code class="text-highlighted">{{ color }}</code>
        </span>
      </div>
    </div>
  </div>
</template>
