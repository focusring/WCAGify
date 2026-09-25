import { describe, it, expect } from 'vitest'
import remarkCodeLang, { guessCodeLanguage } from '../../src/remark-code-lang'

describe('guessCodeLanguage', () => {
  it('detects HTML fragments', () => {
    expect(guessCodeLanguage('<button aria-label="Sluiten">×</button>')).toBe('html')
    expect(
      guessCodeLanguage('<div class="link" onClick="navigateCallToAction()">Get a Quote!</div>')
    ).toBe('html')
    expect(guessCodeLanguage('<!-- decorative -->\n<img src="a.png" alt="">')).toBe('html')
    expect(guessCodeLanguage('Some intro text </span>')).toBe('html')
  })

  it('detects CSS rules and lone declarations', () => {
    expect(
      guessCodeLanguage(
        'input[type=range]::-webkit-slider-thumb { border: 2px solid #00716b; }\ninput[type=range]::-moz-range-thumb     { border: 2px solid #00716b; }'
      )
    ).toBe('css')
    expect(guessCodeLanguage('@media print {\n  .copy-code-button { display: none; }\n}')).toBe(
      'css'
    )
    expect(guessCodeLanguage('html { scroll-padding-top: calc(4rem + 1rem); }')).toBe('css')
    expect(guessCodeLanguage('outline: 2px solid currentColor;')).toBe('css')
    expect(guessCodeLanguage('@media (max-width: 767px) { body { padding-bottom: 104px; } }')).toBe(
      'css'
    )
    expect(
      guessCodeLanguage('@media (prefers-reduced-motion: reduce) { /* start paused */ }')
    ).toBe('css')
  })

  it('detects JavaScript', () => {
    expect(
      guessCodeLanguage("document.querySelector('#menu').addEventListener('click', open)")
    ).toBe('javascript')
    expect(guessCodeLanguage('const open = () => {\n  dialog.showModal()\n}')).toBe('javascript')
    expect(guessCodeLanguage("if (value == null) input.removeAttribute('aria-valuenow')")).toBe(
      'javascript'
    )
    expect(
      guessCodeLanguage('// delete the keydown handler that calls preventDefault() on Tab')
    ).toBe('javascript')
  })

  it('detects JSON', () => {
    expect(guessCodeLanguage('{ "name": "wcagify", "version": 1 }')).toBe('json')
  })

  it('leaves prose and unknown text alone', () => {
    expect(guessCodeLanguage('Passed: 15, switch, on')).toBeUndefined()
    expect(guessCodeLanguage('Alleen/samen: prefilled from step 1')).toBeUndefined()
    expect(guessCodeLanguage('button "Language English"\nlistbox "Language"')).toBeUndefined()
    expect(guessCodeLanguage('')).toBeUndefined()
  })
})

describe('remarkCodeLang', () => {
  it('sets lang only on unlabelled code nodes', () => {
    const tree = {
      type: 'root',
      children: [
        { type: 'code', lang: null, value: '<p>Hi</p>' },
        { type: 'code', lang: 'text', value: '<p>Hi</p>' },
        { type: 'code', lang: 'vue', value: '<p>Hi</p>' },
        { type: 'code', value: 'Passed: 15, switch, on' },
        { type: 'paragraph', children: [{ type: 'text', value: '<p>' }] }
      ]
    }
    remarkCodeLang()(tree)
    expect(tree.children.map((n) => n.lang)).toEqual(['html', 'text', 'vue', undefined, undefined])
  })
})
