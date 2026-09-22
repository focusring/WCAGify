// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { flatDescendants, isOwnScope } from '../src/content/picker/css-utils'

const tags = (el: Element): string[] => [...flatDescendants(el)].map((e) => e.localName)

describe('flatDescendants', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('walks ordinary descendants in document order', () => {
    document.body.innerHTML = '<div id="r"><section><p></p></section><span></span></div>'
    expect(tags(document.getElementById('r')!)).toEqual(['section', 'p', 'span'])
  })

  it('reaches into an open shadow root, which querySelectorAll cannot', () => {
    document.body.innerHTML = '<div id="r"></div>'
    const host = document.getElementById('r')!
    host.attachShadow({ mode: 'open' }).innerHTML = '<a><em></em></a>'
    expect(host.querySelectorAll('*').length).toBe(0)
    expect(tags(host)).toEqual(['a', 'em'])
  })

  // The component's own surface paints over whatever the page slots into it, so it comes first.
  it('yields shadow content before slotted light-DOM children, each exactly once', () => {
    document.body.innerHTML = '<div id="r"><b></b></div>'
    const host = document.getElementById('r')!
    host.attachShadow({ mode: 'open' }).innerHTML = '<a><slot></slot></a>'
    expect(tags(host)).toEqual(['a', 'slot', 'b'])
  })

  it('stops at a closed shadow root — unreachable from outside the component', () => {
    document.body.innerHTML = '<div id="r"></div>'
    const host = document.getElementById('r')!
    host.attachShadow({ mode: 'closed' }).innerHTML = '<a></a>'
    expect(tags(host)).toEqual([])
  })

  it('descends through nested shadow roots', () => {
    document.body.innerHTML = '<div id="r"></div>'
    const host = document.getElementById('r')!
    const outer = host.attachShadow({ mode: 'open' })
    outer.innerHTML = '<inner-el></inner-el>'
    outer.querySelector('inner-el')!.attachShadow({ mode: 'open' }).innerHTML = '<i></i>'
    expect(tags(host)).toEqual(['inner-el', 'i'])
  })
})

describe('isOwnScope', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  const isLink = (el: Element): boolean => el.localName === 'a'

  it('drops a value sitting under a boundary in the same tree', () => {
    document.body.innerHTML = '<div id="r"><a href="#"><span id="t"></span></a></div>'
    const root = document.getElementById('r')!
    expect(isOwnScope(document.getElementById('t')!, root, isLink)).toBe(false)
  })

  it('keeps a value with no boundary between it and the root', () => {
    document.body.innerHTML = '<div id="r"><p><span id="t"></span></p></div>'
    const root = document.getElementById('r')!
    expect(isOwnScope(document.getElementById('t')!, root, isLink)).toBe(true)
  })

  it("treats the host's shadow content as the host's own, even behind a boundary element", () => {
    document.body.innerHTML = '<div id="r"></div>'
    const root = document.getElementById('r')!
    const shadow = root.attachShadow({ mode: 'open' })
    shadow.innerHTML = '<a href="#"><span id="inner"></span></a>'
    expect(isOwnScope(shadow.getElementById('inner')!, root, isLink)).toBe(true)
  })
})
