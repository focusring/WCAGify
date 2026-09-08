import { describe, it, expect } from 'vitest'
import { minimarkToText } from '../../../src/earl/minimark'

describe('minimarkToText', () => {
  it('returns an empty string for missing bodies', () => {
    expect(minimarkToText(undefined)).toBe('')
    expect(minimarkToText(null)).toBe('')
    expect(minimarkToText({ type: 'minimark', value: [] })).toBe('')
  })

  it('trims a plain string body', () => {
    expect(minimarkToText('  hello \n')).toBe('hello')
  })

  it('renders paragraphs, headings and inline code', () => {
    const text = minimarkToText({
      type: 'minimark',
      value: [
        ['p', {}, 'The form is not reachable.'],
        ['h4', { id: 'recommendation' }, 'Recommendation'],
        ['p', {}, 'Use a standard ', ['code', {}, '<select>'], ' element.']
      ]
    })
    expect(text).toBe(
      'The form is not reachable.\n\n#### Recommendation\n\nUse a standard `<select>` element.'
    )
  })

  it('renders lists with nesting and ordered markers', () => {
    const text = minimarkToText({
      value: [
        ['ul', {}, ['li', {}, 'First'], ['li', {}, 'Second', ['ol', {}, ['li', {}, 'Nested']]]]
      ]
    })
    expect(text).toBe('- First\n- Second\n  1. Nested')
  })

  it('renders links, emphasis, images and line breaks', () => {
    const text = minimarkToText({
      value: [
        [
          'p',
          {},
          ['a', { href: 'https://example.com' }, 'Example'],
          ' ',
          ['strong', {}, 'bold'],
          ['br', {}],
          ['em', {}, 'italic'],
          ' ',
          ['img', { src: '/a.png', alt: 'Screenshot' }]
        ]
      ]
    })
    expect(text).toBe('Example (https://example.com) **bold**\n_italic_ [Screenshot](/a.png)')
  })

  it('renders tables, blockquotes and code blocks', () => {
    const text = minimarkToText({
      value: [
        [
          'table',
          {},
          ['thead', {}, ['tr', {}, ['th', {}, 'A'], ['th', {}, 'B']]],
          ['tbody', {}, ['tr', {}, ['td', {}, '1'], ['td', {}, '2']]]
        ],
        ['blockquote', {}, ['p', {}, 'Quoted']],
        ['pre', {}, ['code', {}, 'const x = 1']]
      ]
    })
    expect(text).toBe('| A | B |\n| 1 | 2 |\n\n> Quoted\n\n```\nconst x = 1\n```')
  })
})
