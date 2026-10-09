// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { collectChildSections, collectElementInfo } from '../src/content/picker/collect'
import { resetHoverStylesCache } from '../src/content/picker/hover'

// A text decoration is plain text-decoration on the text's element or an ancestor no pseudo-element or border to find and only worth a row when its color differs from the text it runs under.
// Fixtures use the longhands: happy-dom doesn't expand the `text-decoration` shorthand into them (browsers do).

const info = (id: string) => collectElementInfo(document.getElementById(id)!)

describe('text decoration colors', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
    resetHoverStylesCache()
  })

  it('reports an underline whose color differs from the text', () => {
    document.body.innerHTML = `<a id="link" href="/x"
      style="color: rgb(97, 116, 126); text-decoration-line: underline; text-decoration-color: rgb(255, 242, 2)">PC Cases</a>`
    const link = info('link')
    expect(link.decorationColors).toEqual(['rgb(255, 242, 2)'])
    expect(link.decorationLines).toEqual(['underline'])
    expect(link.decorationColorSources).toEqual([['a']])
  })

  it('reports line-through and overline, naming the line', () => {
    document.body.innerHTML = `<p id="price" style="color: rgb(0, 0, 0)">
      <s style="text-decoration-line: line-through; text-decoration-color: rgb(255, 0, 0)">€99</s>
      <span style="text-decoration-line: overline; text-decoration-color: rgb(0, 0, 255)">€79</span>
    </p>`
    const price = info('price')
    expect(price.decorationColors).toEqual(['rgb(255, 0, 0)', 'rgb(0, 0, 255)'])
    expect(price.decorationLines).toEqual(['line-through', 'overline'])
    expect(price.decorationColorSources).toEqual([['s'], ['span']])
  })

  it('keeps several lines from one element together, in a fixed order', () => {
    document.body.innerHTML = `<span id="both" style="color: rgb(0, 0, 0); text-decoration-line: line-through underline; text-decoration-color: rgb(255, 0, 0)">Both</span>`
    expect(info('both').decorationLines).toEqual(['underline line-through'])
  })

  it('keeps one color drawn as two different lines as two entries', () => {
    document.body.innerHTML = `<p id="p" style="color: rgb(0, 0, 0)">
      <u style="text-decoration-line: underline; text-decoration-color: rgb(255, 0, 0)">New</u>
      <s style="text-decoration-line: line-through; text-decoration-color: rgb(255, 0, 0)">Old</s>
    </p>`
    const p = info('p')
    expect(p.decorationColors).toEqual(['rgb(255, 0, 0)', 'rgb(255, 0, 0)'])
    expect(p.decorationLines).toEqual(['underline', 'line-through'])
  })

  it('skips a decoration in the same color as its text', () => {
    document.body.innerHTML = `<a id="link" href="/x"
      style="color: rgb(97, 116, 126); text-decoration-line: underline; text-decoration-color: rgb(97, 116, 126)">PC Cases</a>`
    expect(info('link').decorationColors).toEqual([])
  })

  it('reports no decoration for undecorated text', () => {
    document.body.innerHTML = `<p id="p" style="color: rgb(26, 26, 26)">Plain text</p>`
    expect(info('p').decorationColors).toEqual([])
  })

  // The child's own computed text-decoration-line is `none`, yet the ancestor's underline runs through its text.
  it("reports an ancestor's decoration on a picked descendant, sourced to the ancestor", () => {
    document.body.innerHTML = `<span style="color: rgb(97, 116, 126); text-decoration-line: underline; text-decoration-color: rgb(255, 242, 2)">
      <span id="prefix">By</span> Ravi Teja
    </span>`
    const prefix = info('prefix')
    expect(prefix.decorationColors).toEqual(['rgb(255, 242, 2)'])
    expect(prefix.decorationColorSources).toEqual([['span']])
  })

  it('counts a decorating element once, however many text nodes it runs under', () => {
    document.body.innerHTML = `<span id="author" style="color: rgb(97, 116, 126); text-decoration-line: underline; text-decoration-color: rgb(255, 242, 2)">
      <span>By</span> Ravi Teja
    </span>`
    expect(info('author').decorationColorSources).toEqual([['span']])
  })

  it('compares against the inner text color, not the decorating element’s', () => {
    document.body.innerHTML = `<span style="color: rgb(255, 0, 0); text-decoration-line: underline; text-decoration-color: rgb(255, 0, 0)">
      <span id="inner" style="color: rgb(0, 0, 255)">Blue text</span>
    </span>`
    expect(info('inner').decorationColors).toEqual(['rgb(255, 0, 0)'])
  })

  it("doesn't carry a decoration into an inline-block", () => {
    document.body.innerHTML = `<a href="/x" style="text-decoration-line: underline; text-decoration-color: rgb(255, 0, 0)">
      <span id="box" style="display: inline-block; color: rgb(0, 0, 0)">Badge</span>
    </a>`
    expect(info('box').decorationColors).toEqual([])
  })

  it("doesn't carry a decoration into an absolutely positioned descendant", () => {
    document.body.innerHTML = `<div style="text-decoration-line: underline; text-decoration-color: rgb(255, 0, 0)">
      <span id="abs" style="position: absolute; color: rgb(0, 0, 0)">Tooltip</span>
    </div>`
    expect(info('abs').decorationColors).toEqual([])
  })

  it("reaches through a shadow root to the host's decoration", () => {
    document.body.innerHTML = `<div id="host" style="color: rgb(0, 0, 0); text-decoration-line: underline; text-decoration-color: rgb(255, 0, 0)"></div>`
    const host = document.getElementById('host')!
    host.attachShadow({ mode: 'open' }).innerHTML = '<span>Shadow text</span>'
    const inner = host.shadowRoot!.querySelector('span')!
    expect(collectElementInfo(inner).decorationColors).toEqual(['rgb(255, 0, 0)'])
  })

  it("leaves a surfaced child's decoration to the child's own section", () => {
    document.body.innerHTML = `<div id="card">
      <p style="color: rgb(26, 26, 26)">Intro</p>
      <a href="/x" style="color: rgb(0, 0, 0); text-decoration-line: underline; text-decoration-color: rgb(255, 242, 2)">Read more</a>
    </div>`
    expect(info('card').decorationColors).toEqual([])
    const { sections } = collectChildSections(document.getElementById('card')!)
    expect(sections[0]!.decorationColors).toEqual(['rgb(255, 242, 2)'])
  })
})
