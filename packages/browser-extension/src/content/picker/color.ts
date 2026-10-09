import type { Rgba } from './types'
import type { DescendantScan } from './css-utils'
import { firstSolidBackgroundColor } from './background'
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
  sameColor,
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

// The element's own ::before/::after fill, when the pseudo generates a box (content !== 'none'). Mirrors getBorderColors's pseudo check: design systems that paint a "state layer" (Material 3 filled buttons: own background-color is transparent, the fill is on :after) put the surface color here instead.
function getPseudoBgLayer(el: Element): Rgba | null {
  for (const pseudo of ['::before', '::after'] as const) {
    const pseudoStyle = getComputedStyle(el, pseudo)
    if (pseudoStyle.content === 'none') continue
    const layer = tryParseColor(pseudoStyle.backgroundColor)
    if (layer && layer.a > 0) return layer
  }
  return null
}

// The element's own background, or for a transparent wrapper the descendant/pseudo-element that paints its surface.
// CSS-mask icons and background-clip:text return '' their background paints the icon/text, not a surface (clip:text gradients go to getElementGradient).
export function getElementOwnColor(
  el: Element,
  style: CSSStyleDeclaration = getComputedStyle(el)
): string {
  if (hasCssMask(style)) return ''
  if (hasTextClip(style)) return ''
  let layer = tryParseColor(style.backgroundColor)
  if (!layer || layer.a === 0) layer = getFillingDescendantBgLayer(el)
  if (!layer || layer.a === 0) layer = getPseudoBgLayer(el)
  if (!layer || layer.a === 0) return ''
  return formatLayer(layer)
}

// Tags whose text content is not rendered visually (filters the text walker).
const NON_VISIBLE_TEXT_TAGS = new Set(['script', 'style', 'noscript', 'title', 'desc'])

export const FIELD_SELECTOR = 'input, textarea, select'

// Colors plus, per color and index-aligned with it, short names for the elements it was found on.
// A design system reuses one token across unrelated elements, so a color repeating between an element and one of its
// child sections is usually a coincidence rather than a duplicate the sources are what tells the two apart.
export interface ColorSources {
  colors: string[]
  sources: string[][]
}

// color → element descriptor → how many elements of that description carried it, all in first-seen order.
type ColorTally = Map<string, Map<string, number>>

// A short, readable name for the element a color came from: its Iconify/Tailwind icon class when it has one
// (`i-lucide:search` says far more than `span`), else the tag name. Kept short it lands in a swatch tooltip.
const ICON_CLASS = /(?:^|\s)(i-[\w-]+[:-][\w-]+)/
function sourceDescriptor(el: Element): string {
  const icon = ICON_CLASS.exec(el.getAttribute('class') ?? '')
  return icon ? icon[1]! : el.localName
}

// Records a visible color against the element carrying it; invisible (unparseable/fully transparent) colors are dropped.
function tallyColor(tally: ColorTally, color: string, source: Element): void {
  const parsed = tryParseColor(color)
  if (!parsed || parsed.a === 0) return
  let byDescriptor = tally.get(color)
  if (!byDescriptor) {
    byDescriptor = new Map<string, number>()
    tally.set(color, byDescriptor)
  }
  const descriptor = sourceDescriptor(source)
  byDescriptor.set(descriptor, (byDescriptor.get(descriptor) ?? 0) + 1)
}

// Caps how many descriptors one color lists, so a color used across a whole table doesn't produce an unreadable tooltip.
const MAX_SOURCES_SHOWN = 4

// ['h1', 'td ×3', '+2'] repeats collapse into a count, the tail into a remainder.
function formatSources(byDescriptor: Map<string, number>): string[] {
  const out: string[] = []
  for (const [descriptor, count] of byDescriptor) {
    if (out.length === MAX_SOURCES_SHOWN) {
      out.push(`+${byDescriptor.size - MAX_SOURCES_SHOWN}`)
      break
    }
    out.push(count > 1 ? `${descriptor} ×${count}` : descriptor)
  }
  return out
}

function tallyResult(tally: ColorTally): ColorSources {
  const colors = [...tally.keys()]
  return { colors, sources: colors.map((color) => formatSources(tally.get(color)!)) }
}

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

// Decoration line(s) one element's text-decoration draws, all in its one text-decoration-color.
// The `line` field holds one or more of underline / overline / line-through, space-separated.
interface Decoration {
  line: string
  color: string
  el: Element
}

const DECORATION_LINES = ['underline', 'overline', 'line-through']

// The drawn lines in a computed text-decoration-line, in a fixed order; '' when there are none.
function drawnLines(textDecorationLine: string): string {
  const tokens = textDecorationLine.split(' ')
  return DECORATION_LINES.filter((line) => tokens.includes(line)).join(' ')
}

// Parent in the flat (rendered) tree, which decorations propagate along: a slotted element's <slot>, a shadow root's host.
function flatParent(el: Element): Element | null {
  return el.assignedSlot ?? el.parentElement ?? (el.parentNode as ShadowRoot | null)?.host ?? null
}

// An ancestor's text decoration doesn't reach into an out-of-flow box or an atomic inline (inline-block/-flex/-grid/-table).
// The float check is set-and-not-none because an unrendered element's computed values are all ''.
function blocksDecorationPropagation(style: CSSStyleDeclaration): boolean {
  if (style.position === 'absolute' || style.position === 'fixed') return true
  if (style.float && style.float !== 'none') return true
  return style.display.startsWith('inline-')
}

// Decorations drawn on text directly inside el: its own plus those propagated from ancestors.
// A descendant's computed text-decoration-line reads `none` even while an ancestor's underline runs through it (e.g. a "By" prefix span inside an underlined author span), so the ancestors have to be walked.
// Memoised per element across one text walk.
function decorationsAt(el: Element, cache: Map<Element, Decoration[]>): Decoration[] {
  const cached = cache.get(el)
  if (cached) return cached
  const style = getComputedStyle(el)
  const parent = flatParent(el)
  const inherited =
    parent && !blocksDecorationPropagation(style) ? decorationsAt(parent, cache) : []
  const line = drawnLines(style.textDecorationLine)
  // The computed text-decoration-color is already resolved (currentColor → the decorating element's own `color`), as the line is painted.
  const result = line ? [...inherited, { line, color: style.textDecorationColor, el }] : inherited
  cache.set(el, result)
  return result
}

// The inline element painting the background directly behind text in `el`, searching up to (not including) `root`.
// That is the nearest painted background on the way up, kept only when its element is inline (a <mark>, a highlighted span).
// A block or inline-block background there is a nested surface, not a highlight; none at all means the text sits on root's own surface.
// Memoised per element like decorationsAt.
function highlightBehind(
  el: Element | null,
  root: Element,
  cache: Map<Element, Element | null>
): Element | null {
  if (!el || el === root) return null
  const cached = cache.get(el)
  if (cached !== undefined) return cached
  const style = getComputedStyle(el)
  const background = tryParseColor(style.backgroundColor)
  let found: Element | null = null
  if (!background || background.a === 0) found = highlightBehind(flatParent(el), root, cache)
  else if (style.display === 'inline') found = el
  cache.set(el, found)
  return found
}

// A highlight in its surrounding surface's color paints nothing visible.
// Pasted Word/Docs content often wraps runs in white-background spans on a white page.
function isVisibleHighlight(highlight: Element, color: string): boolean {
  const c = tryParseColor(color)
  const surface = firstSolidBackgroundColor(highlight.parentElement)
  return !(c && surface && sameColor(c, surface))
}

// Decoration colors plus, index-aligned, the line(s) each one draws ('underline', 'line-through', 'underline overline').
interface DecorationColors extends ColorSources {
  lines: string[]
}

// Tallies are kept per line, so one color drawn as two different lines stays two entries.
function decorationResult(byLine: Map<string, ColorTally>): DecorationColors {
  const result: DecorationColors = { colors: [], sources: [], lines: [] }
  for (const [line, tally] of byLine) {
    const { colors, sources } = tallyResult(tally)
    result.colors.push(...colors)
    result.sources.push(...sources)
    result.lines.push(...colors.map(() => line))
  }
  return result
}

// Text colors plus what is painted with that text: decoration lines whose color differs from the text they run under (one matching its text adds no color of its own), and inline highlights behind it.
// Their sources name the element setting the decoration or background, not the text.
export interface TextColors extends ColorSources {
  decoration: DecorationColors
  highlight: ColorSources
}

// Unique computed `color` values for visible text el owns: text nodes, input/textarea values, and ::placeholder when empty.
// `isBoundary` marks descendants surfaced as their own section they report their own text there, so it stays out of el's row entirely. An element whose text all belongs to such children gets an empty row, not a summary of theirs:
// every surfaced section is rendered in the panel (paginated at most), so nothing goes missing, and a value that does show up here is one no child section accounts for.
export function getTextColors(
  el: Element,
  isBoundary: (child: Element) => boolean = () => false
): TextColors {
  const own: ColorTally = new Map()
  const decorations = new Map<string, ColorTally>()
  const highlights: ColorTally = new Map()
  const decorationCache = new Map<Element, Decoration[]>()
  const highlightCache = new Map<Element, Element | null>()
  // One decorating or highlighting element spans many text nodes; count it once, so sources read as elements like the text row's.
  const countedDecorations = new Set<Decoration>()
  const countedHighlights = new Set<Element>()
  const add = (source: Element, color: string): void => {
    if (isOwnScope(source, el, isBoundary)) tallyColor(own, color, source)
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
    // A slotted text node's color comes from its assigned <slot>, not parentElement (the host) — e.g. Stencil's <nes-button> slots its label into a styled <a>.
    const parent = (node as Text).assignedSlot ?? node.parentElement
    if (!parent || !isOwnScope(parent, el, isBoundary)) continue
    const color = getComputedStyle(parent).color
    tallyColor(own, color, parent)
    const textColor = tryParseColor(color)
    for (const decoration of decorationsAt(parent, decorationCache)) {
      if (countedDecorations.has(decoration)) continue
      const lineColor = tryParseColor(decoration.color)
      if (lineColor && textColor && sameColor(lineColor, textColor)) continue
      countedDecorations.add(decoration)
      let tally = decorations.get(decoration.line)
      if (!tally) {
        tally = new Map()
        decorations.set(decoration.line, tally)
      }
      tallyColor(tally, decoration.color, decoration.el)
    }
    const highlight = highlightBehind(parent, el, highlightCache)
    if (highlight && !countedHighlights.has(highlight)) {
      countedHighlights.add(highlight)
      const background = getComputedStyle(highlight).backgroundColor
      if (isVisibleHighlight(highlight, background)) tallyColor(highlights, background, highlight)
    }
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

  return {
    ...tallyResult(own),
    decoration: decorationResult(decorations),
    highlight: tallyResult(highlights)
  }
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
    return id ? use.ownerDocument.getElementById(id) : null
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
// Same own-scope rule as getTextColors: an icon inside a surfaced child is that child's to report.
export function getIconColors(
  el: Element,
  style: CSSStyleDeclaration = getComputedStyle(el),
  scan: DescendantScan = scanDescendants(el, style),
  isBoundary: (child: Element) => boolean = () => false
): ColorSources {
  const own: ColorTally = new Map()

  for (const svg of collectSvgRoots(el, { excludeImage: true })) {
    if (!isOwnScope(svg, el, isBoundary)) continue
    for (const c of getSvgColors(svg)) tallyColor(own, c, svg)
  }

  for (const mask of scan.ownMaskBackgroundColors) tallyColor(own, mask.color, mask.el)

  return tallyResult(own)
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
