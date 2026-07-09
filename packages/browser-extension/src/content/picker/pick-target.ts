import { hasCssMask } from './css-utils'

// True if el has its own text/media/mask, or wraps an icon. <a>/<button> are excluded from the descendant check they're interactive targets, not icon containers.
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

// Resolve a picker hit to its "interactive unit". Keep content-bearing hits (text/icon). Otherwise
// resolve to the NEAREST <a>/<button> ancestor and stop — never promote past it, so a native
// interactive nested inside another element (another <a>, or a custom-element / web-component
// wrapper) stays individually selectable, matching what the browser's own hit test returns. When no
// <a>/<button> is on the path, keep the hit itself.
export function getPickTarget(el: Element): Element {
  if (hasOwnVisibleContent(el)) return el

  let current: Element | null = el
  while (current && current !== document.body) {
    if (current.matches('a, button')) return current
    current = current.parentElement
  }
  return el
}

// Interactive / role-bearing elements worth recovering when the browser's hit test skipped them.
// Plain decorative <div>/<span> with `pointer-events: none` (click-through scrims, gradient overlays)
// are deliberately excluded — they're correctly skipped and are not something the user means to select.
const RECOVERABLE_SELECTOR =
  'a, button, input, select, textarea, [role], [tabindex], [aria-disabled], [disabled]'

// Cap on descendants scanned per hit; bounds worst-case cost on a pathologically large subtree.
const MAX_RECOVER_SCAN = 500

// `document.elementFromPoint` unconditionally skips elements with `pointer-events: none`, so a
// disabled control (e.g. Tailwind `disabled:pointer-events-none`) is invisible to the hit test and
// the picker resolves to its wrapper instead. Recover it: within the hit's subtree, find the deepest
// interactive descendant that computes `pointer-events: none` — the only kind the hit test can have
// skipped — and whose box contains the cursor. Returns the hit unchanged when there's nothing to
// recover, so it's a no-op on normal pages. Ties (same depth) resolve to later document order (painted on top).
export function recoverSkippedTarget(hit: Element, x: number, y: number): Element {
  let best: Element = hit
  let bestDepth = -1
  let scanned = 0
  for (const el of hit.querySelectorAll(RECOVERABLE_SELECTOR)) {
    if (++scanned > MAX_RECOVER_SCAN) break
    if (getComputedStyle(el).pointerEvents !== 'none') continue
    const rect = el.getBoundingClientRect()
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) continue
    let depth = 0
    for (let p: Element | null = el.parentElement; p && p !== hit; p = p.parentElement) depth++
    if (depth >= bestDepth) {
      best = el
      bestDepth = depth
    }
  }
  return best
}
