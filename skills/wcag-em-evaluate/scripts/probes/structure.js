// Structure of the current page, for 1.3.1, 2.4.1, 2.4.2, 2.4.6, 2.4.10, 3.1.1, 3.1.2, 4.1.3.
// Run against the open page:  agent-browser eval --stdin < structure.js
// Returns headings, landmarks, lists, tables, iframes, language parts and live regions.
// Evidence only; the criterion file decides.
/* oxlint-disable unicorn/consistent-function-scoping, unicorn/no-null */
;(() => {
  const clean = (text) => (text || '').replace(/\s+/g, ' ').trim()
  const cssPath = (el) => {
    const parts = []
    let node = el
    while (node && node.nodeType === 1 && parts.length < 6) {
      let part = node.localName
      if (node.id) {
        parts.unshift(`${part}#${CSS.escape(node.id)}`)
        break
      }
      const siblings = node.parentElement
        ? [...node.parentElement.children].filter((s) => s.localName === node.localName)
        : []
      if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(node) + 1})`
      parts.unshift(part)
      node = node.parentElement
    }
    return parts.join(' > ')
  }
  const isVisible = (el) => {
    const rect = el.getBoundingClientRect()
    const style = getComputedStyle(el)
    return (
      rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && !el.closest('[hidden]')
    )
  }
  const nameOf = (el) => {
    const ids = (el.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean)
    const byIds = clean(ids.map((id) => document.getElementById(id)?.textContent || '').join(' '))
    return byIds || clean(el.getAttribute('aria-label')) || clean(el.getAttribute('title')) || ''
  }
  const focusable = (el) =>
    Boolean(el) &&
    (el.matches('a[href], button, input, select, textarea, [tabindex], [contenteditable]') ||
      el.tabIndex >= 0)

  const headings = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]')].map(
    (el) => ({
      level: /^h[1-6]$/.test(el.localName)
        ? Number(el.localName[1])
        : Number(el.getAttribute('aria-level') || 2),
      text: clean(el.textContent) || nameOf(el),
      selector: cssPath(el),
      visible: isVisible(el),
      ariaLevel: el.getAttribute('aria-level')
    })
  )
  const landmarkRoles = {
    header: 'banner',
    nav: 'navigation',
    main: 'main',
    footer: 'contentinfo',
    aside: 'complementary',
    form: 'form',
    section: 'region'
  }
  const landmarks = [
    ...document.querySelectorAll(
      'header, nav, main, footer, aside, form, section, [role="banner"], [role="navigation"], [role="main"], [role="contentinfo"], [role="complementary"], [role="form"], [role="region"], [role="search"]'
    )
  ]
    .map((el) => {
      let role = el.getAttribute('role') || landmarkRoles[el.localName]
      // Header and footer inside sectioning content are not landmarks; section and form need a name.
      if (
        (el.localName === 'header' || el.localName === 'footer') &&
        !el.getAttribute('role') &&
        el.closest('article, aside, main, nav, section')
      )
        role = null
      if (
        (el.localName === 'section' || el.localName === 'form') &&
        !el.getAttribute('role') &&
        !nameOf(el)
      )
        role = null
      return role ? { role, name: nameOf(el) || null, selector: cssPath(el) } : null
    })
    .filter(Boolean)

  const skipLinks = [...document.querySelectorAll('a[href^="#"]')]
    .filter((a) => a.getAttribute('href').length > 1)
    .slice(0, 12)
    .map((a) => {
      const id = decodeURIComponent(a.getAttribute('href').slice(1))
      const target = document.getElementById(id) || document.getElementsByName(id)[0]
      return {
        text: clean(a.textContent) || nameOf(a),
        href: a.getAttribute('href'),
        targetExists: Boolean(target),
        targetFocusable:
          focusable(target) ||
          (target ? target.tabIndex >= -1 && target.hasAttribute('tabindex') : false)
      }
    })

  const fakeLists = [...document.querySelectorAll('p, div')]
    .filter((el) => {
      const text = clean(el.textContent)
      return /^(?:[-•*·]|\d+[.)])\s/.test(text) && el.children.length < 3 && text.length < 200
    })
    .slice(0, 20)
    .map((el) => ({ selector: cssPath(el), sample: clean(el.textContent).slice(0, 80) }))

  const tables = [...document.querySelectorAll('table')].map((table) => {
    const rows = table.rows.length
    const cols = Math.max(0, ...[...table.rows].map((r) => r.cells.length))
    return {
      selector: cssPath(table),
      caption: clean(table.caption?.textContent) || null,
      thCount: table.querySelectorAll('th').length,
      scopeCount: table.querySelectorAll('th[scope], td[scope]').length,
      headersAttrCount: table.querySelectorAll('[headers]').length,
      rows,
      cols,
      layoutLike:
        table.getAttribute('role') === 'presentation' ||
        table.getAttribute('role') === 'none' ||
        (table.querySelectorAll('th').length === 0 && (rows < 2 || cols < 2))
    }
  })

  const iframes = [...document.querySelectorAll('iframe, frame')].map((el) => ({
    selector: cssPath(el),
    src: el.getAttribute('src'),
    title: el.getAttribute('title'),
    name: nameOf(el) || el.getAttribute('title') || null
  }))

  const langParts = [...document.querySelectorAll('body [lang]')].slice(0, 50).map((el) => ({
    selector: cssPath(el),
    lang: el.getAttribute('lang'),
    textSample: clean(el.textContent).slice(0, 80)
  }))

  const liveRegions = [
    ...document.querySelectorAll(
      '[aria-live], [role="status"], [role="alert"], [role="log"], output'
    )
  ].map((el) => ({
    selector: cssPath(el),
    role: el.getAttribute('role') || el.localName,
    ariaLive: el.getAttribute('aria-live') || null,
    ariaAtomic: el.getAttribute('aria-atomic') || null,
    text: clean(el.textContent).slice(0, 120)
  }))

  // Text that looks like a heading but is not marked up as one (F2, p-as-heading).
  const bodySize = parseFloat(getComputedStyle(document.body).fontSize) || 16
  const visuallyStyledHeadings = [...document.querySelectorAll('p, div, span, strong, b')]
    .filter((el) => {
      if (el.closest('h1, h2, h3, h4, h5, h6, [role="heading"], a, button, nav, header'))
        return false
      const text = clean(el.textContent)
      if (!text || text.length > 90 || el.children.length > 1) return false
      const style = getComputedStyle(el)
      const size = parseFloat(style.fontSize)
      const bold = Number(style.fontWeight) >= 600 || style.fontWeight === 'bold'
      const block = style.display !== 'inline'
      return block && ((size >= bodySize * 1.25 && bold) || size >= bodySize * 1.5)
    })
    .slice(0, 20)
    .map((el) => ({
      selector: cssPath(el),
      text: clean(el.textContent),
      fontSize: getComputedStyle(el).fontSize,
      fontWeight: getComputedStyle(el).fontWeight
    }))

  return {
    url: location.href,
    title: document.title,
    lang: document.documentElement.getAttribute('lang'),
    xmlLang: document.documentElement.getAttribute('xml:lang'),
    headings,
    landmarks,
    mainCount: document.querySelectorAll('main, [role="main"]').length,
    skipLinks,
    lists: {
      ul: document.querySelectorAll('ul').length,
      ol: document.querySelectorAll('ol').length,
      dl: document.querySelectorAll('dl').length,
      fakeLists
    },
    tables,
    iframes,
    langParts,
    liveRegions,
    metaRefresh:
      document.querySelector('meta[http-equiv="refresh" i]')?.getAttribute('content') || null,
    titleAttrs: document.querySelectorAll('body [title]').length,
    accesskeys: [...document.querySelectorAll('[accesskey]')].map((el) => ({
      selector: cssPath(el),
      key: el.getAttribute('accesskey')
    })),
    tabindexPositive: [...document.querySelectorAll('[tabindex]')]
      .filter((el) => Number(el.getAttribute('tabindex')) > 0)
      .map((el) => ({ selector: cssPath(el), tabindex: el.getAttribute('tabindex') })),
    visuallyStyledHeadings
  }
})()
