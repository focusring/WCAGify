import { describe, it, expect, vi, beforeEach } from 'vitest'
import { stripCssLayers, forceLightMode, prepareForPdf } from '../../../src/pdf/html-processor'

describe('stripCssLayers', () => {
  it('unwraps a single @layer block', () => {
    const css = '@layer base { body { color: red; } }'
    expect(stripCssLayers(css)).toContain('body { color: red; }')
    expect(stripCssLayers(css)).not.toContain('@layer')
  })

  it('removes @layer declaration statements', () => {
    const css = '@layer base, utilities; body { color: red; }'
    const result = stripCssLayers(css)
    expect(result).not.toContain('@layer')
    expect(result).toContain('body { color: red; }')
  })

  it('keeps non-layer CSS untouched', () => {
    const css = 'body { margin: 0; } h1 { font-size: 2em; }'
    expect(stripCssLayers(css)).toBe(css)
  })

  it('handles nested braces within layers', () => {
    const css = '@layer base { @media (min-width: 768px) { body { color: blue; } } }'
    const result = stripCssLayers(css)
    expect(result).toContain('@media')
    expect(result).toContain('body { color: blue; }')
    expect(result).not.toContain('@layer')
  })

  it('handles empty input', () => {
    expect(stripCssLayers('')).toBe('')
  })

  it('handles multiple layers', () => {
    const css = '@layer a { .a {} } @layer b { .b {} }'
    const result = stripCssLayers(css)
    expect(result).toContain('.a {}')
    expect(result).toContain('.b {}')
    expect(result).not.toContain('@layer')
  })
})

describe('forceLightMode', () => {
  it('removes dark class from html element', () => {
    const html = '<html class="dark" lang="en">'
    const result = forceLightMode(html)
    expect(result).not.toContain('class="dark"')
  })

  it('removes dark from a class list', () => {
    const html = '<html class="dark other-class" lang="en">'
    const result = forceLightMode(html)
    expect(result).toContain('other-class')
    expect(result).not.toMatch(/\bdark\b/)
  })

  it('forces light color scheme in style', () => {
    const html = '<html style="color-scheme: dark;" lang="en">'
    const result = forceLightMode(html)
    expect(result).toContain('color-scheme: light')
    expect(result).not.toContain('color-scheme: dark')
  })

  it('preserves other styles alongside color-scheme', () => {
    const html = '<html style="color-scheme: dark; font-size: 16px;" lang="en">'
    const result = forceLightMode(html)
    expect(result).toContain('font-size: 16px')
    expect(result).toContain('color-scheme: light')
  })

  it('returns unchanged html without dark mode', () => {
    const html = '<html class="light" lang="en"><body></body></html>'
    const result = forceLightMode(html)
    expect(result).toContain('class="light"')
  })
})

describe('prepareForPdf', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('removes script tags', async () => {
    const html =
      '<html><head></head><body><script>alert("xss")</script><p>content</p></body></html>'
    vi.mocked(fetch).mockResolvedValue(new Response(''))
    const result = await prepareForPdf(html, 'http://localhost:3000')
    expect(result).not.toContain('<script>')
    expect(result).toContain('<p>content</p>')
  })

  it('removes preload links', async () => {
    const html = '<html><head><link rel="modulepreload" href="/foo.js"></head><body></body></html>'
    vi.mocked(fetch).mockResolvedValue(new Response(''))
    const result = await prepareForPdf(html, 'http://localhost:3000')
    expect(result).not.toContain('modulepreload')
  })

  it('inlines stylesheet CSS', async () => {
    const html = '<html><head><link rel="stylesheet" href="/style.css"></head><body></body></html>'
    vi.mocked(fetch).mockResolvedValue(new Response('body { color: red; }'))
    const result = await prepareForPdf(html, 'http://localhost:3000')
    expect(result).toContain('<style>body { color: red; }</style>')
    expect(result).not.toContain('<link rel="stylesheet"')
  })

  it('injects PDF override styles', async () => {
    const html = '<html><head></head><body></body></html>'
    vi.mocked(fetch).mockResolvedValue(new Response(''))
    const result = await prepareForPdf(html, 'http://localhost:3000')
    expect(result).toContain('color-scheme: light !important')
  })

  it('strips CSS layers from inlined stylesheets', async () => {
    const html = '<html><head><link rel="stylesheet" href="/style.css"></head><body></body></html>'
    vi.mocked(fetch).mockResolvedValue(new Response('@layer base { body { color: red; } }'))
    const result = await prepareForPdf(html, 'http://localhost:3000')
    expect(result).toContain('body { color: red; }')
    expect(result).not.toContain('@layer')
  })

  it('skips failed CSS fetches', async () => {
    const html = '<html><head><link rel="stylesheet" href="/style.css"></head><body></body></html>'
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 404 } as Response)
    const result = await prepareForPdf(html, 'http://localhost:3000')
    expect(result).toContain('<link rel="stylesheet"')
  })

  it('removes print:hidden divs', async () => {
    const html =
      '<html><head></head><body><div class="print:hidden">hidden</div><p>visible</p></body></html>'
    vi.mocked(fetch).mockResolvedValue(new Response(''))
    const result = await prepareForPdf(html, 'http://localhost:3000')
    expect(result).not.toContain('print:hidden')
    expect(result).toContain('<p>visible</p>')
  })

  // flattenLinks: strips decorative icon spans and unwraps label spans inside <a>, so the PDF
  // /Link struct binds directly to the text instead of a nested /Span (PDF/UA-1 28-003).
  describe('flattenLinks', () => {
    it('drops an aria-hidden icon span and unwraps a label span', async () => {
      const html =
        '<html><head></head><body><a href="/x"><span data-slot="label">Visit site</span><span aria-hidden="true"><svg></svg></span></a></body></html>'
      vi.mocked(fetch).mockResolvedValue(new Response(''))
      const result = await prepareForPdf(html, 'http://localhost:3000')
      expect(result).toContain('<a href="/x">Visit site</a>')
      expect(result).not.toContain('aria-hidden')
      expect(result).not.toContain('<span')
    })

    it('fully unwraps doubly-nested label spans', async () => {
      const html =
        '<html><head></head><body><a href="/x"><span><span>Nested</span> text</span></a></body></html>'
      vi.mocked(fetch).mockResolvedValue(new Response(''))
      const result = await prepareForPdf(html, 'http://localhost:3000')
      expect(result).toContain('<a href="/x">Nested text</a>')
      expect(result).not.toContain('<span')
    })

    it('leaves link attributes untouched', async () => {
      const html =
        '<html><head></head><body><a href="/x" target="_blank" rel="noopener">Plain</a></body></html>'
      vi.mocked(fetch).mockResolvedValue(new Response(''))
      const result = await prepareForPdf(html, 'http://localhost:3000')
      expect(result).toContain('<a href="/x" target="_blank" rel="noopener">Plain</a>')
    })
  })

  // expandIssueCollapsibles: forces collapsed issue <article>s open so their content is present
  // (not display:none) when WeasyPrint paginates the PDF, scoped to id="issue-*" articles only.
  describe('expandIssueCollapsibles', () => {
    it('opens a closed issue article and un-hides its content panel', async () => {
      const html =
        '<html><head></head><body><article id="issue-1" data-state="closed" aria-expanded="false"><div data-slot="content" hidden>Details</div></article></body></html>'
      vi.mocked(fetch).mockResolvedValue(new Response(''))
      const result = await prepareForPdf(html, 'http://localhost:3000')
      expect(result).toContain('id="issue-1" data-state="open" aria-expanded="true"')
      expect(result).toContain('<div data-slot="content">Details</div>')
    })

    it('leaves non-issue articles untouched', async () => {
      const html =
        '<html><head></head><body><article data-state="closed">Unrelated</article></body></html>'
      vi.mocked(fetch).mockResolvedValue(new Response(''))
      const result = await prepareForPdf(html, 'http://localhost:3000')
      expect(result).toContain('<article data-state="closed">Unrelated</article>')
    })
  })

  // flattenDefinitionLists: rewrites <dl> so <dt>/<dd> are direct children (WeasyPrint otherwise
  // emits an invalid /Div under /L per PDF/UA-1), wrapping any stray inline content after a <dt>.
  describe('flattenDefinitionLists', () => {
    it('unwraps grid-layout divs around dt/dd pairs', async () => {
      const html =
        '<html><head></head><body><dl><div><dt>Severity</dt><dd>High</dd></div><div><dt>Type</dt><dd>Technical</dd></div></dl></body></html>'
      vi.mocked(fetch).mockResolvedValue(new Response(''))
      const result = await prepareForPdf(html, 'http://localhost:3000')
      expect(result).toContain(
        '<dl><dt>Severity</dt><dd>High</dd><dt>Type</dt><dd>Technical</dd></dl>'
      )
    })

    it('fully unwraps doubly-nested divs', async () => {
      const html =
        '<html><head></head><body><dl><div><div><dt>A</dt><dd>B</dd></div></div></dl></body></html>'
      vi.mocked(fetch).mockResolvedValue(new Response(''))
      const result = await prepareForPdf(html, 'http://localhost:3000')
      expect(result).toContain('<dl><dt>A</dt><dd>B</dd></dl>')
    })

    it('wraps stray content after a dt (badge/link) in a dd instead of leaving it a bare dl child', async () => {
      const html =
        '<html><head></head><body><dl><dt>Status</dt><a href="/x">Link</a></dl></body></html>'
      vi.mocked(fetch).mockResolvedValue(new Response(''))
      const result = await prepareForPdf(html, 'http://localhost:3000')
      expect(result).toMatch(/<dt>Status<\/dt><dd>[^]*<a href="\/x">Link<\/a>[^]*<\/dd>/)
    })
  })

  // inlinePropertyDefaults: WeasyPrint can't resolve var(--tw-border-spacing-x) against an unset
  // @property, so its initial-value is promoted to :root and the border-spacing-* rule is dropped.
  describe('inlinePropertyDefaults', () => {
    it('promotes @property initial-value to :root and drops the border-spacing rule', async () => {
      const html =
        '<html><head><link rel="stylesheet" href="/style.css"></head><body></body></html>'
      const css = `@property --tw-border-spacing-x {
  syntax: '<length>';
  inherits: false;
  initial-value: 0;
}
.border-spacing-4 {
  border-spacing: var(--tw-border-spacing-x) var(--tw-border-spacing-y);
}
table { width: 100%; }`
      vi.mocked(fetch).mockResolvedValue(new Response(css))
      const result = await prepareForPdf(html, 'http://localhost:3000')
      expect(result).toContain(':root { --tw-border-spacing-x: 0; }')
      expect(result).not.toContain('@property')
      expect(result).not.toContain('.border-spacing-4')
      expect(result).toContain('table { width: 100%; }')
    })
  })
})
