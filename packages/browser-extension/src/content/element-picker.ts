import { getUniqueSelector } from './unique-selector'
import { collectChildSections, collectElementInfo } from './picker/collect'
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
  const rect = el.getBoundingClientRect()
  const highlight = document.createElement('div')
  highlight.className = 'wcagify-highlight'
  Object.assign(highlight.style, {
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`
  })
  document.body.appendChild(highlight)
}

function clearHighlight() {
  document.querySelectorAll('.wcagify-highlight').forEach((el) => el.remove())
}

function cleanup() {
  clearHighlight()
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
  chrome.runtime.sendMessage({
    type: 'element-picked',
    url: document.URL,
    pageTitle: document.title,
    selected: collectElementInfo(el),
    children: collectChildSections(el),
    hasParent: getNavigableParent(el) !== null
  })
}

function handleClick(e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()

  if (!currentTarget) return

  sendElementPicked(currentTarget)
  cleanup()
}

// Moves the selection up one level (parentElement, or across a shadow/iframe boundary) and re-runs detection on the parent, as if the user had picked it directly.
// No-op when there's nowhere to go.
function selectParent() {
  if (!selectedElement) return
  const parent = getNavigableParent(selectedElement)
  if (!parent) return
  sendElementPicked(parent)
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

chrome.runtime.onMessage.addListener((message: { type: string }) => {
  if (message.type === 'start-picker') {
    startPicker()
  }
  if (message.type === 'cancel-picker') {
    cleanup()
  }
  if (message.type === 'select-parent') {
    selectParent()
  }
})
