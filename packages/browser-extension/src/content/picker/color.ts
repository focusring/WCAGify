import type { Rgba } from './types'
import {
  SVG_SHAPE_SELECTOR,
  findFillingDescendant,
  formatLayer,
  hasCssMask,
  hasTextClip,
  tryParseColor
} from './css-utils'

// One element's own visible solid background-color. Gradients are reported separately by getElementGradient.
function getElementBgLayer(el: Element): Rgba | null {
  return tryParseColor(getComputedStyle(el).backgroundColor)
}

// The filling descendant's background color (see findFillingDescendant).
function getFillingDescendantBgLayer(el: Element): Rgba | null {
  return findFillingDescendant(el, (child) => {
    const layer = getElementBgLayer(child)
    return layer && layer.a > 0 ? layer : null
  })
}

// The element's own background, or for a transparent wrapper the descendant that paints its surface. CSS-mask icons
// and background-clip:text return '' — their background paints the icon/text, not a surface (clip:text gradients go to getElementGradient).
export function getElementOwnColor(el: Element): string {
  if (hasCssMask(el)) return ''
  if (hasTextClip(getComputedStyle(el))) return ''
  let layer = getElementBgLayer(el)
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
  if (field instanceof HTMLInputElement) return !NON_TEXT_INPUT_TYPES.has(field.type)
  return field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement
}

function hasFieldValue(field: Element): boolean {
  if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
    return field.value.length > 0
  }
  if (field instanceof HTMLSelectElement) return field.selectedOptions.length > 0
  return false
}

function getFieldPlaceholder(field: Element): string {
  if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
    return field.placeholder
  }
  return ''
}

// Unique computed `color` values for visible text inside el: text nodes, input/textarea values, and ::placeholder when empty.
export function getTextColors(el: Element): string[] {
  const colors = new Set<string>()

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
    if (parent) addVisibleColor(colors, getComputedStyle(parent).color)
  }

  // Form fields don't expose value/placeholder as DOM text nodes — check explicitly.
  const fields: Element[] = []
  if (el.matches(FIELD_SELECTOR)) fields.push(el)
  for (const f of el.querySelectorAll(FIELD_SELECTOR)) fields.push(f)
  for (const field of fields) {
    if (!isVisibleTextField(field)) continue
    if (hasFieldValue(field)) {
      addVisibleColor(colors, getComputedStyle(field).color)
    } else if (getFieldPlaceholder(field)) {
      addVisibleColor(colors, getComputedStyle(field, '::placeholder').color)
    }
  }

  return [...colors]
}

// Returns the color if this SVG paint renders, else null. Rejects none/transparent, url() paint servers
// (gradients/patterns parse to phantom black), and paints zeroed by *-opacity.
function svgPaintColor(color: string, opacity: string): string | null {
  const parsed = tryParseColor(color)
  if (!parsed || parsed.a === 0) return null
  if (parseFloat(opacity || '1') <= 0) return null
  return color
}

// Every visible fill/stroke color across an SVG's shape descendants, so multi-color icons surface all their colors
// (computed style already includes paint inherited from <svg>/<g>). Falls back to the root's own paint when no shape yields a color — covers icons whose color sits on the <svg> root, e.g. Lucide stroke="currentColor".
function getSvgColors(svg: SVGElement): string[] {
  const colors = new Set<string>()
  for (const shape of svg.querySelectorAll(SVG_SHAPE_SELECTOR)) {
    const s = getComputedStyle(shape)
    if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity || '1') === 0)
      continue
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

// Unique visible icon colors: SVG fill/stroke + CSS-mask background-color (Iconify/Lucide via @nuxt/icon). Walks descendants so icons inside a picked button/link surface.
export function getIconColors(el: Element): string[] {
  const colors = new Set<string>()

  const svgs: SVGElement[] = []
  if (el instanceof SVGElement) svgs.push(el)
  for (const svg of el.querySelectorAll('svg')) svgs.push(svg)
  for (const svg of svgs) {
    for (const c of getSvgColors(svg)) addVisibleColor(colors, c)
  }

  if (hasCssMask(el)) addVisibleColor(colors, getComputedStyle(el).backgroundColor)
  for (const child of el.querySelectorAll('*')) {
    if (hasCssMask(child)) addVisibleColor(colors, getComputedStyle(child).backgroundColor)
  }

  return [...colors]
}

// Unique visible border colors. A side counts when width > 0, style is not none/hidden, and alpha > 0.
export function getBorderColors(el: Element): string[] {
  const style = getComputedStyle(el)
  const sides = ['top', 'right', 'bottom', 'left'] as const
  const colors = new Set<string>()
  for (const side of sides) {
    const sideStyle = style.getPropertyValue(`border-${side}-style`)
    if (sideStyle === 'none' || sideStyle === 'hidden') continue
    if (parseFloat(style.getPropertyValue(`border-${side}-width`)) <= 0) continue
    const color = style.getPropertyValue(`border-${side}-color`)
    const parsed = tryParseColor(color)
    if (parsed && parsed.a > 0) colors.add(color)
  }
  return [...colors]
}
