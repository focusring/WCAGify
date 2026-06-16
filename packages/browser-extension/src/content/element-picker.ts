import { getUniqueSelector } from './unique-selector'

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

// Splits on top-level commas, ignoring those inside () or []. Used for gradient stops, background-image layers, and CSS selector lists.
function splitOuterCommas(s: string): string[] {
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

// Resolve a CSS color string to rgba, or null for non-color tokens (e.g. "45deg", "to right" from a gradient).
// fillStyle keeps its previous value on an unparseable input; two sentinels distinguish that from a real color.
function tryParseColor(color: string): { r: number; g: number; b: number; a: number } | null {
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

// Matches any CSS gradient function (linear/radial/conic + repeating-* variants) anywhere in a value — unanchored,
// so it's found even when layered after other background-image values like url(...).
const GRADIENT_FUNC = /(?:repeating-)?(linear|radial|conic)-gradient\(/i

// First CSS gradient in a value → its type and the raw content between its parentheses (balanced, so nested
// rgb()/calc() survive). Handles comma-separated background-image layers. null when there is no gradient.
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

// One element's own visible solid background-color. Gradients are reported separately by getElementGradient.
function getElementBgLayer(el: Element): { r: number; g: number; b: number; a: number } | null {
  return tryParseColor(getComputedStyle(el).backgroundColor)
}

function formatLayer(layer: { r: number; g: number; b: number; a: number }): string {
  if (layer.a === 255) return `rgb(${layer.r}, ${layer.g}, ${layer.b})`
  return `rgba(${layer.r}, ${layer.g}, ${layer.b}, ${layer.a / 255})`
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
function findFillingDescendant<T>(el: Element, extract: (child: Element) => T | null): T | null {
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

// The filling descendant's background color (see findFillingDescendant).
function getFillingDescendantBgLayer(
  el: Element
): { r: number; g: number; b: number; a: number } | null {
  return findFillingDescendant(el, (child) => {
    const layer = getElementBgLayer(child)
    return layer && layer.a > 0 ? layer : null
  })
}

// The element's own background, or for a transparent wrapper the descendant that paints its surface. CSS-mask icons
// and background-clip:text return '' — their background paints the icon/text, not a surface (clip:text gradients go to getElementGradient).
function getElementOwnColor(el: Element): string {
  if (hasCssMask(el)) return ''
  if (hasTextClip(getComputedStyle(el))) return ''
  let layer = getElementBgLayer(el)
  if (!layer || layer.a === 0) layer = getFillingDescendantBgLayer(el)
  if (!layer || layer.a === 0) return ''
  return formatLayer(layer)
}

interface GradientInfo {
  type: string
  colors: string[]
}

// background-clip: text (or -webkit-) — the background paints the element's text glyphs, not a surface.
function hasTextClip(style: CSSStyleDeclaration): boolean {
  const clip =
    style.getPropertyValue('background-clip') || style.getPropertyValue('-webkit-background-clip')
  return clip.includes('text')
}

// A gradient used as a text fill (background-clip: text) on el or a descendant. It lives in background-image but
// represents the text color, so it's reported as the element's gradient, not its background.
function getClipTextGradient(el: Element): GradientInfo | null {
  for (const node of [el, ...el.querySelectorAll('*')]) {
    const style = getComputedStyle(node)
    if (!hasTextClip(style)) continue
    const g = parseGradient(style.backgroundImage)
    if (g) return g
  }
  return null
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
    const href = grad.getAttribute('href') || grad.getAttribute('xlink:href') || ''
    if (href.startsWith('#')) {
      const ref = document.getElementById(href.slice(1))
      if (ref) return getGradientStops(ref, depth + 1)
    }
  }
  return colors
}

// Resolve a gradient id to its type and stop colors. null when the id is not a linear/radial gradient with stops.
function resolveGradientById(id: string, svg: SVGElement): GradientInfo | null {
  let grad = document.getElementById(id)
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
  return findFillingDescendant(el, (child) =>
    parseGradient(getComputedStyle(child).backgroundImage)
  )
}

// A gradient on the element's own appearance, not the surface behind it: a text fill (background-clip: text), an SVG
// fill/stroke gradient reference, or its own (or a filling descendant's) background-image gradient.
function getElementGradient(el: Element): GradientInfo | null {
  const clip = getClipTextGradient(el)
  if (clip) return clip

  const svgs: SVGElement[] = []
  if (el instanceof SVGElement) svgs.push(el)
  for (const svg of el.querySelectorAll('svg')) svgs.push(svg)
  for (const svg of svgs) {
    const g = getSvgGradient(svg)
    if (g) return g
  }

  if (!hasCssMask(el)) {
    const own = parseGradient(getComputedStyle(el).backgroundImage)
    if (own) return own
    const descendant = getFillingDescendantGradient(el)
    if (descendant) return descendant
  }
  return null
}

interface MediaInfo {
  kind: 'image' | 'video'
  format: string // extension/format, '' when undeterminable
}

interface BackgroundInfo {
  color: string // formatted background-color behind the media, '' when transparent/none
  media: MediaInfo | null // background image/video (kind + format), null when none
  gradient: GradientInfo | null // gradient stop colors (formatted), null when not a gradient
  blur: boolean // a blur() in filter / backdrop-filter
}

// First url(...) layer of a computed background-image, unquoted; '' when there is none.
function firstBackgroundUrl(bgImage: string): string {
  for (const layer of splitOuterCommas(bgImage)) {
    const m = /^url\((['"]?)([\s\S]*?)\1\)/i.exec(layer.trim())
    if (m?.[2]) return m[2]
  }
  return ''
}

// Background image as { kind, format }, reusing extractMediaFormat (allow-list + data: parsing). null when the
// background-image has no url() layer (e.g. gradient only).
function bgImageMedia(bgImage: string): MediaInfo | null {
  const url = firstBackgroundUrl(bgImage)
  return url ? { kind: 'image', format: extractMediaFormat(url) } : null
}

// First CSS gradient in a background-image value → its type and stop colors (formatted). null when none.
function parseGradient(bgImage: string): GradientInfo | null {
  const g = extractGradient(bgImage)
  if (!g) return null
  const colors: string[] = []
  for (const arg of splitOuterCommas(g.body)) {
    const c = tryParseColor(extractColorFromStop(arg))
    if (c) colors.push(formatLayer(c))
  }
  return colors.length > 0 ? { type: g.type, colors } : null
}

// A blur() in filter or backdrop-filter.
function hasBlur(el: Element): boolean {
  const style = getComputedStyle(el)
  const backdrop =
    style.getPropertyValue('backdrop-filter') || style.getPropertyValue('-webkit-backdrop-filter')
  return /\bblur\(/i.test(style.filter) || /\bblur\(/i.test(backdrop)
}

// CSS background-image can't reference a <video>; "background videos" are absolutely/fixed-positioned <video>s layered
// behind content. Heuristic: a positioned <video> that doesn't contain el, covers el's centre, and is at least as large as el. Best-effort — won't catch every layering technique.
function findBackgroundVideo(el: Element): MediaInfo | null {
  const r = el.getBoundingClientRect()
  if (r.width === 0 || r.height === 0) return null
  const cx = r.left + r.width / 2
  const cy = r.top + r.height / 2
  for (const video of document.querySelectorAll('video')) {
    if (video.contains(el) || el.contains(video)) continue
    const pos = getComputedStyle(video).position
    if (pos !== 'absolute' && pos !== 'fixed') continue
    const vr = video.getBoundingClientRect()
    if (cx < vr.left || cx > vr.right || cy < vr.top || cy > vr.bottom) continue
    if (vr.width * vr.height < r.width * r.height) continue
    return { kind: 'video', format: videoFormat(video) }
  }
  return null
}

// Structured description of the first visible background behind el. Walks parent → <html>, recording the top most background image/gradient and the first solid color behind it, then stops (that color backs everything below).
// Falls back to a layered background <video> when there's no CSS image/gradient. Skips CSS-mask elements.
function getBackgroundInfo(el: Element): BackgroundInfo {
  let color = ''
  let media: MediaInfo | null = null
  let gradient: GradientInfo | null = null
  let blur = hasBlur(el)

  for (let current: Element | null = el.parentElement; current; current = current.parentElement) {
    if (!hasCssMask(current)) {
      const style = getComputedStyle(current)
      const bgImage = style.backgroundImage
      if (bgImage && bgImage !== 'none') {
        if (!media) media = bgImageMedia(bgImage)
        if (!gradient) gradient = parseGradient(bgImage)
      }
      if (!color) {
        const c = tryParseColor(style.backgroundColor)
        if (c && c.a > 0) color = formatLayer(c)
      }
      if (hasBlur(current)) blur = true
      if (color) break
    }
    if (current === document.documentElement) break
  }

  if (!media && !gradient) media = findBackgroundVideo(el)

  return { color, media, gradient, blur }
}

const SVG_SHAPE_SELECTOR = 'path, circle, rect, ellipse, polygon, polyline, use'

function hasCssMask(el: Element): boolean {
  const style = getComputedStyle(el)
  const mask = style.getPropertyValue('-webkit-mask-image') || style.getPropertyValue('mask-image')
  return mask !== '' && mask !== 'none'
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
function getTextColors(el: Element): string[] {
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
function getIconColors(el: Element): string[] {
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
function getBorderColors(el: Element): string[] {
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

interface ShadowLayer {
  color: string
  offsetX: number
  offsetY: number
  blur: number
  spread: number
}

// One computed box-shadow layer → its color and four radii (px). Computed form is color, then offset-x/y, blur,
// spread, with an optional `inset`. Returns null if no color resolves.
function parseShadowLayer(layer: string): ShadowLayer | null {
  const body = layer.replace(/\binset\b/i, '').trim()
  const colorMatch =
    /^(?:rgba?|hsla?|color|oklch|oklab|lab|lch|hwb)\([^)]*\)|^#[0-9a-f]+|^[a-z]+/i.exec(body)
  if (!colorMatch) return null
  const color = colorMatch[0]
  const lengths = body
    .slice(color.length)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => parseFloat(t))
  return {
    color,
    offsetX: lengths[0] ?? 0,
    offsetY: lengths[1] ?? 0,
    blur: lengths[2] ?? 0,
    spread: lengths[3] ?? 0
  }
}

// Ring geometry: no offset, no blur, positive spread (`0 0 0 Npx color`) — how Tailwind ring/ring-offset utilities and native focus rings render. Drop shadows offset and/or blur.
function isRingGeometry(s: ShadowLayer): boolean {
  return s.offsetX === 0 && s.offsetY === 0 && s.blur === 0 && s.spread > 0
}

function sameColor(
  a: { r: number; g: number; b: number; a: number },
  b: { r: number; g: number; b: number; a: number }
): boolean {
  return a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a
}

// Splits computed box-shadow into ring layers and drop-shadow layers. A layer is a ring by its geometry, or when its
// color matches --tw-ring-color (catches borderline-geometry Tailwind rings). Both dedupe by color and skip transparent placeholders (Tailwind composes box-shadow from `0 0 #0000` sentinels).
function getShadowColors(el: Element): { ring: string[]; boxShadow: string[] } {
  const style = getComputedStyle(el)
  const boxShadow = style.boxShadow
  if (!boxShadow || boxShadow === 'none') return { ring: [], boxShadow: [] }

  const ringVar = style.getPropertyValue('--tw-ring-color').trim()
  const ringColor = ringVar ? tryParseColor(ringVar) : null

  const ring = new Set<string>()
  const shadow = new Set<string>()
  for (const layer of splitOuterCommas(boxShadow)) {
    const parsed = parseShadowLayer(layer)
    if (!parsed) continue
    const c = tryParseColor(parsed.color)
    if (!c || c.a === 0) continue
    const matchesRingVar = ringColor !== null && parsed.blur === 0 && sameColor(c, ringColor)
    if (isRingGeometry(parsed) || matchesRingVar) ring.add(parsed.color)
    else shadow.add(parsed.color)
  }
  return { ring: [...ring], boxShadow: [...shadow] }
}

// Native CSS outline color, when the outline is actually drawn (style not none, width > 0, visible color). Skips unparseable keywords such as `invert`.
function getOutlineColor(el: Element): string {
  const style = getComputedStyle(el)
  if (style.outlineStyle === 'none' || parseFloat(style.outlineWidth) <= 0) return ''
  const parsed = tryParseColor(style.outlineColor)
  if (!parsed || parsed.a === 0) return ''
  return style.outlineColor
}

const MEDIA_FORMATS = new Set([
  'png',
  'jpg',
  'jpeg',
  'webp',
  'gif',
  'svg',
  'avif',
  'bmp',
  'ico',
  'apng',
  'mp4',
  'webm',
  'ogg',
  'ogv',
  'mov',
  'm4v'
])

// A MIME subtype normalized to a known media format, stripping structured-syntax suffixes (svg+xml → svg). '' when the subtype is absent or unrecognized.
function normalizeMediaSubtype(subtype: string | undefined): string {
  const norm = subtype?.split('+')[0]?.toLowerCase() ?? ''
  return MEDIA_FORMATS.has(norm) ? norm : ''
}

// Lowercase file format from a URL or data: URI, '' if absent/unrecognized. URLs: last path segment's extension (query/hash stripped). Data URIs: the MIME subtype (image/svg+xml → svg).
function extractMediaFormat(src: string): string {
  if (!src) return ''
  if (src.startsWith('data:')) {
    return normalizeMediaSubtype(/^data:[a-z]+\/([a-z0-9.+-]+)/i.exec(src)?.[1])
  }
  const path = src.split(/[?#]/)[0] ?? ''
  const segment = path.slice(path.lastIndexOf('/') + 1)
  const dot = segment.lastIndexOf('.')
  if (dot === -1) return ''
  const ext = segment.slice(dot + 1).toLowerCase()
  return MEDIA_FORMATS.has(ext) ? ext : ''
}

// Pulls a format from a <source>'s `type` (e.g. "video/mp4" → mp4) or its `src` extension.
function sourceFormat(source: HTMLSourceElement): string {
  const fromType = normalizeMediaSubtype(
    /\/([a-z0-9.+-]+)/i.exec(source.getAttribute('type') ?? '')?.[1]
  )
  if (fromType) return fromType
  return extractMediaFormat(source.getAttribute('src') ?? '')
}

// A <video>'s format from its src/currentSrc extension, falling back to its <source> children's type/src.
function videoFormat(video: HTMLVideoElement): string {
  let format = extractMediaFormat(video.currentSrc || video.src)
  for (const source of video.querySelectorAll('source')) {
    if (format) break
    format = sourceFormat(source)
  }
  return format
}

// Informational descriptor for raster/video elements, which have no styleable fill/color. Returns kind + detected format ('' when undeterminable), or null when el is not an <img>/<video>.
function getMediaInfo(el: Element): MediaInfo | null {
  if (el instanceof HTMLImageElement) {
    return { kind: 'image', format: extractMediaFormat(el.currentSrc || el.src) }
  }
  if (el instanceof HTMLVideoElement) {
    return { kind: 'video', format: videoFormat(el) }
  }
  return null
}

// True if el has its own text/media/mask, or wraps an icon. <a>/<button> are excluded from the descendant check — they're interactive targets, not icon containers.
const MEDIA_SELECTOR = 'img, svg, i, picture, canvas, video, audio'
function hasOwnVisibleContent(el: Element): boolean {
  if (el.matches(MEDIA_SELECTOR)) return true
  if (hasCssMask(el)) return true
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) return true
  }
  if (!el.matches('a, button') && el.querySelector(MEDIA_SELECTOR)) return true
  return false
}

// Elements targeted by :hover / :active / :focus* rules. Built lazily, reset per picker session.
const STATE_PSEUDO_PATTERN = /:(?:hover|active|focus(?:-visible|-within)?)\b/g
const STATE_PSEUDO_TEST = /:(?:hover|active|focus(?:-visible|-within)?)\b/

let interactiveStyledCache: WeakSet<Element> | null = null

// Returns the compound the state pseudo is attached to, pseudo stripped. "foo:hover .bar" → "foo". ".ctas a:active .x" → "a".
function extractStateCompound(selector: string): string | null {
  const match = selector.match(STATE_PSEUDO_TEST)
  if (!match || match.index === undefined) return null
  const pseudoIdx = match.index

  let depth = 0
  let start = 0
  for (let i = pseudoIdx - 1; i >= 0; i--) {
    const ch = selector[i]
    if (ch === ')' || ch === ']') depth++
    else if (ch === '(' || ch === '[') depth--
    else if (depth === 0 && (ch === ' ' || ch === '>' || ch === '+' || ch === '~')) {
      start = i + 1
      break
    }
  }

  let end = selector.length
  depth = 0
  for (let i = pseudoIdx + match[0].length; i < selector.length; i++) {
    const ch = selector[i]
    if (ch === '(' || ch === '[') depth++
    else if (ch === ')' || ch === ']') depth--
    else if (depth === 0 && (ch === ' ' || ch === '>' || ch === '+' || ch === '~')) {
      end = i
      break
    }
  }

  const compound = selector.substring(start, end).replace(STATE_PSEUDO_PATTERN, '').trim()
  return compound || null
}

function buildInteractiveStyledSet(): WeakSet<Element> {
  const set = new WeakSet<Element>()

  function visit(rules: CSSRuleList): void {
    for (const rule of rules) {
      if (rule instanceof CSSStyleRule) {
        if (!STATE_PSEUDO_TEST.test(rule.selectorText)) continue
        for (const part of splitOuterCommas(rule.selectorText)) {
          const compound = extractStateCompound(part.trim())
          if (!compound) continue
          try {
            for (const el of document.querySelectorAll(compound)) {
              set.add(el)
            }
          } catch {} // invalid selector
        }
      } else if (rule instanceof CSSGroupingRule) {
        visit(rule.cssRules)
      }
    }
  }

  for (const sheet of document.styleSheets) {
    try {
      visit(sheet.cssRules)
    } catch {} // cross-origin sheet
  }

  return set
}

function hasInteractiveStyling(el: Element): boolean {
  interactiveStyledCache ??= buildInteractiveStyledSet()
  return interactiveStyledCache.has(el)
}

// Resolve a picker hit to its "interactive unit". Keep content-bearing hits (text/icon). Otherwise prefer the outermost <a>/<button>/custom-element with hover/focus styling; fall back to the outermost <a>/<button>, optionally promoted one level to a custom-element wrapper.
function getPickTarget(el: Element): Element {
  if (hasOwnVisibleContent(el)) return el

  let outermostStyled: Element | null = null
  let current: Element | null = el
  while (current && current !== document.body) {
    const isInteractive = current.matches('a, button')
    const isCustom = current.localName.includes('-')
    if ((isInteractive || isCustom) && hasInteractiveStyling(current)) {
      outermostStyled = current
    }
    current = current.parentElement
  }
  if (outermostStyled) return outermostStyled

  let result: Element = el
  let foundInteractive = false
  let foundCustomWrapper = false
  current = el
  while (current && current !== document.body) {
    const isInteractiveTag = current.matches('a, button')
    const canPromoteCustom =
      foundInteractive && !foundCustomWrapper && current.localName.includes('-')

    if (isInteractiveTag || canPromoteCustom) {
      result = current
    }
    if (canPromoteCustom) foundCustomWrapper = true
    if (isInteractiveTag) foundInteractive = true
    current = current.parentElement
  }
  return result
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
    const resolved = getPickTarget(target)
    currentTarget = resolved
    highlightElement(resolved)
    const selector = getUniqueSelector(resolved)
    updateInfoPanel(Array.isArray(selector) ? selector.join(' > ') : selector)
  }
}

function handleClick(e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()

  if (!currentTarget) return

  const selector = getUniqueSelector(currentTarget)
  const shadowColors = getShadowColors(currentTarget)
  chrome.runtime.sendMessage({
    type: 'element-picked',
    selector,
    url: document.URL,
    pageTitle: document.title,
    textColors: getTextColors(currentTarget),
    iconColors: getIconColors(currentTarget),
    elementColor: getElementOwnColor(currentTarget),
    elementGradient: getElementGradient(currentTarget),
    background: getBackgroundInfo(currentTarget),
    borderColors: getBorderColors(currentTarget),
    ringColors: shadowColors.ring,
    boxShadowColors: shadowColors.boxShadow,
    outlineColor: getOutlineColor(currentTarget),
    media: getMediaInfo(currentTarget)
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
  interactiveStyledCache = null
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
