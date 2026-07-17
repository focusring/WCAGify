// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { collectChildSections } from '../src/content/picker/collect'
import { resetHoverStylesCache } from '../src/content/picker/hover'

// Fills a same-origin iframe's inner document and returns the frame element, mimicking an
// about:blank ad slot populated at runtime.
function iframeWith(bodyHtml: string, headHtml = ''): HTMLIFrameElement {
  document.body.innerHTML = '<iframe></iframe>'
  const iframe = document.querySelector('iframe')!
  iframe.contentDocument!.head.innerHTML = headHtml
  iframe.contentDocument!.body.innerHTML = bodyHtml
  return iframe
}

describe('collectChildSections on an iframe', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
    resetHoverStylesCache()
  })

  it('surfaces interactive elements found inside a same-origin iframe', () => {
    const iframe = iframeWith('<div><button>Learn More</button><a href="/x">Visit site</a></div>')
    const sections = collectChildSections(iframe)
    expect(sections.map((s) => s.role)).toEqual(['button', 'link'])
    expect(sections[0]!.label).toBe('Learn More')
    expect(sections[1]!.label).toBe('Visit site')
  })

  it('merges identical children into one section with a count', () => {
    const iframe = iframeWith(
      '<button class="dot">•</button><button class="dot">•</button><button class="dot">•</button><a href="/x">Site</a>'
    )
    const sections = collectChildSections(iframe)
    expect(sections).toHaveLength(2)
    expect(sections[0]!.role).toBe('button')
    expect(sections[0]!.count).toBe(3)
    expect(sections[1]!.role).toBe('link')
    expect(sections[1]!.count).toBeUndefined()
  })

  it('keeps children with different labels separate even when styled identically', () => {
    const iframe = iframeWith('<button>Learn More</button><button>Sign Up</button>')
    const sections = collectChildSections(iframe)
    expect(sections).toHaveLength(2)
    expect(sections.map((s) => s.label)).toEqual(['Learn More', 'Sign Up'])
  })

  it('scans one level deep only: content of a nested iframe is not surfaced', () => {
    const iframe = iframeWith('<button>Outer</button><iframe></iframe>')
    const nested = iframe.contentDocument!.querySelector('iframe')!
    nested.contentDocument!.body.innerHTML = '<button>Inner</button>'
    const sections = collectChildSections(iframe)
    expect(sections.map((s) => s.label)).toEqual(['Outer'])
  })

  it('surfaces disabled controls inside the iframe with their disabled flag', () => {
    const iframe = iframeWith('<button disabled>Buy now</button>')
    const sections = collectChildSections(iframe)
    expect(sections).toHaveLength(1)
    expect(sections[0]!.disabled).toBe(true)
  })

  it('flags iframe children that have :hover rules in the inner document', () => {
    const iframe = iframeWith(
      '<button class="cta">Learn More</button><button class="mute">x</button>',
      '<style>.cta:hover { background: navy }</style>'
    )
    const sections = collectChildSections(iframe)
    expect(sections.map((s) => [s.label, s.hasHoverStyles])).toEqual([
      ['Learn More', true],
      ['x', false]
    ])
  })

  it('returns no sections for an empty iframe', () => {
    const iframe = iframeWith('')
    expect(collectChildSections(iframe)).toEqual([])
  })
})

describe('collectChildSections dedup on regular elements', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
    resetHoverStylesCache()
  })

  it('merges identical star icons into one ×N section', () => {
    document.body.innerHTML = `<div id="host">
      <span role="img" aria-label="star">★</span>
      <span role="img" aria-label="star">★</span>
      <span role="img" aria-label="star">★</span>
    </div>`
    const sections = collectChildSections(document.getElementById('host')!)
    expect(sections).toHaveLength(1)
    expect(sections[0]!.count).toBe(3)
  })
})
