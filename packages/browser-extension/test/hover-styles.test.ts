// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { hasHoverStyles, resetHoverStylesCache, resolveNested } from '../src/content/picker/hover'

describe('hasHoverStyles', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
    // Drops a stubStyleSheets() shadow left by a previous test, putting the real parser back in play.
    delete (document as unknown as Partial<Record<'styleSheets', unknown>>).styleSheets
    resetHoverStylesCache()
  })

  it('flags an element targeted by a direct :hover rule', () => {
    document.head.innerHTML = '<style>.btn:hover { color: red }</style>'
    document.body.innerHTML = '<button class="btn">Go</button><button class="other">No</button>'
    expect(hasHoverStyles(document.querySelector('.btn')!)).toBe(true)
    expect(hasHoverStyles(document.querySelector('.other')!)).toBe(false)
  })

  it('flags a descendant styled via an ancestor :hover (`.card:hover .btn`)', () => {
    document.head.innerHTML = '<style>.card:hover .btn { border-color: blue }</style>'
    document.body.innerHTML = '<div class="card"><button class="btn">Go</button></div>'
    expect(hasHoverStyles(document.querySelector('.btn')!)).toBe(true)
  })

  it('finds :hover rules nested in @media blocks', () => {
    document.head.innerHTML = '<style>@media (min-width: 1px) { .btn:hover { color: red } }</style>'
    document.body.innerHTML = '<button class="btn">Go</button>'
    expect(hasHoverStyles(document.querySelector('.btn')!)).toBe(true)
  })

  it('only flags the :hover parts of a selector list', () => {
    document.head.innerHTML = '<style>.plain, .fancy:hover { color: red }</style>'
    document.body.innerHTML = '<a class="plain">a</a><a class="fancy">b</a>'
    expect(hasHoverStyles(document.querySelector('.plain')!)).toBe(false)
    expect(hasHoverStyles(document.querySelector('.fancy')!)).toBe(true)
  })

  it('does not mistake an escaped Tailwind class name (`.hover\\:underline`) for a hover rule', () => {
    document.head.innerHTML = '<style>.hover\\:underline { text-decoration: underline }</style>'
    document.body.innerHTML = '<a class="hover:underline">t</a>'
    expect(hasHoverStyles(document.querySelector('a')!)).toBe(false)
  })

  it('checks iframe children against the iframe document’s own stylesheets', () => {
    document.body.innerHTML = '<iframe></iframe>'
    const doc = document.querySelector('iframe')!.contentDocument!
    doc.head.innerHTML = '<style>.cta:hover { background: navy }</style>'
    doc.body.innerHTML = '<button class="cta">Learn More</button><button class="mute">x</button>'
    expect(hasHoverStyles(doc.querySelector('.cta')!)).toBe(true)
    expect(hasHoverStyles(doc.querySelector('.mute')!)).toBe(false)
  })

  it('sees styles injected after a cache reset, but not before', () => {
    document.body.innerHTML = '<button class="btn">Go</button>'
    const btn = document.querySelector('.btn')!
    expect(hasHoverStyles(btn)).toBe(false) // builds and caches the (empty) set
    document.head.innerHTML = '<style>.btn:hover { color: red }</style>'
    expect(hasHoverStyles(btn)).toBe(false) // cached
    resetHoverStylesCache()
    expect(hasHoverStyles(btn)).toBe(true)
  })

  // happy-dom's CSS parser drops nested rules (`.a { &:hover {…} }` comes back empty), so nesting is tested
  // with hand-built rules. collectHoverTargets duck-types its input, so these stand in for real CSSOM rules.
  interface FakeRule {
    selectorText?: string
    cssRules?: FakeRule[]
  }
  function stubStyleSheets(...rules: FakeRule[]): void {
    Object.defineProperty(document, 'styleSheets', {
      value: [{ cssRules: rules }],
      configurable: true
    })
    resetHoverStylesCache()
  }

  it('finds a :hover rule nested inside a style rule (Tailwind v4 `&:hover`)', () => {
    document.body.innerHTML = '<a class="hover:underline">t</a><a class="plain">p</a>'
    stubStyleSheets({
      selectorText: '.hover\\:underline',
      cssRules: [{ selectorText: '&:hover' }]
    })
    expect(hasHoverStyles(document.querySelector('.hover\\:underline')!)).toBe(true)
    expect(hasHoverStyles(document.querySelector('.plain')!)).toBe(false)
  })

  it('scopes a nested selector to the rule it sits in', () => {
    document.body.innerHTML =
      '<div class="card"><button class="btn">in</button></div><button class="btn out">out</button>'
    stubStyleSheets({ selectorText: '.card', cssRules: [{ selectorText: '.btn:hover' }] })
    expect(hasHoverStyles(document.querySelector('.card .btn')!)).toBe(true)
    expect(hasHoverStyles(document.querySelector('.btn.out')!)).toBe(false)
  })

  it('scopes every part of a nested selector list, not just the first', () => {
    document.body.innerHTML =
      '<div class="card"><i class="a"></i><i class="b"></i></div><i class="b out"></i>'
    stubStyleSheets({ selectorText: '.card', cssRules: [{ selectorText: '.a, .b:hover' }] })
    expect(hasHoverStyles(document.querySelector('.card .b')!)).toBe(true)
    expect(hasHoverStyles(document.querySelector('.b.out')!)).toBe(false)
  })

  it('carries the parent selector through a grouping rule nested in a style rule', () => {
    document.body.innerHTML = '<button class="btn">Go</button>'
    // `.btn { @media … { &:hover {…} } }` — the @media has no selector of its own to resolve against.
    stubStyleSheets({
      selectorText: '.btn',
      cssRules: [{ cssRules: [{ selectorText: '&:hover' }] }]
    })
    expect(hasHoverStyles(document.querySelector('.btn')!)).toBe(true)
  })
})

// Asserts the resolved string directly: happy-dom mis-evaluates a combinator inside :is() (`:is(.a .b)` matches `.a`),
// so match-based tests can't cover deeper nesting. Matching is the engine's job; the string is ours.
describe('resolveNested', () => {
  it('leaves a top-level selector alone', () => {
    expect(resolveNested('.btn:hover', '')).toBe('.btn:hover')
  })

  it('substitutes & with the parent, wrapped so a parent list stays one compound', () => {
    expect(resolveNested('&:hover', '.btn')).toBe(':is(.btn):hover')
    expect(resolveNested('&:hover', '.a, .b')).toBe(':is(.a, .b):hover')
  })

  it('treats a selector without & as a descendant of the parent', () => {
    expect(resolveNested('.btn:hover', '.card')).toBe(':is(.card) .btn:hover')
  })

  it('keeps a leading combinator intact', () => {
    expect(resolveNested('> .btn:hover', '.card')).toBe(':is(.card) > .btn:hover')
    expect(resolveNested('+ .btn:hover', '.card')).toBe(':is(.card) + .btn:hover')
  })

  it('resolves each part of a nested list against the parent', () => {
    expect(resolveNested('.a, .b:hover', '.card')).toBe(':is(.card) .a, :is(.card) .b:hover')
  })

  it('replaces every & in a part', () => {
    expect(resolveNested('& + &:hover', '.row')).toBe(':is(.row) + :is(.row):hover')
  })

  it('composes through three levels, as visit() applies it per level', () => {
    const level2 = resolveNested('.b', '.a')
    expect(level2).toBe(':is(.a) .b')
    expect(resolveNested('&:hover', level2)).toBe(':is(:is(.a) .b):hover')
  })
})
