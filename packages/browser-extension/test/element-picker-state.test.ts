// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ui from '@nuxt/ui/vue-plugin'
import UApp from '@nuxt/ui/components/App.vue'
import ElementPicker from '../src/popup/components/ElementPicker.vue'
import type { ElementInfo } from '../src/content/picker/types'

// Mirrors main.ts's `app.use(ui)` so <UButton>/<UTooltip>/etc. resolve to real components relies on
// vitest.config.ts running the same @nuxt/ui/vite plugin as the real build. <UTooltip> also needs a
// TooltipProvider ancestor (real usage gets one from <UApp>, see App.vue), so ElementPicker is mounted
// inside UApp here too; toaster disabled since nothing under test uses it.

/**
 * Covers ElementPicker.vue's pick-session/message-passing/history state machine (previously untested;
 * existing tests only cover the content-script DOM detectors). Locks in the sender-tab filtering fix:
 * without it, one window's idle picker would silently apply another window's pick broadcast.
 */

function mockElementInfo(overrides: Partial<ElementInfo> = {}): ElementInfo {
  return {
    selector: 'button.primary',
    role: 'button',
    ariaHidden: false,
    disabled: false,
    label: 'Submit',
    hasHoverStyles: false,
    textColors: [],
    iconColors: [],
    elementColor: '',
    elementGradient: null,
    background: { color: '', media: null, gradient: null, blur: false },
    borderColors: [],
    ringColors: [],
    boxShadowColors: [],
    outlineColor: '',
    media: null,
    ...overrides
  }
}

interface FakePort {
  onDisconnect: { addListener: (fn: () => void) => void }
  disconnect: () => void
  postMessage: () => void
}

function installChromeMock() {
  const messageListeners: Array<
    (message: Record<string, unknown>, sender: chrome.runtime.MessageSender) => void
  > = []
  let storage: Record<string, unknown> = {}
  let queryResult: chrome.tabs.Tab[] = [{ id: 1, url: 'https://example.com' } as chrome.tabs.Tab]

  const chromeMock = {
    runtime: {
      lastError: undefined as { message: string } | undefined,
      onMessage: {
        addListener: vi.fn((fn: (typeof messageListeners)[number]) => messageListeners.push(fn)),
        removeListener: vi.fn((fn: (typeof messageListeners)[number]) => {
          const i = messageListeners.indexOf(fn)
          if (i !== -1) messageListeners.splice(i, 1)
        })
      }
    },
    tabs: {
      query: vi.fn(async () => queryResult),
      sendMessage: vi.fn(() => Promise.resolve()),
      connect: vi.fn((): FakePort => {
        const disconnectListeners: Array<() => void> = []
        return {
          onDisconnect: { addListener: (fn: () => void) => disconnectListeners.push(fn) },
          disconnect: vi.fn(() => disconnectListeners.forEach((fn) => fn())),
          postMessage: vi.fn()
        }
      })
    },
    storage: {
      local: {
        get: vi.fn(async (keys: string[]) => {
          const result: Record<string, unknown> = {}
          for (const key of keys) if (key in storage) result[key] = storage[key]
          return result
        }),
        set: vi.fn(async (obj: Record<string, unknown>) => {
          storage = { ...storage, ...obj }
        })
      }
    }
  }

  vi.stubGlobal('chrome', chromeMock)

  return {
    chromeMock,
    emit: (message: Record<string, unknown>, tabId: number) =>
      messageListeners.forEach((fn) => fn(message, { tab: { id: tabId } } as never)),
    setQueryResult: (tabs: chrome.tabs.Tab[]) => {
      queryResult = tabs
    },
    getStorage: () => storage
  }
}

function mountElementPicker() {
  return mount(UApp, {
    props: { toaster: null },
    global: { plugins: [ui] },
    slots: { default: ElementPicker }
  })
}

async function mountPicker() {
  const chrome = installChromeMock()
  const wrapper = mountElementPicker()
  await flushPromises()
  const picker = wrapper.findComponent(ElementPicker)
  return { wrapper, picker, chrome }
}

async function pickAndSelect(
  wrapper: ReturnType<typeof mount>,
  chrome: ReturnType<typeof installChromeMock>,
  info: ElementInfo = mockElementInfo()
) {
  await wrapper.find('button').trigger('click')
  await flushPromises()
  chrome.emit(
    { type: 'element-picked', url: 'https://example.com', pageTitle: 'Example', selected: info },
    1
  )
  await flushPromises()
}

describe('ElementPicker pick session', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('starts a pick session on the active eligible tab', async () => {
    const { wrapper, chrome } = await mountPicker()
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(chrome.chromeMock.tabs.query).toHaveBeenCalledWith({
      active: true,
      currentWindow: true
    })
    expect(chrome.chromeMock.tabs.sendMessage).toHaveBeenCalledWith(1, { type: 'start-picker' })
    expect(wrapper.text()).toContain('Picking')
  })

  it('shows an error instead of silently doing nothing when no eligible page tab exists', async () => {
    const { wrapper, chrome } = await mountPicker()
    chrome.setQueryResult([{ id: 2, url: 'chrome://extensions' } as chrome.tabs.Tab])

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(chrome.chromeMock.tabs.sendMessage).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('No page tab found')
  })

  it('applies an element-picked message from the picking tab', async () => {
    const { wrapper, picker, chrome } = await mountPicker()
    await pickAndSelect(wrapper, chrome, mockElementInfo({ selector: '#submit-button' }))

    expect(picker.vm.selector).toBe('#submit-button')
    expect(picker.vm.pageUrl).toBe('https://example.com')
    expect(picker.vm.selectedTabId).toBe(1)
  })

  it('ignores an element-picked broadcast from an unrelated tab/window', async () => {
    const { wrapper, picker, chrome } = await mountPicker()
    await wrapper.find('button').trigger('click')
    await flushPromises()

    // A different window's picker broadcasts its pick on tab 99; this panel (bound to tab 1) must ignore it.
    chrome.emit(
      {
        type: 'element-picked',
        url: 'https://other-window.example',
        selected: mockElementInfo({ selector: '.unrelated' })
      },
      99
    )
    await flushPromises()

    expect(picker.vm.selector).toBe('')
    expect(picker.vm.pageUrl).toBe('')
  })

  it('persists a completed pick to chrome.storage.local and restores it as history on remount', async () => {
    const { wrapper, chrome } = await mountPicker()
    await pickAndSelect(wrapper, chrome, mockElementInfo({ selector: '#saved-el', label: 'Saved' }))

    expect(chrome.chromeMock.storage.local.set).toHaveBeenCalled()
    const stored = chrome.getStorage().pickHistory as Array<{ selected: { selector: string } }>
    expect(stored).toHaveLength(1)
    expect(stored[0]?.selected.selector).toBe('#saved-el')

    // A fresh mount (side panel reopened) restores the entry into History, visible once opened rather
    // than on the idle screen.
    const wrapper2 = mountElementPicker()
    await flushPromises()
    const historyButton = wrapper2
      .findAll('button')
      .find((b) => b.attributes('aria-label') === 'History')
    expect(historyButton).toBeDefined()
    await historyButton?.trigger('click')
    expect(wrapper2.text()).toContain('Saved')
  })

  it('resets the selection while keeping history', async () => {
    const { wrapper, picker, chrome } = await mountPicker()
    await pickAndSelect(wrapper, chrome)
    expect(picker.vm.selector).not.toBe('')

    const resetButton = wrapper
      .findAll('button')
      .find((b) => b.attributes('aria-label') === 'Reset selection')
    await resetButton?.trigger('click')
    await flushPromises()

    expect(picker.vm.selector).toBe('')
    expect(chrome.getStorage().pickHistory).toHaveLength(1)
  })
})
