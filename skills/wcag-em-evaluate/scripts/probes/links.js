// Links on the current page, for 2.4.4, 2.4.9, 3.2.5 and 1.1.1 (image links).
// Run against the open page:  agent-browser eval --stdin < links.js
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
  const byIds = (el, attr) =>
    clean(
      (el.getAttribute(attr) || '')
        .split(/\s+/)
        .filter(Boolean)
        .map((id) => document.getElementById(id)?.textContent || '')
        .join(' ')
    )
  const nameOf = (el) => {
    const labelledby = byIds(el, 'aria-labelledby')
    if (labelledby) return labelledby
    const ariaLabel = clean(el.getAttribute('aria-label'))
    if (ariaLabel) return ariaLabel
    // Text content including alt text of images and aria-labels of children.
    const parts = []
    const walk = (node) => {
      for (const child of node.childNodes) {
        if (child.nodeType === 3) parts.push(child.nodeValue)
        else if (child.nodeType === 1) {
          if (child.getAttribute('aria-hidden') === 'true') continue
          const label = child.getAttribute('aria-label') || child.getAttribute('alt')
          if (label) parts.push(label)
          else if (child.localName === 'svg')
            parts.push(child.querySelector('title')?.textContent || '')
          else walk(child)
        }
      }
    }
    walk(el)
    return clean(parts.join(' ')) || clean(el.getAttribute('title'))
  }
  const generic =
    /^(?:read more|learn more|more|click here|here|link|details|view|see more|lees meer|meer|klik hier|hier|bekijk|lees verder|verder|download|open|go|next|previous|volgende|vorige|https?:\/\/\S+)$/i
  const contextOf = (a) => {
    const li = a.closest('li')
    const cell = a.closest('td, th')
    const heading = a.closest('h1, h2, h3, h4, h5, h6')
    const p = a.closest('p')
    if (heading) return { context: 'heading', contextText: clean(heading.textContent) }
    if (cell) {
      const table = cell.closest('table')
      const rowHeader = cell.parentElement?.querySelector('th')
      const colIndex = cell.cellIndex
      const colHeader =
        table?.tHead?.rows[0]?.cells[colIndex] ||
        table?.querySelector(`tr:first-child > th:nth-child(${colIndex + 1})`)
      return {
        context: 'tablecell',
        contextText: clean(
          `${rowHeader?.textContent || ''} ${colHeader?.textContent || ''} ${cell.textContent}`
        )
      }
    }
    if (li) return { context: 'listitem', contextText: clean(li.textContent).slice(0, 200) }
    if (p) {
      const text = clean(p.textContent)
      const at = text.indexOf(clean(a.textContent))
      const start = Math.max(0, text.lastIndexOf('.', at) + 1)
      const end = text.indexOf('.', at + 1)
      return {
        context: 'sentence',
        contextText: text
          .slice(start, end === -1 ? undefined : end + 1)
          .trim()
          .slice(0, 200)
      }
    }
    const previous = clean(a.previousSibling?.textContent).slice(-100)
    const next = clean(a.nextSibling?.textContent).slice(0, 100)
    const around = [previous, next].filter(Boolean).join(' | ')
    return { context: around ? 'paragraph' : 'none', contextText: around }
  }
  const anchors = [...document.querySelectorAll('a[href], [role="link"]')]
  const links = anchors.map((a) => {
    const text = clean(a.textContent)
    const name = nameOf(a)
    const { context, contextText } = contextOf(a)
    const target = a.getAttribute('target')
    return {
      selector: cssPath(a),
      text,
      name,
      href: a.getAttribute('href'),
      target,
      opensNewWindow: target === '_blank',
      isImageOnly: !text && Boolean(a.querySelector('img, svg, [role="img"]')),
      context,
      contextText,
      generic: generic.test(name)
    }
  })
  const byName = new Map()
  for (const l of links) {
    if (!l.name) continue
    const key = l.name.toLowerCase()
    if (!byName.has(key)) byName.set(key, new Set())
    byName.get(key).add((l.href || '').replace(/#.*$/, ''))
  }
  const sameNameDifferentHref = [...byName.entries()]
    .filter(([, hrefs]) => hrefs.size > 1)
    .map(([name, hrefs]) => ({ name, hrefs: [...hrefs] }))
  return {
    url: location.href,
    links,
    sameNameDifferentHref,
    emptyLinks: links.filter((l) => !l.name).map((l) => l.selector),
    counts: {
      total: links.length,
      generic: links.filter((l) => l.generic).length,
      empty: links.filter((l) => !l.name).length,
      newWindow: links.filter((l) => l.opensNewWindow).length,
      imageOnly: links.filter((l) => l.isImageOnly).length
    }
  }
})()
