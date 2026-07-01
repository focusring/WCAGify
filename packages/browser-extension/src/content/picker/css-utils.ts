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

// getComputedStyle emits colors almost exclusively as rgb()/rgba(), so a direct numeric parse resolves the common case
// without the canvas getImageData readback below. Covers legacy comma syntax and modern space/slash syntax with integer
// channels and a numeric-or-percentage alpha; returns null (→ canvas) for hex, named, hsl, oklch, color(), percentage
// channels and anything malformed. Channels stay exact here, so semi-transparent colors avoid the small
// premultiplied-rounding drift the canvas path introduces.
const RGB_FUNC = /^rgba?\(([^)]+)\)$/i
function fastParseRgb(color: string): Rgba | null {
  const m = RGB_FUNC.exec(color.trim())
  if (!m) return null
  const parts = m[1]!
    .replace('/', ' ')
    .split(/[\s,]+/)
    .filter(Boolean)
  if (parts.length < 3 || parts.length > 4) return null
  const rgb: number[] = []
  for (let i = 0; i < 3; i++) {
    const channel = parts[i]!
    if (channel.includes('%')) return null // percentage channels are rare — defer to canvas
    const n = Number(channel)
    if (!Number.isFinite(n)) return null
    rgb.push(Math.max(0, Math.min(255, Math.round(n))))
  }
  let a = 255
  if (parts.length === 4) {
    const alpha = parts[3]!
    const value = alpha.endsWith('%') ? Number(alpha.slice(0, -1)) / 100 : Number(alpha)
    if (!Number.isFinite(value)) return null
    a = Math.max(0, Math.min(255, Math.round(value * 255)))
  }
  return { r: rgb[0]!, g: rgb[1]!, b: rgb[2]!, a }
}

// Resolve a CSS color string to rgba, or null for non-color tokens (e.g. "45deg", "to right" from a gradient).
// Tries the rgb()/rgba() fast path first; otherwise resolves via canvas fillStyle, which keeps its previous value on an
// unparseable input — two sentinels distinguish that from a real color.
export function tryParseColor(color: string): Rgba | null {
  if (!color || color === 'none') return null
  const fast = fastParseRgb(color)
  if (fast) return fast
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

export function hasCssMask(style: CSSStyleDeclaration): boolean {
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
  extract: (childStyle: CSSStyleDeclaration) => T | null
): T | null {
  const rect = el.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return null
  for (const child of el.querySelectorAll('*')) {
    const childStyle = getComputedStyle(child)
    if (hasCssMask(childStyle)) continue
    if (boxCoverage(child, rect) < 0.9) continue
    const result = extract(childStyle)
    if (result) return result
  }
  return null
}

// One document-order pass over el and its descendants that reads each element's computed style once, so the icon-mask
// and clip-text-fill detectors don't each walk the subtree separately. Collects the background-color of every CSS-mask
// element (icon paint) and the background-image of every background-clip:text element (text fill — the caller resolves
// these to a gradient). el is visited first, reusing elStyle.
export interface DescendantScan {
  maskBackgroundColors: string[]
  clipTextBackgroundImages: string[]
}

export function scanDescendants(
  el: Element,
  elStyle: CSSStyleDeclaration = getComputedStyle(el)
): DescendantScan {
  const maskBackgroundColors: string[] = []
  const clipTextBackgroundImages: string[] = []
  let isRoot = true
  for (const node of [el, ...el.querySelectorAll('*')]) {
    const style = isRoot ? elStyle : getComputedStyle(node)
    isRoot = false
    if (hasCssMask(style)) maskBackgroundColors.push(style.backgroundColor)
    if (hasTextClip(style)) clipTextBackgroundImages.push(style.backgroundImage)
  }
  return { maskBackgroundColors, clipTextBackgroundImages }
}

export const SVG_SHAPE_SELECTOR = 'path, circle, rect, ellipse, polygon, polyline, use'

// The reference a <use>/gradient/<image> carries via href, falling back to legacy xlink:href. Raw value ('#id',
// 'sprite.svg#id', a data:/http URL…); '' when neither attribute is present. Callers strip the leading '#' as needed.
export function getSvgHref(el: Element): string {
  return el.getAttribute('href') || el.getAttribute('xlink:href') || ''
}

// The SVG roots to inspect for el's paint: el itself when it's an SVG element, plus any descendant <svg>. With
// excludeImage, an <image> root is skipped — it embeds a raster (reported by getMediaInfo), not styleable shapes, so
// its default-black computed fill would otherwise surface as a spurious icon color.
export function collectSvgRoots(el: Element, options?: { excludeImage?: boolean }): SVGElement[] {
  const svgs: SVGElement[] = []
  if (el instanceof SVGElement && !(options?.excludeImage && el instanceof SVGImageElement)) {
    svgs.push(el)
  }
  for (const svg of el.querySelectorAll('svg')) svgs.push(svg)
  return svgs
}
