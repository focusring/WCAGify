import { describe, it, expect, beforeEach } from 'vitest'
import { iframeMedia, probeIframe } from '../src/content/picker/iframe'
import { isHtmlTag, isSvgElement, isSvgTag } from '../src/content/picker/css-utils'
import { getMediaInfo } from '../src/content/picker/media'

// A stand-in <iframe> whose contentDocument/contentWindow behave like the case under test.
// happy-dom can't model a real cross-origin frame, so those cases are simulated via getters that
// mirror the browser's behaviour: a cross-origin contentDocument read returns null silently, and
// reading the content window's location throws a SecurityError.
function fakeIframe(overrides: {
  contentDocument?: Document | null | (() => never)
  contentWindow?: Partial<Window> | null | (() => never)
}): HTMLIFrameElement {
  const obj = {}
  Object.defineProperty(obj, 'contentDocument', {
    get() {
      const v = overrides.contentDocument
      if (typeof v === 'function') return (v as () => never)()
      return v ?? null
    }
  })
  Object.defineProperty(obj, 'contentWindow', {
    get() {
      const v = overrides.contentWindow
      if (typeof v === 'function') return (v as () => never)()
      return v ?? null
    }
  })
  return obj as HTMLIFrameElement
}

const throwSecurity = (): never => {
  throw new DOMException('Blocked a frame from accessing a cross-origin frame.', 'SecurityError')
}

describe('probeIframe', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('classifies a same-origin frame with element content as "content", rooted at its body', () => {
    document.body.innerHTML = '<iframe></iframe>'
    const iframe = document.querySelector('iframe')!
    iframe.contentDocument!.body.innerHTML = '<div class="ad">Buy now</div>'

    const probe = probeIframe(iframe)
    expect(probe.state).toBe('content')
    expect(probe.innerRoot).toBe(iframe.contentDocument!.body)
  })

  it('treats text-only body content as "content"', () => {
    document.body.innerHTML = '<iframe></iframe>'
    const iframe = document.querySelector('iframe')!
    iframe.contentDocument!.body.append(document.createTextNode('bare text'))

    expect(probeIframe(iframe).state).toBe('content')
  })

  it('classifies a same-origin frame with an empty body as "empty"', () => {
    document.body.innerHTML = '<iframe></iframe>'
    const iframe = document.querySelector('iframe')!

    const probe = probeIframe(iframe)
    expect(probe.state).toBe('empty')
    expect(probe.innerRoot).toBeNull()
  })

  it('treats a whitespace-only body as "empty"', () => {
    document.body.innerHTML = '<iframe></iframe>'
    const iframe = document.querySelector('iframe')!
    iframe.contentDocument!.body.append(document.createTextNode('   \n  '))

    expect(probeIframe(iframe).state).toBe('empty')
  })

  it('classifies a frame whose contentDocument read returns null and window is opaque as "cross-origin"', () => {
    const iframe = fakeIframe({
      contentDocument: null,
      contentWindow: {
        get location(): never {
          return throwSecurity()
        }
      } as unknown as Window
    })
    const probe = probeIframe(iframe)
    expect(probe.state).toBe('cross-origin')
    expect(probe.innerRoot).toBeNull()
  })

  it('classifies a frame whose contentDocument getter throws as "cross-origin"', () => {
    const iframe = fakeIframe({ contentDocument: throwSecurity })
    expect(probeIframe(iframe).state).toBe('cross-origin')
  })

  it('classifies a frame with no browsing context as "inaccessible"', () => {
    const iframe = fakeIframe({ contentDocument: null, contentWindow: null })
    expect(probeIframe(iframe).state).toBe('inaccessible')
  })

  it('classifies a same-origin frame that has a window but no document yet as "inaccessible"', () => {
    const iframe = fakeIframe({
      contentDocument: null,
      contentWindow: { location: { href: 'about:blank' } } as unknown as Window
    })
    expect(probeIframe(iframe).state).toBe('inaccessible')
  })
})

// The picker now reaches into same-origin frame content, where `el instanceof HTMLImageElement` is false
// because the frame's document is a different realm. happy-dom shares constructors across its frames and so
// cannot reproduce that split — these tests pin the realm-independent contract (namespace + localName) that
// the detectors rely on instead, since a realm regression would otherwise stay green here and only break in Chrome.
describe('realm-safe element type checks', () => {
  it('identifies HTML and SVG elements by namespace + localName, not constructor identity', () => {
    const img = document.createElementNS('http://www.w3.org/1999/xhtml', 'img')
    const svgImage = document.createElementNS('http://www.w3.org/2000/svg', 'image')
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')

    expect(isHtmlTag(img, 'img')).toBe(true)
    expect(isHtmlTag(img, 'video')).toBe(false)
    expect(isSvgTag(svgImage, 'image')).toBe(true)
    expect(isSvgElement(svg)).toBe(true)
    // An SVG <image> must not be mistaken for an HTML <img>, and vice versa — they share no namespace.
    expect(isHtmlTag(svgImage, 'image')).toBe(false)
    expect(isSvgElement(img)).toBe(false)
  })

  it('detects media on an <img> living inside a frame document', () => {
    document.body.innerHTML = '<iframe></iframe>'
    const iframe = document.querySelector('iframe')!
    iframe.contentDocument!.body.innerHTML = '<img src="/ad/banner.png">'
    const innerImg = iframe.contentDocument!.querySelector('img')!

    expect(getMediaInfo(innerImg)).toEqual({ kind: 'image', format: 'png' })
  })
})

describe('iframeMedia', () => {
  it('builds an iframe media descriptor carrying the state', () => {
    expect(iframeMedia('content')).toEqual({ kind: 'iframe', format: '', iframeState: 'content' })
    expect(iframeMedia('cross-origin')).toEqual({
      kind: 'iframe',
      format: '',
      iframeState: 'cross-origin'
    })
  })
})
