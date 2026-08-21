// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { collectChildSections } from '../src/content/picker/collect'
import { resetHoverStylesCache } from '../src/content/picker/hover'

// Fills a same-origin iframe's inner document and returns the frame element, mimicking an
// about:blank ad slot populated at runtime.
function iframeWith(bodyHtml: string): HTMLIFrameElement {
  document.body.innerHTML = '<iframe></iframe>'
  const iframe = document.querySelector('iframe')!
  iframe.contentDocument!.body.innerHTML = bodyHtml
  return iframe
}

describe('collectChildSections on an iframe', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
    resetHoverStylesCache()
  })

  // Child scanning is a light-DOM walk; an <iframe> has no light-DOM children, so it always yields no
  // sections regardless of what the frame's own document contains.
  it('returns no sections for an iframe with interactive content', () => {
    const iframe = iframeWith('<div><button>Learn More</button><a href="/x">Visit site</a></div>')
    expect(collectChildSections(iframe)).toEqual({ sections: [], elements: [] })
  })

  it('returns no sections for an iframe with disabled controls', () => {
    const iframe = iframeWith('<button disabled>Buy now</button>')
    expect(collectChildSections(iframe)).toEqual({ sections: [], elements: [] })
  })

  it('returns no sections for an iframe containing a nested iframe', () => {
    const iframe = iframeWith('<button>Outer</button><iframe></iframe>')
    const nested = iframe.contentDocument!.querySelector('iframe')!
    nested.contentDocument!.body.innerHTML = '<button>Inner</button>'
    expect(collectChildSections(iframe)).toEqual({ sections: [], elements: [] })
  })

  it('returns no sections for an empty iframe', () => {
    const iframe = iframeWith('')
    expect(collectChildSections(iframe)).toEqual({ sections: [], elements: [] })
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
    const { sections } = collectChildSections(document.getElementById('host')!)
    expect(sections).toHaveLength(1)
    expect(sections[0]!.count).toBe(3)
  })

  // The "select child" buttons address a child by its index in the sections array, so the two arrays must line up.
  it('pairs every section with its source element, at the same index', () => {
    document.body.innerHTML = `<div id="host">
      <span role="img" aria-label="star">★</span>
      <span role="img" aria-label="star">★</span>
      <button>Buy now</button>
    </div>`
    const host = document.getElementById('host')!
    const { sections, elements } = collectChildSections(host)
    expect(sections).toHaveLength(2)
    // A merged ×N group resolves to its first occurrence — the one whose selector the section displays.
    expect(elements).toEqual([host.querySelector('[role="img"]'), host.querySelector('button')])
    expect(sections[0]!.count).toBe(2)
  })

  it('never pairs sections with elements from inside a same-origin iframe', () => {
    document.body.innerHTML = '<iframe></iframe>'
    const iframe = document.querySelector('iframe')!
    iframe.contentDocument!.body.innerHTML = '<button>Learn More</button><a href="/x">Site</a>'
    expect(collectChildSections(iframe)).toEqual({ sections: [], elements: [] })
  })
})
