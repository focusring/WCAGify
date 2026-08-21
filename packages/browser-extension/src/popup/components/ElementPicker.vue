<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
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
// Computed content-side (needs live DOM to cross shadow/iframe boundaries), sent with each element-picked message.
const hasParent = ref(false)

// One completed pick, kept whole so the panel can re-render it later without touching the page.
interface HistoryEntry {
  id: string
  pageUrl: string
  pageTitle: string
  selected: ElementInfo
  children: ElementInfo[]
}

const HISTORY_LIMIT = 20
const HISTORY_KEY = 'pickHistory'

const history = ref<HistoryEntry[]>([])
const showHistory = ref(false)
// Entry currently on screen (picked or restored); drives aria-current in the list.
const activeEntryId = ref<string | undefined>()
// True when showing a restored entry: values are frozen, nothing on the page is highlighted, so nav controls go inert.
const viewingSnapshot = ref(false)

const pickButton = ref<{ $el?: HTMLElement }>()
const pickError = ref(false)

const selector = computed(() => selected.value?.selector ?? '')
// Stacking every child section gets unreadable past a handful, so beyond this many they're paginated in groups.
const CHILD_PAGINATION_THRESHOLD = 3
const CHILD_PAGE_SIZE = 3
const isChildPaginated = computed(() => children.value.length > CHILD_PAGINATION_THRESHOLD)
const pagedChildren = computed(() => {
  const start = (childPage.value - 1) * CHILD_PAGE_SIZE
  return children.value.slice(start, start + CHILD_PAGE_SIZE)
})

// Long-lived port to the page tab; its disconnect on panel close is the content script's teardown signal.
let pickerPort: chrome.runtime.Port | undefined = undefined
let pickerPortTabId: number | undefined = undefined

defineExpose({ selector, pageUrl, pageTitle, selectedTabId })

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

function onMessage(
  message: {
    type: string
    url?: string
    pageTitle?: string
    selected?: ElementInfo
    children?: ElementInfo[]
    hasParent?: boolean
  },
  sender: chrome.runtime.MessageSender
) {
  // Broadcasts reach every extension view (each window can host its own side panel), so only apply
  // messages from the tab this panel is picking on or already showing.
  const senderTabId = sender.tab?.id
  if (senderTabId === undefined) return
  if (senderTabId !== pickerTabId.value && senderTabId !== selectedTabId.value) return

  if (message.type === 'element-picked') {
    pageUrl.value = message.url ?? ''
    pageTitle.value = message.pageTitle ?? ''
    selected.value = message.selected ? mapColors(message.selected) : null
    children.value = (message.children ?? []).map(mapColors)
    hasParent.value = message.hasParent ?? false
    childPage.value = 1
    // Fresh pick: pickerTabId holds the source tab. Parent step: it's undefined, so keep the existing tab.
    selectedTabId.value = pickerTabId.value ?? selectedTabId.value
    picking.value = false
    pickerTabId.value = undefined
    viewingSnapshot.value = false
    // A completed pick (fresh or parent/child step) always wins the shared slot back from the history view.
    showHistory.value = false
    recordHistory()
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

// Tears down the page's overlay/highlight; the port itself stays connected for reuse.
function clearPageSelection() {
  const tabId = pickerTabId.value ?? selectedTabId.value
  if (tabId === undefined) return
  chrome.tabs.sendMessage(tabId, { type: 'cancel-picker' }).catch(() => {})
}

// Clears the panel to its pre-pick state. History deliberately survives reset.
function resetPicker() {
  clearPageSelection()
  picking.value = false
  pickerTabId.value = undefined
  selectedTabId.value = undefined
  pageUrl.value = ''
  pageTitle.value = ''
  selected.value = null
  children.value = []
  hasParent.value = false
  childPage.value = 1
  viewingSnapshot.value = false
  activeEntryId.value = undefined
  focusPickButton()
}

function persistHistory() {
  // Round-tripped through JSON to strip Vue's reactive proxies; structuredClone throws DataCloneError on them.
  // eslint-disable-next-line unicorn/prefer-structured-clone
  const plain = JSON.parse(JSON.stringify(history.value)) as HistoryEntry[]
  chrome.storage.local.set({ [HISTORY_KEY]: plain }).catch(() => {})
}

// Re-picking an element already in history refreshes it in place instead of adding a duplicate.
function recordHistory() {
  const info = selected.value
  if (!info) return
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    pageUrl: pageUrl.value,
    pageTitle: pageTitle.value,
    selected: info,
    children: children.value
  }
  history.value = [
    entry,
    ...history.value.filter(
      (item) => item.pageUrl !== entry.pageUrl || item.selected.selector !== entry.selected.selector
    )
  ].slice(0, HISTORY_LIMIT)
  activeEntryId.value = entry.id
  persistHistory()
}

// Re-renders from a stored snapshot; nothing is re-selected on the page (the selector may no longer resolve there).
function restoreHistoryEntry(entry: HistoryEntry) {
  clearPageSelection()
  picking.value = false
  pickerTabId.value = undefined
  selectedTabId.value = undefined
  pageUrl.value = entry.pageUrl
  pageTitle.value = entry.pageTitle
  selected.value = entry.selected
  children.value = entry.children
  hasParent.value = false
  childPage.value = 1
  viewingSnapshot.value = true
  activeEntryId.value = entry.id
  showHistory.value = false
}

function toggleHistory() {
  showHistory.value = !showHistory.value
}

function clearHistory() {
  history.value = []
  activeEntryId.value = undefined
  showHistory.value = false
  persistHistory()
  focusPickButton()
}

// Reset/clear-history remove themselves from the DOM, which would drop focus to <body>; move it to the pick button instead.
function focusPickButton() {
  void nextTick().then(() => pickButton.value?.$el?.focus())
}

function entryLabel(entry: HistoryEntry): string {
  return entry.selected.label || entry.selected.role || entry.selected.selector
}

// Routes to the tab the current selection came from; silently dropped if that tab is gone.
function sendToPage(message: { type: string; index?: number }) {
  if (selectedTabId.value === undefined) return
  chrome.tabs.sendMessage(selectedTabId.value, message).catch(() => {})
}

// Steps the selection up to the parent; result comes back as an element-picked message.
const selectParent = () => sendToPage({ type: 'select-parent' })

// Mirror of selectParent; index is into the full children list, not the current page.
const selectChild = (index: number) => sendToPage({ type: 'select-child', index })

// Outlines the target while a nav button is hovered/focused, so it's visible before committing (focus covers keyboard users).
const previewParent = () => sendToPage({ type: 'preview-parent' })
const previewChild = (index: number) => sendToPage({ type: 'preview-child', index })
const endPreview = () => sendToPage({ type: 'preview-end' })

const childIndex = (i: number) => (childPage.value - 1) * CHILD_PAGE_SIZE + i

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') cancelPicker()
}

onMounted(() => {
  chrome.runtime.onMessage.addListener(onMessage)
  globalThis.addEventListener('keydown', onKeyDown)
  // History outlives the panel (side panel closes constantly); only the list is restored, not a live selection.
  chrome.storage.local
    .get([HISTORY_KEY])
    .then((result) => {
      const stored: unknown = result[HISTORY_KEY]
      if (Array.isArray(stored)) history.value = stored as HistoryEntry[]
    })
    .catch(() => {})
})
onUnmounted(() => {
  cancelPicker()
  // Disconnecting the port triggers teardown of any highlight left on the page.
  pickerPort?.disconnect()
  pickerPort = undefined
  pickerPortTabId = undefined
  chrome.runtime.onMessage.removeListener(onMessage)
  globalThis.removeEventListener('keydown', onKeyDown)
})

async function pickElement() {
  pickError.value = false
  // Side panel lives in the same window; find the active page tab directly.
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  const tab = tabs.find(
    (item) => item.url && !item.url.startsWith('chrome') && !item.url.startsWith('extension')
  )
  if (!tab?.id) {
    pickError.value = true
    return
  }

  connectPickerPort(tab.id)
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
    <!-- Picker Controls -->
    <div class="flex flex-row gap-2">
      <!-- Pick Element Button -->
      <UTooltip :text="t('picker.pickElementTip')">
        <UButton
          ref="pickButton"
          @click="pickElement"
          :disabled="picking"
          variant="outline"
          icon="i-lucide-square-mouse-pointer"
          size="xl"
          :ui="{ leadingIcon: 'size-5', base: 'w-full justify-center' }"
          :label="picking ? t('picker.picking') : t('picker.pickElement')"
        />
      </UTooltip>

      <!-- Reset Button -->
      <UTooltip v-if="selected" :text="t('picker.resetTip')">
        <UButton
          @click="resetPicker"
          :aria-label="t('picker.reset')"
          color="error"
          variant="outline"
          icon="i-lucide-x"
          size="xl"
          :ui="{ leadingIcon: 'size-5', base: 'shrink-0 p-2.5' }"
        />
      </UTooltip>

      <!-- History Button -->
      <UTooltip v-if="history.length" :text="t('picker.historyTip')">
        <UButton
          @click="toggleHistory"
          :aria-expanded="showHistory"
          aria-controls="picker-history"
          :aria-label="t('picker.history')"
          color="neutral"
          variant="outline"
          icon="i-lucide:history"
          size="xl"
          :ui="{ leadingIcon: 'size-5', base: 'shrink-0 p-2.5' }"
        />
      </UTooltip>
    </div>

    <UAlert
      v-if="pickError"
      color="error"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      :description="t('picker.noPageTab')"
    />

    <Transition name="panel-switch" mode="out-in">
      <div
        v-if="showHistory"
        id="picker-history"
        key="history"
        class="space-y-2 rounded bg-muted p-2 text-sm"
      >
        <div class="flex items-center justify-between gap-2">
          <span class="label-title">{{ t('picker.historyTitle') }}</span>
          <UButton
            @click="clearHistory"
            color="neutral"
            variant="outline"
            :ui="{ base: 'shrink-0 gap-1 px-1.5 py-1' }"
            :label="t('picker.historyClear')"
          />
        </div>
        <ul class="space-y-1">
          <li v-for="entry in history" :key="entry.id">
            <UButton
              @click="restoreHistoryEntry(entry)"
              :aria-current="entry.id === activeEntryId ? 'true' : undefined"
              color="neutral"
              variant="outline"
              block
              :ui="{ base: 'justify-start gap-2 px-2 py-1.5 text-left' }"
            >
              <span class="min-w-0 flex-1">
                <span class="block truncate font-medium text-highlighted">
                  {{ entryLabel(entry) }}
                </span>
                <code class="block truncate text-toned">{{ entry.selected.selector }}</code>
              </span>
              <UBadge v-if="entry.selected.role" color="neutral" variant="subtle" size="sm">
                {{ entry.selected.role }}
              </UBadge>
            </UButton>
          </li>
        </ul>
      </div>

      <!-- Selected Element Info -->
      <div v-else-if="selected" key="selected" class="space-y-1 rounded bg-muted p-2 text-sm">
        <div class="flex items-center justify-between gap-2">
          <span class="label-title">{{ t('picker.selector') }}</span>
          <UButton
            @click="selectParent"
            @mouseenter="previewParent"
            @mouseleave="endPreview"
            @focus="previewParent"
            @blur="endPreview"
            :disabled="!hasParent"
            icon="i-lucide-arrow-up"
            color="neutral"
            variant="outline"
            :label="t('picker.selectParent')"
            :ui="{ base: 'shrink-0 gap-1 px-1.5 py-1', leadingIcon: 'size-4.5' }"
          />
        </div>

        <!-- Element Selector -->
        <UTooltip :text="selector">
          <code
            tabindex="0"
            class="block truncate rounded-md px-2.5 py-2 text-xs bg-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >{{ selector }}</code
          >
        </UTooltip>

        <!-- Page URL -->
        <div>
          <span class="label-title">{{ t('picker.url') }}</span>
          <span class="ml-1 break-all text-highlighted">{{ pageUrl }}</span>
        </div>

        <!-- Page Title -->
        <div>
          <span class="label-title">{{ t('picker.page') }}</span>
          <span class="ml-1 text-highlighted">{{ pageTitle }}</span>
        </div>
        <p v-if="viewingSnapshot" class="text-toned">{{ t('picker.historySnapshot') }}</p>
        <PickedElementSection :info="selected" />
        <template v-if="isChildPaginated">
          <template v-for="(child, i) in pagedChildren" :key="`child-${childPage}-${i}`">
            <USeparator class="my-2" />
            <PickedElementSection
              :info="child"
              child
              :snapshot="viewingSnapshot"
              @select="selectChild(childIndex(i))"
              @preview="previewChild(childIndex(i))"
              @preview-end="endPreview"
            />
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
            <PickedElementSection
              :info="child"
              child
              :snapshot="viewingSnapshot"
              @select="selectChild(i)"
              @preview="previewChild(i)"
              @preview-end="endPreview"
            />
          </template>
        </template>
      </div>
    </Transition>
  </div>
</template>
