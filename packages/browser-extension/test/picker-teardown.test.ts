// @vitest-environment happy-dom
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'

// When the panel's port disconnects, the content script must drop the selection and child elements that cleanup()
// keeps for select-parent/child. Retention isn't observable, so the proxy is behaviour: a stale select-parent must do nothing.
// happy-dom has no layout, so the hit test (document.elementFromPoint) is stubbed.

type MessageListener = (message: Record<string, unknown>) => void
interface FakePort {
  name: string
  onDisconnect: { addListener: (fn: () => void) => void }
}

let sendToPage: MessageListener = () => {}
let connect: ((port: FakePort) => void) | undefined
const sentMessages: Array<Record<string, unknown>> = []

beforeAll(async () => {
  vi.stubGlobal('chrome', {
    runtime: {
      onMessage: { addListener: (fn: MessageListener) => (sendToPage = fn) },
      onConnect: { addListener: (fn: (port: FakePort) => void) => (connect = fn) },
      sendMessage: (message: Record<string, unknown>) => sentMessages.push(message)
    },
    storage: { local: { get: vi.fn(async () => ({})) } }
  })
  // Registers its chrome listeners at import time, so it loads after the stub.
  await import('../src/content/element-picker')
})

// Opens the port the panel would hold, and returns the disconnect its close would fire.
function openPanelPort(): () => void {
  const disconnects: Array<() => void> = []
  connect?.({
    name: 'wcagify-picker',
    onDisconnect: { addListener: (fn: () => void) => disconnects.push(fn) }
  })
  return () => disconnects.forEach((fn) => fn())
}

// Drives a full pick: start, move the cursor onto the stubbed hit, then click.
async function pick(target: Element): Promise<void> {
  document.elementFromPoint = () => target
  sendToPage({ type: 'start-picker' })
  await vi.waitFor(() => expect(document.getElementById('wcagify-picker-overlay')).not.toBeNull())
  const overlay = document.getElementById('wcagify-picker-overlay')!
  overlay.dispatchEvent(new MouseEvent('mousemove', { clientX: 10, clientY: 10, bubbles: true }))
  await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
  overlay.dispatchEvent(
    new MouseEvent('click', { clientX: 10, clientY: 10, bubbles: true, cancelable: true })
  )
}

const pickedMessages = (): Record<string, unknown>[] =>
  sentMessages.filter((message) => message.type === 'element-picked')

describe('picker teardown on panel disconnect', () => {
  beforeEach(() => {
    sentMessages.length = 0
    document.body.innerHTML = '<div id="card"><button id="btn">Buy</button></div>'
  })

  it('keeps answering select-parent while the panel is open', async () => {
    openPanelPort()
    await pick(document.getElementById('btn')!)
    sentMessages.length = 0

    sendToPage({ type: 'select-parent' })
    expect(pickedMessages()).toHaveLength(1)
  })

  it('drops the selection when the panel disconnects, so a stale select-parent does nothing', async () => {
    const disconnect = openPanelPort()
    await pick(document.getElementById('btn')!)
    disconnect()
    sentMessages.length = 0

    sendToPage({ type: 'select-parent' })
    sendToPage({ type: 'select-child', index: 0 })
    expect(pickedMessages()).toHaveLength(0)
  })
})
