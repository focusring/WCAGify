// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { frameTransform } from '../src/content/picker/frame-transform'

/**
 * Covers mapping a framed element's rect into the top document, which is what positions the picker's
 * outline over a child section that lives in a same-origin iframe.
 *
 * happy-dom has no layout and does not implement frameElement from inside a frame document, so each
 * frame is given its rect, its border-box size, its borders and a frameElement link by hand — the same
 * approach pick-target's tests take with getBoundingClientRect. Padding comes from real inline longhands
 * (the `padding` shorthand isn't expanded here).
 */

function stubRect(el: Element, left: number, top: number, width: number, height: number): void {
  el.getBoundingClientRect = () =>
    ({
      left,
      top,
      right: left + width,
      bottom: top + height,
      width,
      height,
      x: left,
      y: top,
      toJSON() {}
    }) as DOMRect
}

function define(target: object, property: string, value: unknown): void {
  Object.defineProperty(target, property, { value, configurable: true })
}

// Turns an <iframe> into something frameTransform can walk: a laid-out box, a border, and the
// frameElement back-link its content window would carry in a browser.
function layOutFrame(
  frame: HTMLIFrameElement,
  box: { left: number; top: number; width: number; height: number },
  layout: { width: number; height: number },
  borders: { left: number; top: number } = { left: 0, top: 0 }
): Document {
  stubRect(frame, box.left, box.top, box.width, box.height)
  define(frame, 'offsetWidth', layout.width)
  define(frame, 'offsetHeight', layout.height)
  define(frame, 'clientLeft', borders.left)
  define(frame, 'clientTop', borders.top)
  const doc = frame.contentDocument!
  define(doc.defaultView!, 'frameElement', frame)
  return doc
}

describe('frameTransform', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('is the identity for a top-document element', () => {
    document.body.innerHTML = '<div id="t"></div>'
    expect(frameTransform(document.getElementById('t')!)).toEqual({
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1
    })
  })

  it('adds the frame position, its border and its padding', () => {
    document.body.innerHTML =
      '<iframe id="f" style="padding-left: 10px; padding-top: 6px"></iframe>'
    const frame = document.getElementById('f') as HTMLIFrameElement
    const doc = layOutFrame(
      frame,
      { left: 100, top: 50, width: 400, height: 300 },
      { width: 400, height: 300 },
      { left: 2, top: 3 }
    )
    doc.body.innerHTML = '<p id="inner">x</p>'

    // 100 + (2 border + 10 padding), 50 + (3 + 6) — padding is what a border-only offset missed.
    expect(frameTransform(doc.getElementById('inner')!)).toEqual({
      x: 112,
      y: 59,
      scaleX: 1,
      scaleY: 1
    })
  })

  it('reports the scale of a transformed frame, and scales its inset by it', () => {
    document.body.innerHTML = '<iframe id="f" style="padding-left: 20px"></iframe>'
    const frame = document.getElementById('f') as HTMLIFrameElement
    // A 400×300 frame painted at half size: rect is post-transform, offsetWidth/Height are not.
    const doc = layOutFrame(
      frame,
      { left: 100, top: 50, width: 200, height: 150 },
      { width: 400, height: 300 }
    )
    doc.body.innerHTML = '<p id="inner">x</p>'

    expect(frameTransform(doc.getElementById('inner')!)).toEqual({
      x: 110, // 100 + 20 * 0.5
      y: 50,
      scaleX: 0.5,
      scaleY: 0.5
    })
  })

  it('composes nested frames, applying the outer scale to the inner offset', () => {
    document.body.innerHTML = '<iframe id="outer"></iframe>'
    const outerFrame = document.getElementById('outer') as HTMLIFrameElement
    const outerDoc = layOutFrame(
      outerFrame,
      { left: 100, top: 0, width: 200, height: 200 },
      { width: 400, height: 400 }
    )
    outerDoc.body.innerHTML = '<iframe id="inner-frame"></iframe>'
    const innerFrame = outerDoc.getElementById('inner-frame') as HTMLIFrameElement
    const innerDoc = layOutFrame(
      innerFrame,
      { left: 40, top: 0, width: 100, height: 100 },
      { width: 100, height: 100 }
    )
    innerDoc.body.innerHTML = '<p id="inner">x</p>'

    // Inner frame sits at 40 inside the outer frame, which is painted at half scale from x=100:
    // 100 + 40 * 0.5 = 120, and the scales multiply.
    expect(frameTransform(innerDoc.getElementById('inner')!)).toEqual({
      x: 120,
      y: 0,
      scaleX: 0.5,
      scaleY: 0.5
    })
  })

  it('keeps what it has when a frame boundary is unreachable', () => {
    document.body.innerHTML = '<iframe id="f"></iframe>'
    const frame = document.getElementById('f') as HTMLIFrameElement
    const doc = frame.contentDocument!
    Object.defineProperty(doc.defaultView!, 'frameElement', {
      get() {
        throw new Error('SecurityError')
      },
      configurable: true
    })
    doc.body.innerHTML = '<p id="inner">x</p>'

    expect(frameTransform(doc.getElementById('inner')!)).toEqual({
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1
    })
  })
})
