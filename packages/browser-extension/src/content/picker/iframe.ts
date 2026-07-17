import type { IframeState, MediaInfo } from './types'

export interface IframeProbe {
  state: IframeState
  innerRoot: Element | null // the element to run detection on, set only when state === 'content'
}

// Reaches the iframe's inner document, or reports that the same-origin policy blocks it.
// A cross-origin `contentDocument` read returns null *silently* (no throw) in modern browsers, so a
// null result is ambiguous — we disambiguate by touching the content window's `location`, which does
// throw a SecurityError across origins. The outer try/catch covers browsers that throw on the read itself.
function accessInnerDocument(iframe: HTMLIFrameElement): {
  doc: Document | null
  crossOrigin: boolean
} {
  try {
    const doc = iframe.contentDocument
    if (doc) return { doc, crossOrigin: false }
  } catch {
    return { doc: null, crossOrigin: true }
  }
  const win = iframe.contentWindow
  if (!win) return { doc: null, crossOrigin: false } // detached / no browsing context
  try {
    void win.location.href // throws SecurityError for a cross-origin window
    return { doc: null, crossOrigin: false } // same-origin but no document yet (rare, e.g. mid-navigation)
  } catch {
    return { doc: null, crossOrigin: true }
  }
}

// Classifies an <iframe> by how reachable its inner content is, and returns the element to detect on
// when that content is present. The picker can't see through a frame boundary (elementFromPoint stops
// at it, getComputedStyle/DOM queries don't cross it), so the picked target is always the frame itself.
export function probeIframe(iframe: HTMLIFrameElement): IframeProbe {
  const { doc, crossOrigin } = accessInnerDocument(iframe)
  if (crossOrigin) return { state: 'cross-origin', innerRoot: null }
  if (!doc) return { state: 'inaccessible', innerRoot: null }
  const body = doc.body
  // A body with no element children and no text is an unfilled shell (an about:blank ad slot before its script runs).
  const hasContent = !!body && (body.children.length > 0 || !!body.textContent?.trim())
  if (!hasContent) return { state: 'empty', innerRoot: null }
  return { state: 'content', innerRoot: body }
}

// The media-row descriptor for an iframe, rendered like image/video (kind + parenthetical state).
export function iframeMedia(state: IframeState): MediaInfo {
  return { kind: 'iframe', format: '', iframeState: state }
}
