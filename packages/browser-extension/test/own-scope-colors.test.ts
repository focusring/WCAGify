// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { collectElementInfo } from '../src/content/picker/collect'
import { resetHoverStylesCache } from '../src/content/picker/hover'

// A surfaced child reports its own text/icon colors in its own section, so the ancestor's rows must not repeat them.
// These tests pin that split, plus the fallback that keeps a color from vanishing when an element has none of its own.

const info = (id: string) => collectElementInfo(document.getElementById(id)!)

describe('own-scope text colors', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
    resetHoverStylesCache()
  })

  it("drops text belonging to a surfaced child, keeping the element's own", () => {
    document.body.innerHTML = `<div id="card">
      <p style="color: rgb(26, 26, 26)">Some heading</p>
      <button style="color: rgb(255, 255, 255)">Read more</button>
    </div>`
    expect(info('card').textColors).toEqual(['rgb(26, 26, 26)'])
  })

  it('keeps text under a descendant that gets no section of its own', () => {
    document.body.innerHTML = `<div id="card">
      <div><span style="color: rgb(26, 26, 26)">Plain text</span></div>
    </div>`
    expect(info('card').textColors).toEqual(['rgb(26, 26, 26)'])
  })

  it('excludes text nested deeper inside a surfaced child', () => {
    document.body.innerHTML = `<div id="card">
      <p style="color: rgb(26, 26, 26)">Some heading</p>
      <button><span style="color: rgb(255, 255, 255)">Read more</span></button>
    </div>`
    expect(info('card').textColors).toEqual(['rgb(26, 26, 26)'])
  })

  it('falls back to the whole subtree when the element has no text of its own', () => {
    document.body.innerHTML = `<div id="wrap">
      <button style="color: rgb(255, 255, 255)">Read more</button>
    </div>`
    expect(info('wrap').textColors).toEqual(['rgb(255, 255, 255)'])
  })

  it("still reports a surfaced element's own text when it is the selected element", () => {
    document.body.innerHTML = `<div id="card">
      <button id="cta" style="color: rgb(255, 255, 255)">Read more</button>
    </div>`
    expect(info('cta').textColors).toEqual(['rgb(255, 255, 255)'])
  })

  it('splits text across several surfaced children independently', () => {
    document.body.innerHTML = `<div id="card">
      <p style="color: rgb(26, 26, 26)">Some heading</p>
      <button style="color: rgb(255, 255, 255)">Buy</button>
      <a href="/x" style="color: rgb(0, 0, 255)">Site</a>
    </div>`
    expect(info('card').textColors).toEqual(['rgb(26, 26, 26)'])
  })
})

describe('own-scope icon colors', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
    resetHoverStylesCache()
  })

  it('drops a CSS-mask icon that belongs to a surfaced child', () => {
    document.body.innerHTML = `<div id="card">
      <span style="mask-image: url(a.svg); background-color: rgb(1, 2, 3)"></span>
      <button><span style="mask-image: url(b.svg); background-color: rgb(4, 5, 6)"></span></button>
    </div>`
    expect(info('card').iconColors).toEqual(['rgb(1, 2, 3)'])
  })

  it('falls back to the whole subtree when no icon belongs to the element itself', () => {
    document.body.innerHTML = `<div id="wrap">
      <button><span style="mask-image: url(b.svg); background-color: rgb(4, 5, 6)"></span></button>
    </div>`
    expect(info('wrap').iconColors).toEqual(['rgb(4, 5, 6)'])
  })
})
