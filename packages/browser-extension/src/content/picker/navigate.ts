import { rootHostOrFrame } from './css-utils'

// Steps one level up the DOM for the "select parent" action.
// Ordinary elements use parentElement, but two boundaries need bridging so the user can keep walking a real tree:
//   • Shadow DOM: parentElement is null at a shadow root; step to the host.
//   • Same-origin iframe: null at the frame's <html>; step to the owning <iframe>.
// Stops (returns null → button disabled) at the top document's <html>/<body> and at a cross-origin frame boundary.

// The raw parent one level up, bridging shadow-root and same-origin-iframe boundaries (see rootHostOrFrame).
// The DOM parent, deliberately: slotted content steps to its light-DOM parent, not to the <slot> css-utils' surfaceParent uses.
function crossBoundaryParent(el: Element): Element | null {
  return el.parentElement ?? rootHostOrFrame(el)
}

// True when doc is the top-level document (not embedded in a frame we can reach).
// A framed document has a truthy frameElement; the top document's is null (undefined in some engines).
function isTopDocument(doc: Document): boolean {
  try {
    return doc.defaultView ? !doc.defaultView.frameElement : true
  } catch {
    return false // cross-origin frame: treat as not-top so its <html>/<body> stay traversable
  }
}

// The element the "select parent" button should navigate to, or null when it should be disabled (no parent, or only the top page's <html>/<body> remain).
// A frame's own <html>/<body> stay traversable, so the user can step out to it.
export function getNavigableParent(el: Element): Element | null {
  const parent = crossBoundaryParent(el)
  if (!parent) return null

  const doc = parent.ownerDocument
  if (isTopDocument(doc) && (parent === doc.documentElement || parent === doc.body)) {
    return null
  }
  return parent
}
