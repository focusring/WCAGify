import { getUniqueSelector } from './unique-selector'

function parseRgba(color: string): { r: number; g: number; b: number; a: number } | null {
  if (!color || color === 'none') return null
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.clearRect(0, 0, 1, 1)
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
  return { r, g, b, a }
}

function getEffectiveBackgroundColor(el: Element): string {
  const layers: { r: number; g: number; b: number; a: number }[] = []

  // CSS mask icons use background-color as the icon color, not as a real background —
  // skip the element itself and start from its parent
  let current: Element | null = hasCssMask(el) ? el.parentElement : el
  while (current) {
    const bg = getComputedStyle(current).backgroundColor
    const parsed = parseRgba(bg)
    if (parsed && parsed.a > 0) {
      layers.unshift(parsed)
      if (parsed.a === 255) break // fully opaque — ancestors can't show through
    }
    if (current === document.documentElement) break
    current = current.parentElement
  }

  // Browser default canvas is white
  let r = 255,
    g = 255,
    b = 255

  // Alpha-composite from farthest ancestor down to the target element
  for (const layer of layers) {
    const a = layer.a / 255
    r = Math.round(layer.r * a + r * (1 - a))
    g = Math.round(layer.g * a + g * (1 - a))
    b = Math.round(layer.b * a + b * (1 - a))
  }

  return `rgb(${r}, ${g}, ${b})`
}

const SVG_SHAPE_SELECTOR = 'path, circle, rect, ellipse, polygon, polyline, use'

function isVisible(color: string): boolean {
  const parsed = parseRgba(color)
  return parsed !== null && parsed.a > 0
}

function hasCssMask(el: Element): boolean {
  const style = getComputedStyle(el)
  const mask = style.getPropertyValue('-webkit-mask-image') || style.getPropertyValue('mask-image')
  return mask !== '' && mask !== 'none'
}

function getEffectiveForegroundColor(el: Element): string {
  const style = getComputedStyle(el)

  // CSS mask icons (Iconify/Lucide via @nuxt/icon): the icon shape is a CSS mask,
  // background-color is the actual visible icon color
  if (hasCssMask(el)) return style.backgroundColor

  if (!(el instanceof SVGElement)) return style.color

  // Check own fill, then own stroke
  if (isVisible(style.fill)) return style.fill
  if (isVisible(style.stroke)) return style.stroke

  // Walk descendant shapes — Lucide icons use stroke="currentColor" with fill="none"
  const shapes = el.querySelectorAll(SVG_SHAPE_SELECTOR)
  for (const shape of shapes) {
    const s = getComputedStyle(shape)
    if (isVisible(s.fill)) return s.fill
    if (isVisible(s.stroke)) return s.stroke
  }

  return style.color
}

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
  if (!activeOverlay) return
  activeOverlay.style.pointerEvents = 'none'
  const target = document.elementFromPoint(e.clientX, e.clientY)
  activeOverlay.style.pointerEvents = 'auto'

  if (
    target &&
    target.id !== OVERLAY_ID &&
    target.id !== PANEL_ID &&
    !target.closest(`#${PANEL_ID}`) &&
    !target.classList.contains('wcagify-highlight')
  ) {
    currentTarget = target
    highlightElement(target)
    const selector = getUniqueSelector(target)
    updateInfoPanel(Array.isArray(selector) ? selector.join(' > ') : selector)
  }
}

function handleClick(e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()

  if (!currentTarget) return

  const selector = getUniqueSelector(currentTarget)
  const foregroundColor = getEffectiveForegroundColor(currentTarget)
  chrome.runtime.sendMessage({
    type: 'element-picked',
    selector,
    url: document.URL,
    pageTitle: document.title,
    foregroundColor,
    backgroundColor: getEffectiveBackgroundColor(currentTarget)
  })
  cleanup()
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
})
