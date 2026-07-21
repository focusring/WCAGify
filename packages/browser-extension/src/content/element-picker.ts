import { getUniqueSelector } from './unique-selector'
import { collectChildSections, collectElementInfo } from './picker/collect'
import { resetHoverStylesCache } from './picker/hover'
import { getNavigableParent } from './picker/navigate'
import { getPickTarget, recoverSkippedTarget } from './picker/pick-target'

const OVERLAY_ID = 'wcagify-picker-overlay'
const PANEL_ID = 'wcagify-picker-panel'
const BRAND_COLOR = '#15803d'
const BRAND_COLOR_ALPHA = 'rgba(21, 128, 61, 0.1)'

const pickerStrings = {
  en: { hoverHint: 'Hover over an element...', clickHint: 'Click to select · Esc to cancel' },
  nl: {
    hoverHint: 'Beweeg over een element...',
    clickHint: 'Klik om te selecteren · Esc om te annuleren'
  }
}

let pickerLocale: 'en' | 'nl' = 'en'
let activeOverlay: HTMLElement | undefined = undefined
let infoPanel: HTMLElement | undefined = undefined
let currentTarget: Element | undefined = undefined
let pendingMove: { x: number; y: number } | undefined = undefined
let moveRaf = 0
// The last element sent to the panel. Persists after the overlay is torn down (not cleared by cleanup()) so the "select parent" button can keep walking up from it.
let selectedElement: Element | undefined = undefined
// Source elements of the last-sent child sections, index-aligned, for the "select child" buttons. Persists likewise.
let childElements: Element[] = []
let highlightEl: HTMLElement | undefined = undefined
let highlightTarget: Element | undefined = undefined
let repositionRaf = 0

function injectStyles() {
  if (document.getElementById('wcagify-picker-styles')) return

  const style = document.createElement('style')
  style.id = 'wcagify-picker-styles'
  style.textContent = `
    #${PANEL_ID} {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 2147483647;
      background-color: #fff;
      border-top: 2px solid ${BRAND_COLOR};
      padding: 10px 16px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      color: #1f2937;
      box-shadow: 0 -4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 12px;
      pointer-events: none;
    }
    #${PANEL_ID} .wcagify-logo {
      font-weight: 700;
      color: ${BRAND_COLOR};
      flex-shrink: 0;
    }
    #wcagify-selector-text {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #374151;
      background-color: #f3f4f6;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 13px;
      font-family: ui-monospace, monospace;
    }
    #${PANEL_ID} .wcagify-hint {
      flex-shrink: 0;
      color: #6b7280;
      font-size: 13px;
    }
    #${OVERLAY_ID} {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 2147483646;
      cursor: crosshair;
      pointer-events: auto;
    }
    .wcagify-highlight {
      position: fixed;
      border: 2px solid ${BRAND_COLOR};
      background-color: ${BRAND_COLOR_ALPHA};
      pointer-events: none;
      z-index: 2147483645;
      border-radius: 2px;
    }
    .wcagify-highlight--selected {
      border-style: dotted;
    }
  `
  document.head.appendChild(style)
}

function createInfoPanel(): HTMLElement {
  const panel = document.createElement('div')
  panel.id = PANEL_ID

  const logo = document.createElement('span')
  logo.className = 'wcagify-logo'
  logo.textContent = 'WCAGify'

  const selectorText = document.createElement('code')
  selectorText.id = 'wcagify-selector-text'
  const strings = pickerStrings[pickerLocale]
  selectorText.textContent = strings.hoverHint

  const hint = document.createElement('span')
  hint.className = 'wcagify-hint'
  hint.textContent = strings.clickHint

  panel.appendChild(logo)
  panel.appendChild(selectorText)
  panel.appendChild(hint)

  return panel
}

function updateInfoPanel(selector: string) {
  const text = document.getElementById('wcagify-selector-text')
  if (text) text.textContent = selector
}

function highlightElement(el: Element) {
  clearHighlight()
  highlightTarget = el
  highlightEl = document.createElement('div')
  highlightEl.className = 'wcagify-highlight'
  document.body.appendChild(highlightEl)
  positionHighlight()
  startTracking()
}

// Offset from the target's own viewport to the top document's, walking out through same-origin frames.
// A child section can live in an iframe (rect relative to that frame) while the overlay is positioned in the top document without this shift the outline lands wrong.
// Zero for a top-document target. Frame borders count via clientLeft/clientTop.
function frameOffset(el: Element): { x: number; y: number } {
  let x = 0
  let y = 0
  try {
    let win = el.ownerDocument.defaultView
    while (win?.frameElement) {
      const frame = win.frameElement
      const rect = frame.getBoundingClientRect()
      x += rect.left + frame.clientLeft
      y += rect.top + frame.clientTop
      win = frame.ownerDocument.defaultView
    }
  } catch {
    /* Cross-origin ancestor: nothing better available than the unshifted rect */
  }
  return { x, y }
}

// Track the target's live rect so the overlay stays glued on scroll/resize, hiding when off-screen.
function positionHighlight() {
  if (!highlightEl || !highlightTarget) return

  if (!highlightTarget.isConnected) {
    clearHighlight()
    return
  }

  const rect = highlightTarget.getBoundingClientRect()
  const offset = frameOffset(highlightTarget)
  const top = rect.top + offset.y
  const left = rect.left + offset.x
  const offScreen =
    top + rect.height <= 0 ||
    left + rect.width <= 0 ||
    top >= window.innerHeight ||
    left >= window.innerWidth

  if (offScreen) {
    highlightEl.style.display = 'none'
    return
  }

  Object.assign(highlightEl.style, {
    display: 'block',
    top: `${top}px`,
    left: `${left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`
  })
}

function scheduleReposition() {
  if (repositionRaf) return
  repositionRaf = requestAnimationFrame(() => {
    repositionRaf = 0
    positionHighlight()
  })
}

// Scroll events don't bubble; capture phase catches scrolling in nested containers too, not just the document.
function startTracking() {
  window.addEventListener('scroll', scheduleReposition, { passive: true, capture: true })
  window.addEventListener('resize', scheduleReposition, { passive: true })
}

function stopTracking() {
  window.removeEventListener('scroll', scheduleReposition, { capture: true })
  window.removeEventListener('resize', scheduleReposition)
  if (repositionRaf) {
    cancelAnimationFrame(repositionRaf)
    repositionRaf = 0
  }
}

function clearHighlight() {
  stopTracking()
  document.querySelectorAll('.wcagify-highlight').forEach((el) => el.remove())
  highlightEl = undefined
  highlightTarget = undefined
}

function cleanup(keepHighlight = false) {
  if (!keepHighlight) clearHighlight()
  if (moveRaf) {
    cancelAnimationFrame(moveRaf)
    moveRaf = 0
  }
  pendingMove = undefined
  activeOverlay?.removeEventListener('mousemove', handleMouseMove)
  activeOverlay?.removeEventListener('click', handleClick)
  activeOverlay?.remove()
  activeOverlay = undefined
  infoPanel?.remove()
  infoPanel = undefined
  currentTarget = undefined
  document.removeEventListener('keydown', handleKeyDown)
}

function handleMouseMove(e: MouseEvent) {
  pendingMove = { x: e.clientX, y: e.clientY }
  if (!moveRaf) moveRaf = requestAnimationFrame(processMove)
}

// Resolve at most once per animation frame off the latest cursor position mousemove fires faster than needed, and each resolve runs a hit test plus a bounded subtree scan.
function processMove() {
  moveRaf = 0
  if (!activeOverlay || !pendingMove) return
  const { x, y } = pendingMove

  activeOverlay.style.pointerEvents = 'none'
  const hit = document.elementFromPoint(x, y)
  activeOverlay.style.pointerEvents = 'auto'

  if (
    !hit ||
    hit.id === OVERLAY_ID ||
    hit.id === PANEL_ID ||
    hit.closest(`#${PANEL_ID}`) ||
    hit.classList.contains('wcagify-highlight')
  ) {
    return
  }

  // Recover a pointer-events:none control (e.g. a disabled button) the hit test skipped, then resolve to its interactive unit.
  const resolved = getPickTarget(recoverSkippedTarget(hit, x, y))
  currentTarget = resolved
  highlightElement(resolved)
  const selector = getUniqueSelector(resolved)
  updateInfoPanel(Array.isArray(selector) ? selector.join(' > ') : selector)
}

// Runs the full detection suite on el and pushes results to the panel. Shared by picking and the "select parent" button (same code path).
// hasParent tells the panel whether the button can move up another level.
function sendElementPicked(el: Element) {
  selectedElement = el
  // The overlay tracks whatever the panel is showing, so navigating (e.g. "select parent") moves it too not just hover/click.
  highlightElement(el)
  highlightEl?.classList.add('wcagify-highlight--selected')
  // Fresh stylesheet scan per collection run (a re-pick sees styles injected since), cached across the selected element + all child sections within it.
  resetHoverStylesCache()
  const children = collectChildSections(el)
  // Kept so the panel can name a child by its index in the list it just received.
  childElements = children.elements
  chrome.runtime.sendMessage({
    type: 'element-picked',
    url: document.URL,
    pageTitle: document.title,
    selected: collectElementInfo(el),
    children: children.sections,
    hasParent: getNavigableParent(el) !== null
  })
}

function handleClick(e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()

  if (!currentTarget) return

  sendElementPicked(currentTarget)
  cleanup(true)
}

// Moves the selection up one level (parentElement, or across a shadow/iframe boundary) and re-runs detection on the parent, as if the user had picked it directly.
// No-op when there's nowhere to go.
function selectParent() {
  if (!selectedElement) return
  const parent = getNavigableParent(selectedElement)
  if (!parent) return
  sendElementPicked(parent)
}

// Moves the selection down into a child section the panel is showing, by its index in the list last sent the only way to reach children hover can't land on (pointer-events: none, covered by an overlay, inside a frame).
// Ignores an index the page has since invalidated (re-render between send and click).
function selectChild(index: number) {
  const child = childElements[index]
  if (!child?.isConnected) return
  sendElementPicked(child)
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    cleanup()
    chrome.runtime.sendMessage({ type: 'picker-cancelled' })
  }
}

async function startPicker() {
  cleanup()
  injectStyles()

  try {
    const result = await chrome.storage.local.get(['locale'])
    pickerLocale = result.locale === 'nl' ? 'nl' : 'en'
  } catch {
    /* Default to en */
  }

  infoPanel = createInfoPanel()
  document.body.appendChild(infoPanel)

  activeOverlay = document.createElement('div')
  activeOverlay.id = OVERLAY_ID
  document.body.appendChild(activeOverlay)

  activeOverlay.addEventListener('mousemove', handleMouseMove)
  activeOverlay.addEventListener('click', handleClick)
  document.addEventListener('keydown', handleKeyDown)
}

chrome.runtime.onMessage.addListener((message: { type: string; index?: number }) => {
  if (message.type === 'start-picker') {
    startPicker()
  }
  if (message.type === 'cancel-picker') {
    cleanup()
  }
  if (message.type === 'select-parent') {
    selectParent()
  }
  if (message.type === 'select-child' && typeof message.index === 'number') {
    selectChild(message.index)
  }
})

// The side panel holds an open port while the picker/highlight is alive; its disconnect on close tears everything down.
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'wcagify-picker') return
  port.onDisconnect.addListener(() => cleanup())
})
