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

// Resolve a picker hit to its "interactive unit". Keep content-bearing hits (text/icon); otherwise resolve to the NEAREST <a>/<button> ancestor and stop never promote past it, so a nested interactive (another <a>, or a custom-element wrapper) stays individually selectable. When none is on the path, keep the hit itself.
export function getPickTarget(el: Element): Element {
  if (hasOwnVisibleContent(el)) return el

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

// document.elementFromPoint skips elements with pointer-events: none, so a disabled control (e.g. Tailwind disabled:pointer-events-none) is invisible to the hit test and the picker resolves to its wrapper.
// Recover it: the deepest interactive descendant in the hit's subtree that computes pointer-events: none and whose box holds the cursor.
// Returns the hit unchanged when there's nothing to recover. Ties resolve to later document order (on top).
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
