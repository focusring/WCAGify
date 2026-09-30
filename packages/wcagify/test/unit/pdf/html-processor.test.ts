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

  it('removes print:hidden buttons and the empty status spans beside them', async () => {
    const html =
      '<html><head></head><body><div class="relative group">' +
      '<span role="status" class="sr-only print:hidden"></span>' +
      '<button type="button" aria-label="Copy code" class="absolute print:hidden"><span class="iconify"></span></button>' +
      '<pre><code>x</code></pre></div></body></html>'
    vi.mocked(fetch).mockResolvedValue(new Response(''))
    const result = await prepareForPdf(html, 'http://localhost:3000')
    expect(result).not.toContain('Copy code')
    expect(result).not.toContain('role="status"')
    expect(result).toContain('<pre><code>x</code></pre>')
  })

  it('drops visually hidden text from links that have visible text', async () => {
    const html =
      '<html><head></head><body><a href="https://example.com/">https://example.com/ ' +
      '<span class="sr-only">(Home, opens in a new tab)</span>' +
      '<span class="iconify" aria-hidden="true"></span></a></body></html>'
    vi.mocked(fetch).mockResolvedValue(new Response(''))
    const result = await prepareForPdf(html, 'http://localhost:3000')
    expect(result).toContain('<a href="https://example.com/">https://example.com/ </a>')
    expect(result).not.toContain('opens in a new tab')
  })

  it('keeps visually hidden text that is the only text of a link', async () => {
    const html =
      '<html><head></head><body><a href="/next"><span class="sr-only">Next page</span></a></body></html>'
    vi.mocked(fetch).mockResolvedValue(new Response(''))
    const result = await prepareForPdf(html, 'http://localhost:3000')
    expect(result).toContain('<a href="/next">Next page</a>')
  })

  it('opens issues and turns their toggle button into a header', async () => {
    const html =
      '<html><head></head><body>' +
      '<article data-state="closed" id="issue-a"><!--[-->' +
      '<button type="button" aria-controls="issue-a-content" aria-expanded="false" class="flex w-full">' +
      '<h5>1. Title</h5><span data-slot="base">Home</span></button>' +
      '<div data-slot="content" hidden><p>Body</p><button type="button">Other</button></div>' +
      '</article></body></html>'
    vi.mocked(fetch).mockResolvedValue(new Response(''))
    const result = await prepareForPdf(html, 'http://localhost:3000')
    expect(result).toContain(
      '<!--[--><div data-issue-header class="flex w-full"><h5>1. Title</h5><span data-slot="base">Home</span></div>'
    )
    expect(result).toContain('<article data-state="open" id="issue-a">')
    expect(result).toContain(
      '<div data-slot="content"><p>Body</p><button type="button">Other</button>'
    )
  })
})
