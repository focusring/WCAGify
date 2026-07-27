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
// Whether the selection has a parent to step up to. Computed content-side (needs the live DOM to cross shadow/iframe
// boundaries) and sent with each element-picked message.
const hasParent = ref(false)

// One completed pick, kept whole so the panel can re-render it later without touching the page. ElementInfo is pure
// data, so storing and restoring is free.
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
// The entry currently on screen, whether it got there by picking or by restoring drives aria-current in the list.
const activeEntryId = ref<string | undefined>()
// True while the panel shows a restored entry rather than a live selection. The values are frozen at pick time and
// nothing on the page is highlighted, so every navigation control is inert (see restoreHistoryEntry).
const viewingSnapshot = ref(false)

const pickButton = ref<{ $el?: HTMLElement }>()

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
    // On a fresh pick pickerTabId holds the source tab; on a parent step it's undefined, so keep the tab the current
    // selection came from (the navigation buttons message that same tab).
    selectedTabId.value = pickerTabId.value ?? selectedTabId.value
    picking.value = false
    pickerTabId.value = undefined
    viewingSnapshot.value = false
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

// Tells whichever tab currently owns the live selection to tear down its overlay and highlight. The port stays
// connected and is reused on the next pick.
function clearPageSelection() {
  const tabId = pickerTabId.value ?? selectedTabId.value
  if (tabId === undefined) return
  chrome.tabs.sendMessage(tabId, { type: 'cancel-picker' }).catch(() => {})
}

// Clears the panel back to its pre-pick state: aborts a pick in progress and drops a committed selection or restored snapshot.
// History deliberately survives, it's the one thing reset is not meant to throw away.
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
  // Round-tripped through JSON to strip Vue's reactive proxies. structuredClone is not an option here: it throws
  // DataCloneError on a Proxy, and entries hold proxies (they're read back out of refs). ElementInfo is JSON-safe
  // by construction, so nothing is lost in the trip.
  // eslint-disable-next-line unicorn/prefer-structured-clone
  const plain = JSON.parse(JSON.stringify(history.value)) as HistoryEntry[]
  chrome.storage.local.set({ [HISTORY_KEY]: plain }).catch(() => {})
}

// Files the pick the panel just received. Re-picking an element already in the list refreshes it in place at the top
// instead of stacking a near-duplicate; the same selector on a different page stays a separate entry.
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

// Re-renders the panel from a stored snapshot. Nothing is re-selected on the page — the stored selector is a display
// string, not a resolvable address, and the page may have changed since. So selectedTabId is cleared (navigation and
// preview messages then drop in sendToPage) and hasParent is forced false to disable the parent button.
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

// Reset and clear-history both remove themselves from the DOM as they act, so focus would fall to <body>. Move it to
// the pick button, the one control that's always rendered.
function focusPickButton() {
  void nextTick().then(() => pickButton.value?.$el?.focus())
}

// List label for an entry: its accessible name if it has one, else the role, else the bare selector.
function entryLabel(entry: HistoryEntry): string {
  return entry.selected.label || entry.selected.role || entry.selected.selector
}

// Every navigation and preview command goes to the tab the current selection came from, and is dropped if that tab is gone.
function sendToPage(message: { type: string; index?: number }) {
  if (selectedTabId.value === undefined) return
  chrome.tabs.sendMessage(selectedTabId.value, message).catch(() => {})
}

// Asks the content script to step the selection up to the parent and re-run detection.
// The result returns as an element-picked message, replacing the panel's values in place.
const selectParent = () => sendToPage({ type: 'select-parent' })

// Mirror of selectParent: steps down into a child section by its index in the children list the content script sent
// (paginated views pass the index into the full list, not the page).
const selectChild = (index: number) => sendToPage({ type: 'select-child', index })

// Outlines the element a navigation button would select, for as long as it's hovered or focused, so the target is visible before committing.
// Keyboard users get the same preview on focus, which is the only way to see the target without a pointer.
const previewParent = () => sendToPage({ type: 'preview-parent' })
const previewChild = (index: number) => sendToPage({ type: 'preview-child', index })
const endPreview = () => sendToPage({ type: 'preview-end' })

// Index into the full children list for a section rendered on the current page.
const childIndex = (i: number) => (childPage.value - 1) * CHILD_PAGE_SIZE + i

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') cancelPicker()
}

onMounted(() => {
  chrome.runtime.onMessage.addListener(onMessage)
  globalThis.addEventListener('keydown', onKeyDown)
  // History outlives the panel, the side panel closes constantly, and a list that emptied itself each time would be useless.
  // Only the list is restored; the panel still opens with nothing selected.
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
  // Disconnecting the port triggers teardown, removing any highlight that outlived the picking session.
  pickerPort?.disconnect()
  pickerPort = undefined
  pickerPortTabId = undefined
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
    <div class="flex flex-row gap-2">
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

      <UButton
        v-if="selected"
        @click="resetPicker"
        :aria-label="t('picker.reset')"
        :title="t('picker.reset')"
        color="error"
        variant="outline"
        icon="i-lucide-x"
        size="xl"
        :ui="{ leadingIcon: 'size-5', base: 'shrink-0 p-2.5' }"
      />

      <UButton
        v-if="history.length"
        @click="toggleHistory"
        :aria-expanded="showHistory"
        aria-controls="picker-history"
        :aria-label="t('picker.history')"
        :title="t('picker.history')"
        color="neutral"
        variant="outline"
        icon="i-lucide:history"
        size="xl"
        :ui="{ leadingIcon: 'size-5', base: 'shrink-0 p-2.5' }"
      />
    </div>

    <Transition name="collapsible">
      <div v-show="showHistory" id="picker-history" class="grid">
        <div class="overflow-hidden min-h-0">
          <div class="space-y-2 rounded bg-muted p-2 text-sm">
            <div class="flex items-center justify-between gap-2">
              <span class="label-title">{{ t('picker.historyTitle') }}</span>
              <UButton
                @click="clearHistory"
                color="neutral"
                variant="ghost"
                size="xs"
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
        </div>
      </div>
    </Transition>

    <div v-if="selected" class="space-y-1 rounded bg-muted p-2 text-sm">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <span class="label-title">{{ t('picker.selector') }}</span>
          <code class="ml-1 break-all text-highlighted">{{ selector }}</code>
        </div>
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
      <div>
        <span class="label-title">{{ t('picker.url') }}</span>
        <span class="ml-1 break-all text-highlighted">{{ pageUrl }}</span>
      </div>
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
  </div>
</template>
