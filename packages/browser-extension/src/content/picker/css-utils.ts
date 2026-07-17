import type { Rgba } from './types'

// Realm-safe element type checks. An iframe's document is a different realm, so `el instanceof HTMLImageElement`
// is false for an <img> inside a same-origin frame — the same reason navigate.ts matches roots by nodeType.
// Namespace + localName hold across realms, so detectors use these now that the picker reaches into frame content.
const HTML_NS = 'http://www.w3.org/1999/xhtml'
const SVG_NS = 'http://www.w3.org/2000/svg'

export function isHtmlElement(el: Element): boolean {
  return el.namespaceURI === HTML_NS
}

export function isHtmlTag(el: Element, tag: string): boolean {
  return el.namespaceURI === HTML_NS && el.localName === tag
}

export function isSvgElement(el: Element): boolean {
  return el.namespaceURI === SVG_NS
}

export function isSvgTag(el: Element, tag: string): boolean {
  return el.namespaceURI === SVG_NS && el.localName === tag
}

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

// getComputedStyle emits colors almost exclusively as rgb()/rgba(), so a direct numeric parse handles the common case without the canvas readback below.
// Covers comma and space/slash syntax with integer channels and numeric/percentage alpha; returns null (→ canvas) for hex, named, hsl, oklch, color(), percentage channels, or anything malformed.
// Exact channels here also spare semi-transparent colors the canvas path's premultiplied-rounding drift.
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
    if (channel.includes('%')) return null // percentage channels are rare defer to canvas
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
// Tries the rgb() fast path, else canvas fillStyle which keeps its previous value on bad input; two sentinels detect that.
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

// background-clip: text (or -webkit-) the background paints the element's text glyphs, not a surface.
export function hasTextClip(style: CSSStyleDeclaration): boolean {
  const clip =
    style.getPropertyValue('background-clip') || style.getPropertyValue('-webkit-background-clip')
  return clip.includes('text')
}

// Fraction of el's box covered by child's box distinguishes a full surface from a small icon/text span.
function boxCoverage(child: Element, elRect: DOMRect): number {
  const c = child.getBoundingClientRect()
  const w = Math.min(elRect.right, c.right) - Math.max(elRect.left, c.left)
  const h = Math.min(elRect.bottom, c.bottom) - Math.max(elRect.top, c.top)
  if (w <= 0 || h <= 0) return 0
  return (w * h) / (elRect.width * elRect.height)
}

// For a transparent wrapper (e.g. <a> around a styled <button>), runs extract on the first descendant covering ≥90% of el's box document order yields the outermost filling surface first. Skips CSS-mask icons.
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

// One document-order pass over el + descendants, reading each computed style once so the icon-mask and clip-text-fill
// detectors don't each walk the subtree. Collects background-color of every CSS-mask element (icon paint) and
// background-image of every background-clip:text element (text fill; caller resolves to a gradient). el visited first.
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

// The reference a <use>/gradient/<image> carries via href, falling back to legacy xlink:href.
// Raw value ('#id', 'sprite.svg#id', a URL…), '' when absent. Callers strip the leading '#' as needed.
export function getSvgHref(el: Element): string {
  return el.getAttribute('href') || el.getAttribute('xlink:href') || ''
}

// SVG roots to inspect for el's paint: el itself if it's an SVG element, plus any descendant <svg>.
// With excludeImage, an <image> root is skipped it embeds a raster (see getMediaInfo), so its default-black fill isn't read as an icon color.
export function collectSvgRoots(el: Element, options?: { excludeImage?: boolean }): SVGElement[] {
  const svgs: SVGElement[] = []
  if (isSvgElement(el) && !(options?.excludeImage && isSvgTag(el, 'image'))) {
    svgs.push(el as SVGElement)
  }
  for (const svg of el.querySelectorAll('svg')) svgs.push(svg)
  return svgs
}
