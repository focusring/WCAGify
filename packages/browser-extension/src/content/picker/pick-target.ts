import { hasCssMask } from './css-utils'

// True if el has its own text/media/mask or wraps an icon. <a>/<button> are excluded from the descendant check interactive targets, not icon containers.
const MEDIA_SELECTOR = 'img, svg, i, picture, canvas, video, audio'
function hasOwnVisibleContent(el: Element): boolean {
  if (el.matches(MEDIA_SELECTOR)) return true
  if (hasCssMask(getComputedStyle(el))) return true
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) return true
  }
  if (!el.matches('a, button') && el.querySelector(MEDIA_SELECTOR)) return true
  return false
}

// Form fields that can't nest their own adornments: an <input> is void, and <select>/<textarea> don't render icon children. Components render leading/trailing icons as absolutely-positioned SIBLINGS instead.
const FIELD_SELECTOR = 'input, select, textarea'

// Separately-selectable elements: a sibling matching one of these is its own pick target, not a decorative adornment, so it must not turn the shared parent into a "field wrapper".
const INTERACTIVE_SELECTOR = 'a, button, input, select, textarea, [role], [tabindex]'

// Icon/media content anywhere in el (self or descendant): an <svg>/<img>/… or a CSS-mask icon (Iconify/Lucide via @nuxt/icon).
function containsIconOrMedia(el: Element): boolean {
  if (el.matches(MEDIA_SELECTOR)) return true
  if (hasCssMask(getComputedStyle(el))) return true
  for (const child of el.querySelectorAll('*')) {
    if (child.matches(MEDIA_SELECTOR) || hasCssMask(getComputedStyle(child))) return true
  }
  return false
}

// The wrapper holding a bare form field together with an icon adornment (e.g. Nuxt UI UInput: the icon is an absolutely-positioned SIBLING of the <input>, not a child, so scanning only the field's subtree misses it).
// Returns the parent when a non-interactive sibling carries icon/media/mask content, else null. Interactive siblings (a real icon button, another field) are skipped they stay individually selectable and a plain field in a <form>/<div> is not promoted.
function fieldWrapper(field: Element): Element | null {
  const parent = field.parentElement
  if (!parent || parent === document.body) return null
  for (const sibling of parent.children) {
    if (sibling === field || sibling.matches(INTERACTIVE_SELECTOR)) continue
    if (containsIconOrMedia(sibling)) return parent
  }
  return null
}

// Resolve a picker hit to its "interactive unit". Keep content-bearing hits (text/icon); otherwise resolve to the NEAREST <a>/<button> ancestor and stop never promote past it, so a nested interactive (another <a>, or a custom-element wrapper) stays individually selectable. When none is on the path, keep the hit itself.
export function getPickTarget(el: Element): Element {
  if (hasOwnVisibleContent(el)) return el

  // A form field's leading/trailing icons live outside it (sibling overlays); resolve to their shared wrapper so the icon's color surfaces (see fieldWrapper).
  if (el.matches(FIELD_SELECTOR)) {
    const wrapper = fieldWrapper(el)
    if (wrapper) return wrapper
  }

  let current: Element | null = el
  while (current && current !== document.body) {
    if (current.matches('a, button')) return current
    current = current.parentElement
  }
  return el
}

// Interactive / role-bearing elements worth recovering when the hit test skipped them.
// Decorative <div>/<span> with pointer-events: none (click-through scrims, overlays) are excluded correctly skipped, not meant to be selected.
const RECOVERABLE_SELECTOR =
  'a, button, input, select, textarea, [role], [tabindex], [aria-disabled], [disabled]'

// Cap on descendants scanned per hit; bounds worst-case cost on a pathologically large subtree.
const MAX_RECOVER_SCAN = 500

interface Point {
  x: number
  y: number
}

const isOutside = (rect: DOMRect, point: Point): boolean =>
  point.x < rect.left || point.x > rect.right || point.y < rect.top || point.y > rect.bottom

// Longhands and shorthand are both read because happy-dom records only the one that was written.
// A value set rather than `!== 'visible'`, so an unset property ('') never counts as clipping.
const CLIPPING_OVERFLOW = new Set(['hidden', 'clip', 'auto', 'scroll', 'overlay'])
function clipsOverflow(style: CSSStyleDeclaration): boolean {
  const values = [style.overflowX, style.overflowY, ...style.overflow.split(' ')]
  return values.some((value) => CLIPPING_OVERFLOW.has(value))
}

// Rejects a candidate a clipping ancestor hides at the cursor: getBoundingClientRect is the UNCLIPPED box, so a control
// scrolled out of an overflow container still "contains" the cursor. Ancestors are cached per hit test (shared, costly).
// Not modelled: escaping the clip via position: fixed/absolute — rare.
function clipTest(hit: Element, point: Point): (el: Element) => boolean {
  const cache = new Map<Element, boolean>()
  return (el) => {
    for (let p = el.parentElement; p && p !== hit; p = p.parentElement) {
      let hides = cache.get(p)
      if (hides === undefined) {
        hides = clipsOverflow(getComputedStyle(p)) && isOutside(p.getBoundingClientRect(), point)
        cache.set(p, hides)
      }
      if (hides) return true
    }
    return false
  }
}

// document.elementFromPoint skips elements with pointer-events: none, so a disabled control (e.g. Tailwind disabled:pointer-events-none) is invisible to the hit test and the picker resolves to its wrapper.
// Recover it: the deepest interactive descendant in the hit's subtree that computes pointer-events: none and whose box holds the cursor.
// Returns the hit unchanged when there's nothing to recover. Ties resolve to later document order (on top).
export function recoverSkippedTarget(hit: Element, x: number, y: number): Element {
  let best: Element = hit
  let bestDepth = -1
  let scanned = 0
  const point = { x, y }
  const isClipped = clipTest(hit, point)
  for (const el of hit.querySelectorAll(RECOVERABLE_SELECTOR)) {
    if (++scanned > MAX_RECOVER_SCAN) break
    const style = getComputedStyle(el)
    if (style.pointerEvents !== 'none') continue
    // Not painted. visibility, not opacity: an opacity:0 <input> behind a custom checkbox should stay reachable.
    if (style.visibility === 'hidden' || style.visibility === 'collapse') continue
    const rect = el.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) continue // display:none, or a box with no area
    if (isOutside(rect, point)) continue
    if (isClipped(el)) continue
    let depth = 0
    for (let p: Element | null = el.parentElement; p && p !== hit; p = p.parentElement) depth++
    if (depth >= bestDepth) {
      best = el
      bestDepth = depth
    }
  }
  return best
}
