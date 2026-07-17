// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { hasHoverStyles, resetHoverStylesCache } from '../src/content/picker/hover'

describe('hasHoverStyles', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
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
})
