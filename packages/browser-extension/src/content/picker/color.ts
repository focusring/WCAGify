import type { Rgba } from './types'
import type { DescendantScan } from './css-utils'
import {
  SVG_SHAPE_SELECTOR,
  collectSvgRoots,
  findFillingDescendant,
  formatLayer,
  getSvgHref,
  hasCssMask,
  hasTextClip,
  isHtmlTag,
  isOwnScope,
  scanDescendants,
  tryParseColor
} from './css-utils'

// The filling descendant's background color (see findFillingDescendant).
function getFillingDescendantBgLayer(el: Element): Rgba | null {
  return findFillingDescendant(el, (childStyle) => {
    const layer = tryParseColor(childStyle.backgroundColor)
    return layer && layer.a > 0 ? layer : null
  })
}

// The element's own background, or for a transparent wrapper the descendant that paints its surface.
// CSS-mask icons and background-clip:text return '' their background paints the icon/text, not a surface (clip:text gradients go to getElementGradient).
export function getElementOwnColor(
  el: Element,
  style: CSSStyleDeclaration = getComputedStyle(el)
): string {
  if (hasCssMask(style)) return ''
  if (hasTextClip(style)) return ''
  let layer = tryParseColor(style.backgroundColor)
  if (!layer || layer.a === 0) layer = getFillingDescendantBgLayer(el)
  if (!layer || layer.a === 0) return ''
  return formatLayer(layer)
}

// Tags whose text content is not rendered visually (filters the text walker).
const NON_VISIBLE_TEXT_TAGS = new Set(['script', 'style', 'noscript', 'title', 'desc'])

const FIELD_SELECTOR = 'input, textarea, select'

// Input types whose value is not rendered as text.
const NON_TEXT_INPUT_TYPES = new Set([
  'checkbox',
  'radio',
  'hidden',
  'color',
  'range',
  'image',
  'submit',
  'reset',
  'button'
])

function addVisibleColor(set: Set<string>, color: string): void {
  const parsed = tryParseColor(color)
  if (parsed && parsed.a > 0) set.add(color)
}

function isVisibleTextField(field: Element): boolean {
  if (isHtmlTag(field, 'input')) {
    return !NON_TEXT_INPUT_TYPES.has((field as HTMLInputElement).type)
  }
  return isHtmlTag(field, 'textarea') || isHtmlTag(field, 'select')
}

function hasFieldValue(field: Element): boolean {
  if (isHtmlTag(field, 'input') || isHtmlTag(field, 'textarea')) {
    return (field as HTMLInputElement | HTMLTextAreaElement).value.length > 0
  }
  if (isHtmlTag(field, 'select')) return (field as HTMLSelectElement).selectedOptions.length > 0
  return false
}

function getFieldPlaceholder(field: Element): string {
  if (isHtmlTag(field, 'input') || isHtmlTag(field, 'textarea')) {
    return (field as HTMLInputElement | HTMLTextAreaElement).placeholder
  }
  return ''
}

// Unique computed `color` values for visible text inside el: text nodes, input/textarea values, and ::placeholder when empty.
// `isBoundary` marks descendants surfaced as their own section; their text is reported there, so it stays out of el's
// row. A wrapper whose text all belongs to such children falls back to the whole subtree — a color visible on the page
// must stay reachable even when its section is capped, merged or on another page.
export function getTextColors(
  el: Element,
  isBoundary: (child: Element) => boolean = () => false
): string[] {
  const own = new Set<string>()
  const all = new Set<string>()
  const add = (source: Element, color: string): void => {
    addVisibleColor(all, color)
    if (isOwnScope(source, el, isBoundary)) addVisibleColor(own, color)
  }

  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT
      for (let p = node.parentElement; p; p = p.parentElement) {
        if (NON_VISIBLE_TEXT_TAGS.has(p.localName)) return NodeFilter.FILTER_REJECT
      }
      return NodeFilter.FILTER_ACCEPT
    }
  })
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement
    if (parent) add(parent, getComputedStyle(parent).color)
  }

  // Form fields don't expose value/placeholder as DOM text nodes check explicitly.
  const fields: Element[] = []
  if (el.matches(FIELD_SELECTOR)) fields.push(el)
  for (const f of el.querySelectorAll(FIELD_SELECTOR)) fields.push(f)
  for (const field of fields) {
    if (!isVisibleTextField(field)) continue
    if (hasFieldValue(field)) {
      add(field, getComputedStyle(field).color)
    } else if (getFieldPlaceholder(field)) {
      add(field, getComputedStyle(field, '::placeholder').color)
    }
  }

  return own.size > 0 ? [...own] : [...all]
}

// Returns the color if this SVG paint renders, else null. Rejects none/transparent, url() paint servers (gradients/patterns parse to phantom black), and paints zeroed by *-opacity.
function svgPaintColor(color: string, opacity: string): string | null {
  const parsed = tryParseColor(color)
  if (!parsed || parsed.a === 0) return null
  if (parseFloat(opacity || '1') <= 0) return null
  return color
}

// The in-document id a <use> references via href/xlink:href. '' for an unreachable external sprite ("sprite.svg#id") or when absent.
function useSymbolId(use: Element): string {
  const href = getSvgHref(use)
  return href.startsWith('#') ? href.slice(1) : ''
}

// A <use> paints the symbol's shapes in a cloned shadow tree getComputedStyle(use) can't see (its own fill reads as initial black), so resolve the symbol's shapes from raw paint attributes: literal colors as-is, currentColor/unset (the sprite norm) as the `color` inherited at the <use> site also the fallback for an external/missing symbol.
function getUseColors(use: Element): string[] {
  const inherited = getComputedStyle(use).color // what the symbol's currentColor fills resolve to here
  const symbol = (() => {
    const id = useSymbolId(use)
    return id ? document.getElementById(id) : null
  })()
  if (!symbol) return svgPaintColor(inherited, '1') ? [inherited] : []

  const colors = new Set<string>()
  let recoloredByCurrentColor = false
  for (const node of [symbol, ...symbol.querySelectorAll('*')]) {
    for (const prop of ['fill', 'stroke'] as const) {
      const raw = node.getAttribute(prop)
      if (!raw || raw === 'none') continue
      if (raw === 'currentColor' || raw === 'inherit') recoloredByCurrentColor = true
      else {
        const c = svgPaintColor(raw, node.getAttribute(`${prop}-opacity`) ?? '1')
        if (c) colors.add(c)
      }
    }
  }
  // currentColor anywhere, or a symbol with no literal paint at all (recolor-by-`color` sprite), renders as `inherited`.
  if ((recoloredByCurrentColor || colors.size === 0) && svgPaintColor(inherited, '1')) {
    colors.add(inherited)
  }
  return [...colors]
}

// Every visible fill/stroke color across an SVG's shape descendants, so multi-color icons surface all their colors (computed style already includes paint inherited from <svg>/<g>).
// Falls back to the root's own paint when no shape yields a color covers icons whose color sits on the <svg> root, e.g. Lucide stroke="currentColor".
function getSvgColors(svg: SVGElement): string[] {
  const colors = new Set<string>()
  for (const shape of svg.querySelectorAll(SVG_SHAPE_SELECTOR)) {
    const s = getComputedStyle(shape)
    if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity || '1') === 0)
      continue
    // A <use>'s paint lives in the referenced symbol, not on the <use> element itself.
    if (shape.localName === 'use') {
      for (const c of getUseColors(shape)) colors.add(c)
      continue
    }
    const fill = svgPaintColor(s.fill, s.fillOpacity)
    if (fill) colors.add(fill)
    const stroke = svgPaintColor(s.stroke, s.strokeOpacity)
    if (stroke) colors.add(stroke)
  }
  if (colors.size === 0) {
    const s = getComputedStyle(svg)
    const fill = svgPaintColor(s.fill, s.fillOpacity)
    if (fill) colors.add(fill)
    else {
      const stroke = svgPaintColor(s.stroke, s.strokeOpacity)
      if (stroke) colors.add(stroke)
    }
  }
  return [...colors]
}

// Unique visible icon colors: SVG fill/stroke + CSS-mask background-color (Iconify/Lucide via @nuxt/icon).
// Mask colors (el + descendants, so icons inside a picked button/link surface) come from the shared scanDescendants pass, already split by scope; `isBoundary` splits the SVG roots the same way, so pass the predicate the scan used or the two halves disagree.
// Same own-with-fallback rule as getTextColors.
export function getIconColors(
  el: Element,
  style: CSSStyleDeclaration = getComputedStyle(el),
  scan: DescendantScan = scanDescendants(el, style),
  isBoundary: (child: Element) => boolean = () => false
): string[] {
  const own = new Set<string>()
  const all = new Set<string>()

  for (const svg of collectSvgRoots(el, { excludeImage: true })) {
    const ownScope = isOwnScope(svg, el, isBoundary)
    for (const c of getSvgColors(svg)) {
      addVisibleColor(all, c)
      if (ownScope) addVisibleColor(own, c)
    }
  }

  for (const c of scan.maskBackgroundColors) addVisibleColor(all, c)
  for (const c of scan.ownMaskBackgroundColors) addVisibleColor(own, c)

  return own.size > 0 ? [...own] : [...all]
}

// Visible border colors from one computed style (element's own or a pseudo-element's) into `colors`.
// A side counts when width > 0, style is not none/hidden, alpha > 0. Computed values, so CSS variables are resolved (e.g. Framer's `border-color: var(--border-color)`).
function collectBorderColors(style: CSSStyleDeclaration, colors: Set<string>): void {
  const sides = ['top', 'right', 'bottom', 'left'] as const
  for (const side of sides) {
    const sideStyle = style.getPropertyValue(`border-${side}-style`)
    if (sideStyle === 'none' || sideStyle === 'hidden') continue
    if (parseFloat(style.getPropertyValue(`border-${side}-width`)) <= 0) continue
    const color = style.getPropertyValue(`border-${side}-color`)
    const parsed = tryParseColor(color)
    if (parsed && parsed.a > 0) colors.add(color)
  }
}

// Unique visible border colors on el and its ::before/::after pseudo-elements.
// Page builders like Framer paint the "border" on a generated ::after (absolute; inset:0) rather than the element itself, so reading only el's own style would miss a border DevTools shows.
export function getBorderColors(
  el: Element,
  style: CSSStyleDeclaration = getComputedStyle(el)
): string[] {
  const colors = new Set<string>()
  collectBorderColors(style, colors)
  for (const pseudo of ['::before', '::after'] as const) {
    const pseudoStyle = getComputedStyle(el, pseudo)
    if (pseudoStyle.content === 'none') continue // pseudo-element doesn't generate a box → its border isn't rendered
    collectBorderColors(pseudoStyle, colors)
  }
  return [...colors]
}
