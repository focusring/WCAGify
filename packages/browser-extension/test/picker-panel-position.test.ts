// @vitest-environment happy-dom
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'

/**
 * Covers moving the picker's info bar between the bottom and top of the page (arrow keys on the
 * page, or a move-picker-panel message from the side panel), so it can be moved off content it would
 * hide, like a short footer. Only the class toggle is checked: happy-dom does no layout.
 */

type MessageListener = (message: Record<string, unknown>) => void
let sendToPage: MessageListener = () => {}

beforeAll(async () => {
  vi.stubGlobal('chrome', {
    runtime: {
      onMessage: { addListener: (fn: MessageListener) => (sendToPage = fn) },
      onConnect: { addListener: () => {} },
      sendMessage: vi.fn()
    },
    storage: { local: { get: vi.fn(async () => ({})) } }
  })
  // The content script registers its chrome listeners at import time, so it's loaded after the stub.
  await import('../src/content/element-picker')
})

const panel = () => document.getElementById('wcagify-picker-panel')
const isOnTop = () => panel()?.classList.contains('wcagify-picker-panel--top')
// Alt is what separates a bar-move from an ordinary arrow key the page should still scroll with, so it
// defaults to on here and the bare-key case passes altKey: false. Returns false once preventDefault() ran.
const pressKey = (key: string, options: { target?: EventTarget; altKey?: boolean } = {}) =>
  (options.target ?? document).dispatchEvent(
    new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      altKey: options.altKey ?? true
    })
  )

async function startPicker() {
  sendToPage({ type: 'start-picker' })
  await vi.waitFor(() => expect(panel()).not.toBeNull())
}

describe('picker info bar position', () => {
  beforeEach(async () => {
    await startPicker()
    pressKey('ArrowDown')
  })

  it('starts at the bottom and moves with Alt+arrow keys', () => {
    expect(isOnTop()).toBe(false)
    pressKey('ArrowUp')
    expect(isOnTop()).toBe(true)
    pressKey('ArrowDown')
    expect(isOnTop()).toBe(false)
  })

  it('moves on a move-picker-panel message from the side panel', () => {
    sendToPage({ type: 'move-picker-panel', top: true })
    expect(isOnTop()).toBe(true)
  })

  it('keeps the top position for the next pick on the same page', async () => {
    pressKey('ArrowUp')
    sendToPage({ type: 'cancel-picker' })
    expect(panel()).toBeNull()

    await startPicker()
    expect(isOnTop()).toBe(true)
  })

  it('leaves a bare arrow key to the page, so keyboard scrolling still works', () => {
    expect(pressKey('ArrowUp', { altKey: false })).toBe(true)
    expect(isOnTop()).toBe(false)
  })

  it('leaves arrow keys typed in a page text field alone', () => {
    const input = document.createElement('input')
    document.body.appendChild(input)
    pressKey('ArrowUp', { target: input })
    input.remove()
    expect(isOnTop()).toBe(false)
  })
})
