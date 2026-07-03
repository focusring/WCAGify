import { sameColor, splitOuterCommas, tryParseColor } from './css-utils'

interface ShadowLayer {
  color: string
  offsetX: number
  offsetY: number
  blur: number
  spread: number
}

// One computed box-shadow layer → its color and four radii (px). Computed form is color, then offset-x/y, blur, spread, with an optional `inset`. Returns null if no color resolves.
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

// Ring geometry: no offset, no blur, positive spread (`0 0 0 Npx color`) how Tailwind ring/ring-offset utilities and native focus rings render. Drop shadows offset and/or blur.
function isRingGeometry(s: ShadowLayer): boolean {
  return s.offsetX === 0 && s.offsetY === 0 && s.blur === 0 && s.spread > 0
}

// Splits computed box-shadow into ring layers and drop-shadow layers. A layer is a ring by its geometry, or when its color matches --tw-ring-color (catches borderline-geometry Tailwind rings).
// Both dedupe by color and skip transparent placeholders (Tailwind composes box-shadow from `0 0 #0000` sentinels).
export function getShadowColors(
  el: Element,
  style: CSSStyleDeclaration = getComputedStyle(el)
): { ring: string[]; boxShadow: string[] } {
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
export function getOutlineColor(
  el: Element,
  style: CSSStyleDeclaration = getComputedStyle(el)
): string {
  if (style.outlineStyle === 'none' || parseFloat(style.outlineWidth) <= 0) return ''
  const parsed = tryParseColor(style.outlineColor)
  if (!parsed || parsed.a === 0) return ''
  return style.outlineColor
}
