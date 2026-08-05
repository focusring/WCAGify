// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { collectChildSections, collectElementInfo } from '../src/content/picker/collect'
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

  // No summarising of what the children already show: the button gets a section of its own in the panel, so repeating
  // its color here would be the duplication the split exists to remove.
  it('reports no text of its own when every color belongs to a child section', () => {
    document.body.innerHTML = `<div id="wrap">
      <button style="color: rgb(255, 255, 255)">Read more</button>
    </div>`
    expect(info('wrap').textColors).toEqual([])
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

  it('reports no icon of its own when the only icon belongs to a child section', () => {
    document.body.innerHTML = `<div id="wrap">
      <button><span style="mask-image: url(b.svg); background-color: rgb(4, 5, 6)"></span></button>
    </div>`
    expect(info('wrap').iconColors).toEqual([])
  })
})

// A control's leading/trailing icons sit in the wrapper around it, not inside the <input>, so a section anchored on the
// control alone leaves them to the ancestor. The section anchors on that wrapper instead — but still reports the
// control's identity, since the <input> is the thing an audit refers to.
describe('form controls surface with their adornment wrapper', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
    resetHoverStylesCache()
  })

  const searchField = `<div id="card">
    <p style="color: rgb(26, 26, 26)">Find a report</p>
    <div class="field">
      <input placeholder="Search reports">
      <span style="mask-image: url(search.svg); background-color: rgb(9, 9, 9)"></span>
    </div>
  </div>`

  it("keeps the wrapper's icon out of the ancestor's row", () => {
    document.body.innerHTML = searchField
    expect(info('card').iconColors).toEqual([])
  })

  it("reports the wrapper's icon in the control's own section", () => {
    document.body.innerHTML = searchField
    const { sections } = collectChildSections(document.getElementById('card')!)
    expect(sections).toHaveLength(1)
    expect(sections[0]!.iconColors).toEqual(['rgb(9, 9, 9)'])
  })

  it("presents the section under the control's identity, not the wrapper's", () => {
    document.body.innerHTML = searchField
    const { sections, elements } = collectChildSections(document.getElementById('card')!)
    expect(sections[0]!.role).toBe('textbox')
    expect(sections[0]!.label).toBe('Search reports')
    expect(sections[0]!.selector).toBe('input')
    // The "select child" button must land on the control the section names.
    expect(elements).toEqual([document.querySelector('input')])
  })

  it('does not promote past a wrapper that carries its own text', () => {
    document.body.innerHTML = `<div id="card">
      <div class="group">
        <label for="q" style="color: rgb(26, 26, 26)">Query</label>
        <input id="q" placeholder="Search reports">
      </div>
    </div>`
    // Promoting to .group would pull the label's text into the control's section, so the label stays the ancestor's.
    expect(info('card').textColors).toEqual(['rgb(26, 26, 26)'])
    const { sections } = collectChildSections(document.getElementById('card')!)
    expect(sections[0]!.selector).toBe('#q')
  })

  it('does not promote to a wrapper holding a second widget', () => {
    document.body.innerHTML = `<div id="card">
      <div class="field">
        <input placeholder="Search reports">
        <button aria-label="Clear"><span style="mask-image: url(x.svg); background-color: rgb(7, 7, 7)"></span></button>
      </div>
    </div>`
    const { sections } = collectChildSections(document.getElementById('card')!)
    // The clear button reports its own icon; the input stays anchored on itself.
    expect(sections.map((s) => s.role)).toEqual(['textbox', 'button'])
    expect(sections[0]!.iconColors).toEqual([])
    expect(sections[1]!.iconColors).toEqual(['rgb(7, 7, 7)'])
  })

  it('makes no nested section when the wrapper is the picked element itself', () => {
    document.body.innerHTML = `<div id="field">
      <input placeholder="Search reports">
      <span style="mask-image: url(search.svg); background-color: rgb(9, 9, 9)"></span>
    </div>`
    const field = document.getElementById('field')!
    expect(collectChildSections(field).sections).toEqual([])
    // Nothing was surfaced below it, so its own rows carry the control's values.
    expect(info('field').iconColors).toEqual(['rgb(9, 9, 9)'])
  })
})

// Every text/icon color carries the elements it was found on, so a value shared with a child section reads as a reused
// design token rather than a duplicate.
describe('color sources', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
    resetHoverStylesCache()
  })

  it('names the elements a text color came from, aligned with the color array', () => {
    document.body.innerHTML = `<div id="card">
      <h1 style="color: rgb(26, 26, 26)">Reports</h1>
      <p style="color: rgb(80, 80, 80)">Subtitle</p>
    </div>`
    const card = info('card')
    expect(card.textColors).toEqual(['rgb(26, 26, 26)', 'rgb(80, 80, 80)'])
    expect(card.textColorSources).toEqual([['h1'], ['p']])
  })

  it('collapses repeats of one element into a count', () => {
    document.body.innerHTML = `<table id="card"><tbody><tr>
      <td style="color: rgb(26, 26, 26)">a</td>
      <td style="color: rgb(26, 26, 26)">b</td>
      <td style="color: rgb(26, 26, 26)">c</td>
    </tr></tbody></table>`
    expect(info('card').textColorSources).toEqual([['td ×3']])
  })

  it('names an icon by its icon class rather than its tag', () => {
    document.body.innerHTML = `<div id="card">
      <span class="iconify i-lucide:search" style="mask-image: url(s.svg); background-color: rgb(9, 9, 9)"></span>
    </div>`
    expect(info('card').iconColorSources).toEqual([['i-lucide:search']])
  })

  it('reports only the sources behind the colors it kept', () => {
    document.body.innerHTML = `<div id="card">
      <h1 style="color: rgb(26, 26, 26)">Reports</h1>
      <button style="color: rgb(255, 255, 255)">Buy</button>
    </div>`
    const card = info('card')
    expect(card.textColors).toEqual(['rgb(26, 26, 26)'])
    expect(card.textColorSources).toEqual([['h1']])
  })
})
