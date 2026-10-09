// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { collectChildSections, collectElementInfo } from '../src/content/picker/collect'
import { resetHoverStylesCache } from '../src/content/picker/hover'

// An underline is plain text-decoration on the text's element or an ancestor — no pseudo-element or border to find —
// and only worth a row when its color differs from the text it runs under.
// Fixtures use the longhands: happy-dom doesn't expand the `text-decoration` shorthand into them (browsers do).

const info = (id: string) => collectElementInfo(document.getElementById(id)!)

describe('underline colors', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
    resetHoverStylesCache()
  })

  it('reports an underline whose color differs from the text', () => {
    document.body.innerHTML = `<a id="link" href="/x"
      style="color: rgb(97, 116, 126); text-decoration-line: underline; text-decoration-color: rgb(255, 242, 2)">PC Cases</a>`
    const link = info('link')
    expect(link.underlineColors).toEqual(['rgb(255, 242, 2)'])
    expect(link.underlineColorSources).toEqual([['a']])
  })

  it('skips an underline in the same color as its text', () => {
    document.body.innerHTML = `<a id="link" href="/x"
      style="color: rgb(97, 116, 126); text-decoration-line: underline; text-decoration-color: rgb(97, 116, 126)">PC Cases</a>`
    expect(info('link').underlineColors).toEqual([])
  })

  it('reports no underline for undecorated text', () => {
    document.body.innerHTML = `<p id="p" style="color: rgb(26, 26, 26)">Plain text</p>`
    expect(info('p').underlineColors).toEqual([])
  })

  // The child's own computed text-decoration-line is `none`, yet the ancestor's underline runs through its text.
  it("reports an ancestor's underline on a picked descendant, sourced to the ancestor", () => {
    document.body.innerHTML = `<span style="color: rgb(97, 116, 126); text-decoration-line: underline; text-decoration-color: rgb(255, 242, 2)">
      <span id="prefix">By</span> Ravi Teja
    </span>`
    const prefix = info('prefix')
    expect(prefix.underlineColors).toEqual(['rgb(255, 242, 2)'])
    expect(prefix.underlineColorSources).toEqual([['span']])
  })

  it('counts an underlining element once, however many text nodes it runs under', () => {
    document.body.innerHTML = `<span id="author" style="color: rgb(97, 116, 126); text-decoration-line: underline; text-decoration-color: rgb(255, 242, 2)">
      <span>By</span> Ravi Teja
    </span>`
    expect(info('author').underlineColorSources).toEqual([['span']])
  })

  it('compares against the inner text color, not the decorating element’s', () => {
    document.body.innerHTML = `<span style="color: rgb(255, 0, 0); text-decoration-line: underline; text-decoration-color: rgb(255, 0, 0)">
      <span id="inner" style="color: rgb(0, 0, 255)">Blue text</span>
    </span>`
    expect(info('inner').underlineColors).toEqual(['rgb(255, 0, 0)'])
  })

  it("doesn't carry an underline into an inline-block", () => {
    document.body.innerHTML = `<a href="/x" style="text-decoration-line: underline; text-decoration-color: rgb(255, 0, 0)">
      <span id="box" style="display: inline-block; color: rgb(0, 0, 0)">Badge</span>
    </a>`
    expect(info('box').underlineColors).toEqual([])
  })

  it("doesn't carry an underline into an absolutely positioned descendant", () => {
    document.body.innerHTML = `<div style="text-decoration-line: underline; text-decoration-color: rgb(255, 0, 0)">
      <span id="abs" style="position: absolute; color: rgb(0, 0, 0)">Tooltip</span>
    </div>`
    expect(info('abs').underlineColors).toEqual([])
  })

  it("reaches through a shadow root to the host's underline", () => {
    document.body.innerHTML = `<div id="host" style="color: rgb(0, 0, 0); text-decoration-line: underline; text-decoration-color: rgb(255, 0, 0)"></div>`
    const host = document.getElementById('host')!
    host.attachShadow({ mode: 'open' }).innerHTML = '<span>Shadow text</span>'
    const inner = host.shadowRoot!.querySelector('span')!
    expect(collectElementInfo(inner).underlineColors).toEqual(['rgb(255, 0, 0)'])
  })

  it("leaves a surfaced child's underline to the child's own section", () => {
    document.body.innerHTML = `<div id="card">
      <p style="color: rgb(26, 26, 26)">Intro</p>
      <a href="/x" style="color: rgb(0, 0, 0); text-decoration-line: underline; text-decoration-color: rgb(255, 242, 2)">Read more</a>
    </div>`
    expect(info('card').underlineColors).toEqual([])
    const { sections } = collectChildSections(document.getElementById('card')!)
    expect(sections[0]!.underlineColors).toEqual(['rgb(255, 242, 2)'])
  })
})
