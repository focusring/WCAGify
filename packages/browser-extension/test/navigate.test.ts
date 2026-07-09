import { describe, it, expect, beforeEach } from 'vitest'
import { getNavigableParent } from '../src/content/picker/navigate'

describe('getNavigableParent', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('returns the direct parent element for a normal nested element', () => {
    document.body.innerHTML = '<section><div class="wrap"><span id="leaf"></span></div></section>'
    const leaf = document.getElementById('leaf')!
    expect(getNavigableParent(leaf)).toBe(leaf.parentElement)
    expect((getNavigableParent(leaf) as HTMLElement).className).toBe('wrap')
  })

  it('walks up one level at a time', () => {
    document.body.innerHTML = '<div class="a"><div class="b"><div class="c"></div></div></div>'
    const c = document.querySelector('.c')!
    const b = getNavigableParent(c)!
    expect((b as HTMLElement).className).toBe('b')
    const a = getNavigableParent(b)!
    expect((a as HTMLElement).className).toBe('a')
  })

  it('returns null when the parent is <body> (top-page boundary)', () => {
    document.body.innerHTML = '<div id="top"></div>'
    const top = document.getElementById('top')!
    expect(getNavigableParent(top)).toBeNull()
  })

  it('returns null when the parent is <html> (element is <body>)', () => {
    expect(getNavigableParent(document.body)).toBeNull()
  })

  it('returns null for a detached element with no parent', () => {
    const orphan = document.createElement('div')
    expect(getNavigableParent(orphan)).toBeNull()
  })

  it('steps out of a shadow root to its host element', () => {
    document.body.innerHTML = '<div class="outer"><div id="host"></div></div>'
    const host = document.getElementById('host')!
    const shadow = host.attachShadow({ mode: 'open' })
    const inner = document.createElement('span')
    shadow.appendChild(inner)

    // parentElement is null at the shadow boundary; navigation crosses to the host.
    expect(inner.parentElement).toBeNull()
    expect(getNavigableParent(inner)).toBe(host)
    // ...and the host keeps navigating up its own light-DOM tree.
    expect((getNavigableParent(host) as HTMLElement).className).toBe('outer')
  })
})

describe('getNavigableParent across an iframe boundary', () => {
  let iframe: HTMLIFrameElement
  let idoc: Document

  beforeEach(() => {
    document.body.innerHTML = '<div class="frame-wrap"></div>'
    iframe = document.createElement('iframe')
    document.querySelector('.frame-wrap')!.appendChild(iframe)
    idoc = iframe.contentDocument!
    // A same-origin frame's window links back to its host <iframe> via frameElement.
    // happy-dom leaves it unset, so wire it here to reproduce the real browser boundary the code crosses.
    Object.defineProperty(idoc.defaultView, 'frameElement', { value: iframe, configurable: true })
  })

  it("traverses within the frame's own document, then steps out to the host <iframe>", () => {
    idoc.body.innerHTML = '<div id="inner"></div>'
    const inner = idoc.getElementById('inner')!

    // A frame's own <body>/<html> stay traversable (unlike the top document's).
    expect(getNavigableParent(inner)).toBe(idoc.body)
    expect(getNavigableParent(idoc.body)).toBe(idoc.documentElement)
    // At the frame's <html>, the next step is the host <iframe> element in the embedding page.
    expect(getNavigableParent(idoc.documentElement)).toBe(iframe)
    // The host <iframe> then navigates up the top document normally.
    expect((getNavigableParent(iframe) as HTMLElement).className).toBe('frame-wrap')
  })

  it('disables at a cross-origin frame boundary (frameElement access throws)', () => {
    // Cross-origin: reading frameElement throws a SecurityError. The frame's <html> then has nowhere to go, so the button disables rather than leaking across origins.
    Object.defineProperty(idoc.defaultView, 'frameElement', {
      get() {
        throw new Error('SecurityError')
      },
      configurable: true
    })
    expect(getNavigableParent(idoc.documentElement)).toBeNull()
  })
})
