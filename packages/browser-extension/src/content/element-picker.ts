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

// Splits a string by top-level commas (ignoring commas inside parentheses)
function splitOuterCommas(s: string): string[] {
  const parts: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (ch === '(') depth++
    else if (ch === ')') depth--
    else if (ch === ',' && depth === 0) {
      parts.push(s.slice(start, i).trim())
      start = i + 1
    }
  }
  const last = s.slice(start).trim()
  if (last) parts.push(last)
  return parts
}

// Tries to parse a CSS color string; returns null for non-color tokens (e.g. "45deg", "to right")
function tryParseColor(color: string): { r: number; g: number; b: number; a: number } | null {
  if (!color || color === 'none') return null
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.fillStyle = '#1b2c3d'
  const sentinel = ctx.fillStyle
  ctx.fillStyle = color
  if (ctx.fillStyle === sentinel) return null
  ctx.clearRect(0, 0, 1, 1)
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
  return { r, g, b, a }
}

// Extracts just the color portion from a gradient color stop (strips position hints like "10%")
function extractColorFromStop(stop: string): string {
  stop = stop.trim()
  if (stop.startsWith('#')) return stop.split(/\s+/)[0]!
  const funcMatch = /^[a-z-]+\(/i.exec(stop)
  if (funcMatch) {
    let depth = 0
    for (let i = funcMatch[0].length - 1; i < stop.length; i++) {
      if (stop[i] === '(') depth++
      else if (stop[i] === ')') {
        depth--
        if (depth === 0) return stop.slice(0, i + 1)
      }
    }
  }
  return stop.split(/\s+/)[0]!
}

// Computes a representative (averaged) color from a CSS gradient string
function parseGradientAvgColor(
  gradient: string
): { r: number; g: number; b: number; a: number } | null {
  const match = /^(?:linear|radial|conic)-gradient\(\s*([\s\S]*?)\s*\)$/i.exec(gradient.trim())
  if (!match) return null

  const colors: { r: number; g: number; b: number; a: number }[] = []
  for (const arg of splitOuterCommas(match[1] ?? '')) {
    const parsed = tryParseColor(extractColorFromStop(arg))
    if (parsed) colors.push(parsed)
  }
  if (colors.length === 0) return null

  const sum = colors.reduce(
    (acc, c) => ({ r: acc.r + c.r, g: acc.g + c.g, b: acc.b + c.b, a: acc.a + c.a }),
    { r: 0, g: 0, b: 0, a: 0 }
  )
  return {
    r: Math.round(sum.r / colors.length),
    g: Math.round(sum.g / colors.length),
    b: Math.round(sum.b / colors.length),
    a: Math.round(sum.a / colors.length)
  }
}

// Gets the background color contribution of a single element, checking gradient images first
function getElementBgLayer(el: Element): { r: number; g: number; b: number; a: number } | null {
  const style = getComputedStyle(el)
  const bgImage = style.backgroundImage

  if (bgImage && bgImage !== 'none') {
    for (const layer of splitOuterCommas(bgImage)) {
      if (/^(?:linear|radial|conic)-gradient\(/i.test(layer)) {
        const gradColor = parseGradientAvgColor(layer)
        if (gradColor) {
          // Composite gradient on top of this element's backgroundColor
          const bgParsed = parseRgba(style.backgroundColor)
          if (!bgParsed || bgParsed.a === 0) return gradColor
          const ga = gradColor.a / 255
          const bga = bgParsed.a / 255
          const outA = ga + bga * (1 - ga)
          if (outA === 0) return null
          return {
            r: Math.round((gradColor.r * ga + bgParsed.r * bga * (1 - ga)) / outA),
            g: Math.round((gradColor.g * ga + bgParsed.g * bga * (1 - ga)) / outA),
            b: Math.round((gradColor.b * ga + bgParsed.b * bga * (1 - ga)) / outA),
            a: Math.round(outA * 255)
          }
        }
      }
    }
  }

  return parseRgba(style.backgroundColor)
}

function getEffectiveBackgroundColor(el: Element): string {
  const layers: { r: number; g: number; b: number; a: number }[] = []

  // CSS mask icons use background-color as the icon color, not as a real background —
  // skip the element itself and start from its parent
  let current: Element | null = hasCssMask(el) ? el.parentElement : el
  while (current) {
    const layer = getElementBgLayer(current)
    if (layer && layer.a > 0) {
      layers.unshift(layer)
      if (layer.a === 255) break // fully opaque — ancestors can't show through
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
