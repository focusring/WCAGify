// Maps a point from an element's own viewport into the top document's: screen = x + local * scale, per
// axis. The picker's overlay lives in the top document while a child section can live in a same-origin
// iframe, whose rects are relative to that frame's viewport.
//
// Each hop contributes two things. The frame's content box is where the inner document's viewport origin
// sits, so border plus padding shifts everything inside it — padding included, which a border-only offset
// missed. And a CSS transform scales the frame's box without changing its own layout size, so the inner
// rects need scaling as well as shifting. Because the scale applies to the inset and to everything inside
// it, hops compose as an affine map instead of a sum of offsets.
//
// Identity for a top-document element. Rotation and skew aren't modelled: getBoundingClientRect reports
// only the bounding box of a rotated frame, which can't be undone without the real matrix.
export interface FrameTransform {
  x: number
  y: number
  scaleX: number
  scaleY: number
}

// A computed length in px. Unset properties read '' (and so NaN) wherever layout isn't resolved.
function px(value: string): number {
  const length = Number.parseFloat(value)
  return Number.isFinite(length) ? length : 0
}

export function frameTransform(el: Element): FrameTransform {
  let x = 0
  let y = 0
  let scaleX = 1
  let scaleY = 1
  try {
    let win = el.ownerDocument.defaultView
    while (win?.frameElement) {
      // Property access, not instanceof: a frame element from another realm fails the latter (see css-utils).
      const frame = win.frameElement as HTMLElement
      const rect = frame.getBoundingClientRect()
      const style = getComputedStyle(frame)
      const sx = frame.offsetWidth > 0 ? rect.width / frame.offsetWidth : 1
      const sy = frame.offsetHeight > 0 ? rect.height / frame.offsetHeight : 1
      x = rect.left + (frame.clientLeft + px(style.paddingLeft) + x) * sx
      y = rect.top + (frame.clientTop + px(style.paddingTop) + y) * sy
      scaleX *= sx
      scaleY *= sy
      win = frame.ownerDocument.defaultView
    }
  } catch {
    /* Cross-origin ancestor: nothing better available than what was accumulated so far */
  }
  return { x, y, scaleX, scaleY }
}
