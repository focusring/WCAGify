<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from '../../composables/useI18n'
import PickedElementSection from './PickedElementSection.vue'
import type { ElementInfo } from '../../content/picker/types'

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

// Convert every color field of a detected element to hex for display, leaving structure/labels untouched.
function mapColors(info: ElementInfo): ElementInfo {
  return {
    ...info,
    textColors: info.textColors.map(toHex),
    iconColors: info.iconColors.map(toHex),
    elementColor: toHex(info.elementColor),
    elementGradient: info.elementGradient
      ? { type: info.elementGradient.type, colors: info.elementGradient.colors.map(toHex) }
      : null,
    background: {
      ...info.background,
      color: toHex(info.background.color),
      gradient: info.background.gradient
        ? {
            type: info.background.gradient.type,
            colors: info.background.gradient.colors.map(toHex)
          }
        : null
    },
    borderColors: info.borderColors.map(toHex),
    ringColors: info.ringColors.map(toHex),
    boxShadowColors: info.boxShadowColors.map(toHex),
    outlineColor: toHex(info.outlineColor)
  }
}

const pageUrl = ref('')
const pageTitle = ref('')
const selected = ref<ElementInfo | null>(null)
const children = ref<ElementInfo[]>([])
const picking = ref(false)
const pickerTabId = ref<number | undefined>()
const selectedTabId = ref<number | undefined>()
const childPage = ref(1)
// Whether the selected element has a meaningful parent to step up to. Computed content-side (needs the live DOM to cross shadow/iframe boundaries) and sent with each element-picked message.
const hasParent = ref(false)

const selector = computed(() => selected.value?.selector ?? '')
// Stacking every child section gets unreadable past a handful, so beyond this many they're paginated in groups.
const CHILD_PAGINATION_THRESHOLD = 3
const CHILD_PAGE_SIZE = 3
const isChildPaginated = computed(() => children.value.length > CHILD_PAGINATION_THRESHOLD)
const pagedChildren = computed(() => {
  const start = (childPage.value - 1) * CHILD_PAGE_SIZE
  return children.value.slice(start, start + CHILD_PAGE_SIZE)
})

defineExpose({ selector, pageUrl, pageTitle, selectedTabId })

function onMessage(message: {
  type: string
  url?: string
  pageTitle?: string
  selected?: ElementInfo
  children?: ElementInfo[]
  hasParent?: boolean
}) {
  if (message.type === 'element-picked') {
    pageUrl.value = message.url ?? ''
    pageTitle.value = message.pageTitle ?? ''
    selected.value = message.selected ? mapColors(message.selected) : null
    children.value = (message.children ?? []).map(mapColors)
    hasParent.value = message.hasParent ?? false
    childPage.value = 1
    // On a fresh pick pickerTabId holds the source tab; on a parent step it's undefined, so keep the tab the current selection came from (the "select parent" button messages that same tab).
    selectedTabId.value = pickerTabId.value ?? selectedTabId.value
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

// Asks the content script to step the selection up to the parent and re-run detection.
// The result returns as an element-picked message, replacing the panel's values in place.
function selectParent() {
  if (selectedTabId.value === undefined) return
  chrome.tabs.sendMessage(selectedTabId.value, { type: 'select-parent' }).catch(() => {})
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
  // Side panel lives in the same window find the active page tab directly
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  const tab = tabs.find(
    (item) => item.url && !item.url.startsWith('chrome') && !item.url.startsWith('extension')
  )
  if (!tab?.id) return

  pickerTabId.value = tab.id
  selectedTabId.value = undefined
  picking.value = true
  pageUrl.value = ''
  pageTitle.value = ''
  selected.value = null
  children.value = []
  hasParent.value = false

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

    <div v-if="selected" class="space-y-1 rounded bg-muted p-2 text-sm">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <span class="label-title">{{ t('picker.selector') }}</span>
          <code class="ml-1 break-all text-highlighted">{{ selector }}</code>
        </div>
        <UButton
          @click="selectParent"
          :disabled="!hasParent"
          icon="i-lucide-arrow-up"
          size="xs"
          color="neutral"
          variant="outline"
          :label="t('picker.selectParent')"
          :ui="{ base: 'shrink-0' }"
        />
      </div>
      <div>
        <span class="label-title">{{ t('picker.url') }}</span>
        <span class="ml-1 break-all text-highlighted">{{ pageUrl }}</span>
      </div>
      <div>
        <span class="label-title">{{ t('picker.page') }}</span>
        <span class="ml-1 text-highlighted">{{ pageTitle }}</span>
      </div>
      <PickedElementSection :info="selected" />
      <template v-if="isChildPaginated">
        <template v-for="(child, i) in pagedChildren" :key="`child-${childPage}-${i}`">
          <USeparator class="my-2" />
          <PickedElementSection :info="child" child />
        </template>
        <div class="flex justify-center mt-4">
          <UPagination
            v-model:page="childPage"
            :total="children.length"
            :items-per-page="CHILD_PAGE_SIZE"
            :sibling-count="0"
            show-edges
            size="sm"
          />
        </div>
      </template>
      <template v-else>
        <template v-for="(child, i) in children" :key="`child-${i}`">
          <USeparator class="my-2" />
          <PickedElementSection :info="child" child />
        </template>
      </template>
    </div>
  </div>
</template>
