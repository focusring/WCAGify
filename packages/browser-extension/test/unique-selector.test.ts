import { describe, it, expect, beforeEach } from 'vitest'
import { getUniqueSelector } from '../src/content/unique-selector'

describe('getUniqueSelector', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('returns id selector for element with unique id', () => {
    document.body.innerHTML = '<div id="main"></div>'
    const el = document.getElementById('main')!
    expect(getUniqueSelector(el)).toBe('#main')
  })

  it('does not use id if it is duplicated', () => {
    document.body.innerHTML = '<div id="dup"></div><div id="dup"></div>'
    const el = document.querySelector('div')!
    const selector = getUniqueSelector(el) as string
    expect(selector).not.toBe('#dup')
    expect(document.querySelector(selector)).toBe(el)
  })

  it('returns unique selector for element without id', () => {
    document.body.innerHTML = '<div><span></span></div>'
    const el = document.querySelector('span')!
    const selector = getUniqueSelector(el) as string
    expect(document.querySelector(selector)).toBe(el)
  })

  it('prefers class-based selectors when class is unique', () => {
    document.body.innerHTML = '<div><span class="unique-thing"></span><span></span></div>'
    const el = document.querySelector('.unique-thing')!
    const selector = getUniqueSelector(el) as string
    expect(selector).toContain('unique-thing')
    expect(document.querySelector(selector)).toBe(el)
  })

  it('prefers attribute-based selectors when attribute is unique', () => {
    document.body.innerHTML = '<div><span data-testid="foo"></span><span></span></div>'
    const el = document.querySelector('[data-testid="foo"]')!
    const selector = getUniqueSelector(el) as string
    expect(selector).toContain('data-testid')
    expect(document.querySelector(selector)).toBe(el)
  })

  it('uses nth-child when siblings share the same features', () => {
    document.body.innerHTML = '<ul><li>A</li><li>B</li><li>C</li></ul>'
    const items = document.querySelectorAll('li')
    const selector = getUniqueSelector(items[1]!) as string
    expect(selector).toContain('nth-child(2)')
    expect(document.querySelector(selector)).toBe(items[1])
  })

  it('does not use nth-child for only child of its type', () => {
    document.body.innerHTML = '<div><p>Only paragraph</p></div>'
    const el = document.querySelector('p')!
    const selector = getUniqueSelector(el) as string
    expect(selector).not.toContain('nth-child')
    expect(document.querySelector(selector)).toBe(el)
  })

  it('uses ancestor id when element selector alone is not unique', () => {
    document.body.innerHTML =
      '<div id="container"><section><p>text</p></section></div><div><section><p>other</p></section></div>'
    const el = document.querySelector('#container p')!
    const selector = getUniqueSelector(el) as string
    expect(selector).toContain('#container')
    expect(document.querySelector(selector)).toBe(el)
  })

  it('handles deeply nested elements', () => {
    document.body.innerHTML = '<div><div><div><div><span>deep</span></div></div></div></div>'
    const el = document.querySelector('span')!
    const selector = getUniqueSelector(el) as string
    expect(document.querySelector(selector)).toBe(el)
  })

  it('distinguishes between siblings of different types', () => {
    document.body.innerHTML = '<div><span>A</span><em>B</em></div>'
    const span = document.querySelector('span')!
    const em = document.querySelector('em')!
    const spanSelector = getUniqueSelector(span) as string
    const emSelector = getUniqueSelector(em) as string
    expect(spanSelector).not.toBe(emSelector)
    expect(document.querySelector(spanSelector)).toBe(span)
    expect(document.querySelector(emSelector)).toBe(em)
  })

  it('handles element directly on body', () => {
    document.body.innerHTML = '<main>content</main>'
    const el = document.querySelector('main')!
    const selector = getUniqueSelector(el) as string
    expect(document.querySelector(selector)).toBe(el)
  })

  it('generates unique selectors for multiple same-tag siblings', () => {
    document.body.innerHTML = '<div><p>1</p><p>2</p><p>3</p></div>'
    const paragraphs = document.querySelectorAll('p')
    for (let i = 0; i < paragraphs.length; i++) {
      const selector = getUniqueSelector(paragraphs[i]!) as string
      expect(document.querySelector(selector)).toBe(paragraphs[i])
    }
  })

  it('uses combined features for complex selectors', () => {
    document.body.innerHTML = `
      <div>
        <span class="foo" data-x="1">A</span>
        <span class="foo" data-x="2">B</span>
      </div>
    `
    const els = document.querySelectorAll('span')
    const selectorA = getUniqueSelector(els[0]!) as string
    const selectorB = getUniqueSelector(els[1]!) as string
    expect(document.querySelector(selectorA)).toBe(els[0])
    expect(document.querySelector(selectorB)).toBe(els[1])
  })

  it('escapes special characters in ids', () => {
    document.body.innerHTML = '<div id="my:special.id"></div>'
    const el = document.querySelector('[id="my:special.id"]')!
    const selector = getUniqueSelector(el) as string
    expect(document.querySelector(selector)).toBe(el)
  })
})
