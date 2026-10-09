// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { collectChildSections, collectElementInfo } from '../src/content/picker/collect'
import { resetHoverStylesCache } from '../src/content/picker/hover'

// A highlight is an inline element's background behind part of the text (a <mark>, a span with background-color).
// Picking the container reports the highlighted text's color in the Text row, so without its own row the only background shown would be the container's surface, the wrong one to pair that text with.
// Fixtures set `display: inline` and the <mark> color explicitly: happy-dom leaves both unset (browsers default them).

const info = (id: string) => collectElementInfo(document.getElementById(id)!)

describe('highlight colors', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
    resetHoverStylesCache()
  })

  it('reports an inline highlight inside the picked element', () => {
    document.body.innerHTML = `<p id="p" style="color: rgb(0, 0, 0); background-color: rgb(255, 255, 255)">
      Some <mark style="display: inline; background-color: rgb(255, 255, 0)">highlighted</mark> text
    </p>`
    const p = info('p')
    expect(p.highlightColors).toEqual(['rgb(255, 255, 0)'])
    expect(p.highlightColorSources).toEqual([['mark']])
  })

  it('reports the innermost highlight behind each text run', () => {
    document.body.innerHTML = `<p id="p" style="background-color: rgb(255, 255, 255)">
      <span style="display: inline; background-color: rgb(255, 255, 0)">outer <b style="display: inline; background-color: rgb(0, 255, 0)">inner</b></span>
    </p>`
    expect(info('p').highlightColors).toEqual(['rgb(255, 255, 0)', 'rgb(0, 255, 0)'])
  })

  it('counts a highlighting element once, however many text nodes it sits behind', () => {
    document.body.innerHTML = `<p id="p" style="background-color: rgb(255, 255, 255)">
      <mark style="display: inline; background-color: rgb(255, 255, 0)">one <i>two</i> three</mark>
    </p>`
    expect(info('p').highlightColorSources).toEqual([['mark']])
  })

  it('skips a highlight in the same color as the surface around it', () => {
    document.body.innerHTML = `<p id="p" style="background-color: rgb(255, 255, 255)">
      Pasted <span style="display: inline; background-color: rgb(255, 255, 255)">from Word</span>
    </p>`
    expect(info('p').highlightColors).toEqual([])
  })

  it('treats a block or inline-block background as a nested surface, not a highlight', () => {
    document.body.innerHTML = `<div id="card" style="background-color: rgb(255, 255, 255)">
      <div style="background-color: rgb(240, 240, 240)">Panel</div>
      <span style="display: inline-block; background-color: rgb(255, 0, 0)">Badge</span>
    </div>`
    expect(info('card').highlightColors).toEqual([])
  })

  it("leaves the picked element's own background to the Element row", () => {
    document.body.innerHTML = `<p style="background-color: rgb(255, 255, 255)">
      <mark id="m" style="display: inline; background-color: rgb(255, 255, 0)">highlighted</mark>
    </p>`
    const mark = info('m')
    expect(mark.highlightColors).toEqual([])
    expect(mark.elementColor).toBe('rgb(255, 255, 0)')
  })

  it("leaves a highlight inside a surfaced child to the child's own section", () => {
    document.body.innerHTML = `<div id="card" style="background-color: rgb(255, 255, 255)">
      <button>Buy <mark style="display: inline; background-color: rgb(255, 255, 0)">now</mark></button>
    </div>`
    expect(info('card').highlightColors).toEqual([])
    const { sections } = collectChildSections(document.getElementById('card')!)
    expect(sections[0]!.highlightColors).toEqual(['rgb(255, 255, 0)'])
  })
})
