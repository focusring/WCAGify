import type { Rgba } from './types'

// Shared 1×1 canvas context for resolving CSS color strings to rgba; reused to avoid per-parse allocation.
let colorCtx: CanvasRenderingContext2D | null | undefined = undefined
function getColorCtx(): CanvasRenderingContext2D | null {
  if (colorCtx === undefined) {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    colorCtx = canvas.getContext('2d')
  }
  return colorCtx
}

// Resolve a CSS color string to rgba, or null for non-color tokens (e.g. "45deg", "to right" from a gradient).
// fillStyle keeps its previous value on an unparseable input; two sentinels distinguish that from a real color.
export function tryParseColor(color: string): Rgba | null {
  if (!color || color === 'none') return null
  const ctx = getColorCtx()
  if (!ctx) return null
  ctx.fillStyle = '#1b2c3d'
  ctx.fillStyle = color
  const resolved = ctx.fillStyle
  ctx.fillStyle = '#e4d3c2'
  ctx.fillStyle = color
  if (ctx.fillStyle !== resolved) return null
  ctx.clearRect(0, 0, 1, 1)
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
  return { r, g, b, a }
}

export function formatLayer(layer: Rgba): string {
  if (layer.a === 255) return `rgb(${layer.r}, ${layer.g}, ${layer.b})`
  return `rgba(${layer.r}, ${layer.g}, ${layer.b}, ${layer.a / 255})`
}

export function sameColor(a: Rgba, b: Rgba): boolean {
  return a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a
}

// Splits on top-level commas, ignoring those inside () or []. Used for gradient stops, background-image layers, and CSS selector lists.
export function splitOuterCommas(s: string): string[] {
  const parts: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (ch === '(' || ch === '[') depth++
    else if (ch === ')' || ch === ']') depth--
    else if (ch === ',' && depth === 0) {
      parts.push(s.slice(start, i).trim())
      start = i + 1
    }
  }
  const last = s.slice(start).trim()
  if (last) parts.push(last)
  return parts
}

export function hasCssMask(el: Element): boolean {
  const style = getComputedStyle(el)
  const mask = style.getPropertyValue('-webkit-mask-image') || style.getPropertyValue('mask-image')
  return mask !== '' && mask !== 'none'
}

// background-clip: text (or -webkit-) — the background paints the element's text glyphs, not a surface.
export function hasTextClip(style: CSSStyleDeclaration): boolean {
  const clip =
    style.getPropertyValue('background-clip') || style.getPropertyValue('-webkit-background-clip')
  return clip.includes('text')
}

// Fraction of el's box covered by child's box — distinguishes a full surface from a small icon/text span.
function boxCoverage(child: Element, elRect: DOMRect): number {
  const c = child.getBoundingClientRect()
  const w = Math.min(elRect.right, c.right) - Math.max(elRect.left, c.left)
  const h = Math.min(elRect.bottom, c.bottom) - Math.max(elRect.top, c.top)
  if (w <= 0 || h <= 0) return 0
  return (w * h) / (elRect.width * elRect.height)
}

// For a transparent wrapper (e.g. <a> around a styled <button>), runs extract on the first descendant covering ≥90%
// of el's box — document order yields the outermost filling surface first. Skips CSS-mask icons.
export function findFillingDescendant<T>(
  el: Element,
  extract: (child: Element) => T | null
): T | null {
  const rect = el.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return null
  for (const child of el.querySelectorAll('*')) {
    if (hasCssMask(child)) continue
    if (boxCoverage(child, rect) < 0.9) continue
    const result = extract(child)
    if (result) return result
  }
  return null
}

export const SVG_SHAPE_SELECTOR = 'path, circle, rect, ellipse, polygon, polyline, use'
