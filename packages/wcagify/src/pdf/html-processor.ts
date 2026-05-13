const STYLESHEET_RE = /<link\s+[^>]*rel=["']stylesheet["'][^>]*>/gi
const HREF_RE = /href=["']([^"']+)["']/i
const SCRIPT_RE = /<script\b[^>]*>[\s\S]*?<\/script>/gi
const PRELOAD_RE = /<link\s+[^>]*rel=["'](?:modulepreload|preload)["'][^>]*>/gi
const PRINT_HIDDEN_RE = /<div[^>]*class="[^"]*print:hidden[^"]*"[^>]*>[\s\S]*?<\/div>/gi
const APP_SEPARATOR_RE = /<\/main>\s*<div[^>]*role="separator"[^>]*>[\s\S]*?<\/div>/gi
const TABLE_SEPARATOR_TR_RE = /<tr\s+data-slot="separator"[^>]*>[\s\S]*?<\/tr>/gi
const ISSUE_ARTICLE_RE = /<article[^>]*\sid="issue-[^"]*"[^>]*>[\s\S]*?<\/article>/g
const HIDDEN_ATTR_ON_CONTENT_RE = /(<div[^>]*data-slot="content"[^>]*?)\shidden(?=[\s/>])/g

/**
 * Strip wrapper `<span>`s inside `<a>` tags so the link annotation
 * binds directly to the /Link struct elem rather than to an inner
 * /Span (PDF/UA-1 28-003). Nuxt UI renders link buttons with nested
 * `<span data-slot="label">` and decorative icons; flattening the link
 * content to plain text gives WeasyPrint a clean /Link > text mapping.
 * Decorative `aria-hidden` icons are dropped, label text is preserved.
 */
function flattenLinks(html: string): string {
  return html.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/g, (_match, attrs: string, body: string) => {
    let stripped = body
    stripped = stripped.replace(/<!--[\s\S]*?-->/g, '')
    stripped = stripped.replace(/<span\b[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/span>/g, '')
    let prev: string
    do {
      prev = stripped
      stripped = stripped.replace(/<span\b[^>]*>([\s\S]*?)<\/span>/g, '$1')
    } while (stripped !== prev)
    return `<a${attrs}>${stripped}</a>`
  })
}

function expandIssueCollapsibles(html: string): string {
  return html.replace(ISSUE_ARTICLE_RE, (match) =>
    match
      .replace(/data-state="closed"/g, 'data-state="open"')
      .replace(/aria-expanded="false"/g, 'aria-expanded="true"')
      .replace(HIDDEN_ATTR_ON_CONTENT_RE, '$1')
  )
}

/**
 * Flatten `<dl>` structure for PDF/UA tagging.
 * The Vue templates wrap each term/value pair in a `<div>` for screen
 * grid layout, which makes WeasyPrint emit `/L > /Div > /LI` — invalid
 * per PDF/UA-1 (only LI/Caption are allowed under L). We rewrite each
 * `<dl>` so its direct children are only `<dt>`/`<dd>`, and any other
 * inline content following a `<dt>` (badge spans, links, etc.) is
 * wrapped in a `<dd>`.
 */
function flattenDefinitionLists(html: string): string {
  return html.replace(/<dl\b([^>]*)>([\s\S]*?)<\/dl>/g, (_, attrs: string, body: string) => {
    let prev: string
    do {
      prev = body
      body = body.replace(/<div\b[^>]*>([\s\S]*?)<\/div>/g, (m, inner: string) =>
        /<dt\b|<dd\b/.test(inner) ? inner : m
      )
    } while (body !== prev)

    const tokens: { type: 'dt' | 'dd' | 'content'; html: string }[] = []
    let i = 0
    while (i < body.length) {
      const remaining = body.slice(i)
      const dt = remaining.match(/^<dt\b[^>]*>[\s\S]*?<\/dt>/)
      if (dt) {
        tokens.push({ type: 'dt', html: dt[0] })
        i += dt[0].length
        continue
      }
      const dd = remaining.match(/^<dd\b[^>]*>[\s\S]*?<\/dd>/)
      if (dd) {
        tokens.push({ type: 'dd', html: dd[0] })
        i += dd[0].length
        continue
      }
      const other = remaining.match(
        /^(?:<!--[\s\S]*?-->|\s+|<[a-z][a-z0-9]*\b[^>]*\/>|<([a-z][a-z0-9]*)\b[^>]*>[\s\S]*?<\/\1>)/i
      )
      if (other) {
        tokens.push({ type: 'content', html: other[0] })
        i += other[0].length
        continue
      }
      i++
    }

    const out: string[] = []
    let pending: string[] = []
    let afterDt = false
    const flush = () => {
      if (pending.length) {
        out.push(`<dd>${pending.join('')}</dd>`)
        pending = []
      }
    }
    for (const t of tokens) {
      if (t.type === 'dt') {
        flush()
        out.push(t.html)
        afterDt = true
      } else if (t.type === 'dd') {
        flush()
        out.push(t.html)
        afterDt = false
      } else if (afterDt) {
        pending.push(t.html)
      }
    }
    flush()
    return `<dl${attrs}>${out.join('')}</dl>`
  })
}

/**
 * WeasyPrint doesn't honor `@property` initial-value when the variable is
 * unset, so `var(--tw-border-spacing-x)` resolves to an unresolved FunctionBlock
 * and crashes table layout in tagged-PDF mode. Promote each @property's
 * initial-value to a regular `:root` custom property declaration. Also drop
 * `.border-spacing-*` rules since they wrap `border-spacing` in `var()`s that
 * WeasyPrint still can't resolve at table-layout time when tagging is on.
 */
function inlinePropertyDefaults(css: string): string {
  const PROPERTY_RE = /@property\s+(--[\w-]+)\s*\{([^}]*)\}/g
  const BORDER_SPACING_RULE_RE = /\.border-spacing-[\w\\-]*\s*\{[^}]*\}/g
  const defaults: string[] = []
  let stripped = css.replace(PROPERTY_RE, (_match, name: string, body: string) => {
    const m = body.match(/initial-value\s*:\s*([^;]+?)\s*(?:;|$)/)
    if (m?.[1]) defaults.push(`${name}: ${m[1]};`)
    return ''
  })
  stripped = stripped.replace(BORDER_SPACING_RULE_RE, '')
  if (defaults.length === 0) return stripped
  return `:root { ${defaults.join(' ')} }\n${stripped}`
}

function stripCssLayers(css: string): string {
  let result = ''
  let i = 0

  while (i < css.length) {
    if (css.startsWith('@layer', i)) {
      let j = i + 6
      while (j < css.length && css[j] !== '{' && css[j] !== ';') j++

      if (css[j] === ';') {
        i = j + 1
        continue
      }

      i = j + 1
      let depth = 1
      const contentStart = i
      while (i < css.length && depth > 0) {
        if (css[i] === '{') depth++
        else if (css[i] === '}') depth--
        if (depth > 0) i++
      }
      result += css.slice(contentStart, i)
      i++
    } else {
      result += css[i]
      i++
    }
  }

  return result
}

function forceLightMode(html: string): string {
  let result = html

  result = result.replace(
    /<html([^>]*)class="([^"]*)"/,
    (_match, before: string, classes: string) => {
      const cleaned = classes.replace(/\bdark\b/g, '').trim()
      return `<html${before}class="${cleaned}"`
    }
  )

  result = result.replace(
    /<html([^>]*)style="([^"]*)"/,
    (_match, before: string, style: string) => {
      const cleaned = style.replace(/color-scheme:\s*dark\s*;?/g, '').trim()
      return `<html${before}style="color-scheme: light; ${cleaned}"`
    }
  )

  return result
}

const PDF_OVERRIDES = `<style>
  :root { color-scheme: light !important; }
  [data-color-mode="dark"] { color-scheme: light !important; }

  html, html:not(.css-ready) { visibility: visible !important; }

  [data-slot="content"] {
    display: block !important;
    height: auto !important;
    overflow: visible !important;
    animation: none !important;
  }

  /*
   * Tailwind's list-inside (list-style-position: inside) makes WeasyPrint
   * emit LI > [Lbl, Span] without an LBody, which violates PDF/UA-1.
   * Force outside so text content gets wrapped in /LBody.
   */
  ul, ol {
    list-style-position: outside !important;
    padding-left: 1.5em !important;
  }

  /*
   * sr-only text in HTML uses position:absolute + clip to hide visually
   * while staying readable to assistive tech. WeasyPrint then wraps the
   * out-of-flow content in extra /Table struct elements when it lives
   * inside a table (caption.sr-only), which trips horn 09-006 Table-in-
   * Table. Render sr-only inline-but-tiny instead so the text stays in
   * the tag tree exactly where it lives in the source.
   */
  .sr-only {
    position: static !important;
    width: auto !important;
    height: auto !important;
    padding: 0 !important;
    margin: 0 !important;
    overflow: visible !important;
    clip: auto !important;
    white-space: normal !important;
    border-width: 0 !important;
    font-size: 0.001pt !important;
    line-height: 0 !important;
    color: transparent !important;
  }

  [class*="overflow-hidden"], [class*="overflow-auto"] {
    overflow: visible !important;
  }
  .overflow-clip, [class*="overflow-clip"] {
    overflow: visible !important;
  }

  .prose h2 {
    font-size: 13pt !important;
    font-weight: 600 !important;
    border-bottom: none !important;
    padding-bottom: 0 !important;
    margin-top: 12pt !important;
    margin-bottom: 6pt !important;
  }
</style>`

async function prepareForPdf(html: string, baseUrl: string): Promise<string> {
  let result = html

  const stylesheetTags = result.match(STYLESHEET_RE) ?? []

  for (const tag of stylesheetTags) {
    const hrefMatch = tag.match(HREF_RE)
    if (!hrefMatch?.[1]) continue

    const [, cssUrl] = hrefMatch
    const resolved = new URL(cssUrl, baseUrl)
    resolved.searchParams.set('direct', '')
    const cssResponse = await fetch(resolved)
    if (!cssResponse.ok) continue
    const css = inlinePropertyDefaults(stripCssLayers(await cssResponse.text()))
    result = result.replace(tag, `<style>${css}</style>`)
  }

  result = result.replace(SCRIPT_RE, '')
  result = result.replace(PRELOAD_RE, '')
  result = result.replace(PRINT_HIDDEN_RE, '')
  result = result.replace(APP_SEPARATOR_RE, '</main>')
  result = result.replace(TABLE_SEPARATOR_TR_RE, '')
  result = expandIssueCollapsibles(result)
  result = flattenDefinitionLists(result)
  result = flattenLinks(result)

  result = forceLightMode(result)
  result = result.replace('</head>', `${PDF_OVERRIDES}\n</head>`)

  return result
}

export { stripCssLayers, forceLightMode, prepareForPdf }
