import type { GradientInfo } from './types'
import {
  SVG_SHAPE_SELECTOR,
  collectSvgRoots,
  findFillingDescendant,
  formatLayer,
  getSvgHref,
  hasCssMask,
  scanDescendants,
  splitOuterCommas,
  tryParseColor
} from './css-utils'

// Strips position hints ("red 10%" → "red") from a gradient color stop.
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

// Matches any CSS gradient function (linear/radial/conic + repeating-* variants) anywhere in a value unanchored, so it's
// found even when layered after other background-image values like url(...). Capture group 1 is the full type name
// ("conic", "repeating-linear", …) so the display can label the specific gradient kind.
const GRADIENT_FUNC = /((?:repeating-)?(?:linear|radial|conic))-gradient\(/i

// First CSS gradient in a value → its type and the raw content between its parentheses (balanced, so nested rgb()/calc() survive).
// Handles comma-separated background-image layers. null when there is no gradient.
function extractGradient(value: string): { type: string; body: string } | null {
  const m = GRADIENT_FUNC.exec(value)
  if (!m) return null
  const open = m.index + m[0].length - 1
  let depth = 0
  for (let i = open; i < value.length; i++) {
    if (value[i] === '(') depth++
    else if (value[i] === ')' && --depth === 0) {
      return { type: m[1]!.toLowerCase(), body: value.slice(open + 1, i) }
    }
  }
  return null
}

// First CSS gradient in a background-image value → its type and stop colors (formatted). null when none.
export function parseGradient(bgImage: string): GradientInfo | null {
  const g = extractGradient(bgImage)
  if (!g) return null
  const colors: string[] = []
  for (const arg of splitOuterCommas(g.body)) {
    const c = tryParseColor(extractColorFromStop(arg))
    if (c) colors.push(formatLayer(c))
  }
  return colors.length > 0 ? { type: g.type, colors } : null
}

// The gradient id from an SVG paint reference like url("#id") or url("file.svg#id").
function gradientUrlId(paint: string): string {
  return /url\(["']?[^)]*?#([\w:.-]+)["']?\)/i.exec(paint)?.[1] ?? ''
}

// Stop colors of an SVG gradient element, following href/xlink:href inheritance when it carries no own stops.
function getGradientStops(grad: Element, depth = 0): string[] {
  const colors: string[] = []
  for (const stop of grad.querySelectorAll('stop')) {
    const sc =
      getComputedStyle(stop).getPropertyValue('stop-color') || stop.getAttribute('stop-color') || ''
    const parsed = tryParseColor(sc)
    if (parsed && parsed.a > 0) colors.push(formatLayer(parsed))
  }
  if (colors.length === 0 && depth < 4) {
    const href = getSvgHref(grad)
    if (href.startsWith('#')) {
      const ref = grad.ownerDocument.getElementById(href.slice(1))
      if (ref) return getGradientStops(ref, depth + 1)
    }
  }
  return colors
}

// Resolve a gradient id to its type and stop colors. null when the id is not a linear/radial gradient with stops.
function resolveGradientById(id: string, svg: SVGElement): GradientInfo | null {
  let grad = svg.ownerDocument.getElementById(id)
  if (!grad) {
    try {
      grad = svg.querySelector(`#${CSS.escape(id)}`)
    } catch {
      grad = null
    }
  }
  if (!grad) return null
  const local = grad.localName.toLowerCase()
  if (local !== 'lineargradient' && local !== 'radialgradient') return null
  const colors = getGradientStops(grad)
  if (colors.length === 0) return null
  return { type: local === 'radialgradient' ? 'radial' : 'linear', colors }
}

// First fill/stroke gradient (fill="url(#id)") across an SVG's root and shapes, resolved to its stops. null when none.
function getSvgGradient(svg: SVGElement): GradientInfo | null {
  for (const shape of [svg, ...svg.querySelectorAll(SVG_SHAPE_SELECTOR)]) {
    const s = getComputedStyle(shape)
    const paints = [
      s.fill,
      s.stroke,
      shape.getAttribute('fill') ?? '',
      shape.getAttribute('stroke') ?? ''
    ]
    for (const paint of paints) {
      const id = gradientUrlId(paint)
      if (!id) continue
      const g = resolveGradientById(id, svg)
      if (g) return g
    }
  }
  return null
}

// Gradient counterpart of getFillingDescendantBgLayer: the filling descendant's background-image gradient.
function getFillingDescendantGradient(el: Element): GradientInfo | null {
  return findFillingDescendant(el, (childStyle) => parseGradient(childStyle.backgroundImage))
}

// A gradient on the element's own appearance, not the surface behind it: a text fill (background-clip: text), an SVG fill/stroke gradient reference, or its own (or a filling descendant's) background-image gradient.
// Clip-text candidates (el + descendants) come from the shared scanDescendants pass; first to resolve wins.
export function getElementGradient(
  el: Element,
  style: CSSStyleDeclaration = getComputedStyle(el),
  clipTextBackgroundImages: string[] = scanDescendants(el, style).clipTextBackgroundImages
): GradientInfo | null {
  for (const bg of clipTextBackgroundImages) {
    const clip = parseGradient(bg)
    if (clip) return clip
  }

  for (const svg of collectSvgRoots(el)) {
    const g = getSvgGradient(svg)
    if (g) return g
  }

  if (!hasCssMask(style)) {
    const own = parseGradient(style.backgroundImage)
    if (own) return own
    const descendant = getFillingDescendantGradient(el)
    if (descendant) return descendant
  }
  return null
}
