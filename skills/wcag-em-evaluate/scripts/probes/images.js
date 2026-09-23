// Non-text content on the current page, for 1.1.1, 1.4.5 and 2.4.4 (image links).
// Run against the open page:  agent-browser eval --stdin < images.js
// Returns { images: [...], counts: {...} }; every field is evidence, the criterion file decides.
/* oxlint-disable unicorn/consistent-function-scoping, max-depth, unicorn/no-null */
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
      rect.width > 0 &&
      rect.height > 0 &&
      style.visibility !== 'hidden' &&
      style.display !== 'none' &&
      !el.closest('[hidden], [aria-hidden="true"]')
    )
  }
  const labelledbyText = (el) => {
    const ids = (el.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean)
    return clean(ids.map((id) => document.getElementById(id)?.textContent || '').join(' '))
  }
  // Accessible name, in the order of the accname algorithm as far as it applies to images.
  const nameOf = (el) => {
    const labelledby = labelledbyText(el)
    if (labelledby) return { name: labelledby, source: 'aria-labelledby' }
    const ariaLabel = clean(el.getAttribute('aria-label'))
    if (ariaLabel) return { name: ariaLabel, source: 'aria-label' }
    if (el.localName === 'img' || el.localName === 'area' || el.localName === 'input') {
      if (el.hasAttribute('alt')) return { name: clean(el.getAttribute('alt')), source: 'alt' }
    }
    if (el.localName === 'svg') {
      const title = el.querySelector(':scope > title')
      if (title) return { name: clean(title.textContent), source: 'svg-title' }
    }
    if (el.localName === 'object') {
      const body = clean(el.textContent)
      if (body) return { name: body, source: 'object-body' }
    }
    const title = clean(el.getAttribute('title'))
    if (title) return { name: title, source: 'title' }
    return { name: '', source: 'none' }
  }
  const presentational = (el) =>
    ['none', 'presentation'].includes(el.getAttribute('role') || '') ||
    (el.localName === 'img' && el.getAttribute('alt') === '' && !el.getAttribute('aria-label')) ||
    el.getAttribute('aria-hidden') === 'true'
  // Text around the element: the figure, paragraph or cell it sits in when that is short.
  // Otherwise the text just before and after it, to show what the image is meant to illustrate.
  const nearby = (el) => {
    const container = el.closest(
      'figure, p, li, td, th, dt, dd, blockquote, h1, h2, h3, h4, h5, h6'
    )
    if (container) {
      const text = clean(container.textContent)
      return text.length > 240 ? `${text.slice(0, 120)} [...] ${text.slice(-120)}` : text
    }
    const previous = clean(el.previousElementSibling?.textContent).slice(-120)
    const next = clean(el.nextElementSibling?.textContent).slice(0, 120)
    return [previous, next].filter(Boolean).join(' | ')
  }
  const control = (el) => {
    const link = el.closest('a[href], [role="link"]')
    const button = el.closest('button, [role="button"], input[type="submit"], input[type="image"]')
    const host = link || button
    const own = host
      ? clean(
          [...host.childNodes]
            .filter((n) => n !== el && !(n.nodeType === 1 && n.contains(el)))
            .map((n) => n.textContent)
            .join(' ')
        )
      : ''
    return {
      inLink: link ? link.getAttribute('href') : null,
      inButton: Boolean(button),
      controlText: own || (host ? clean(host.getAttribute('aria-label')) : '')
    }
  }
  const entries = []
  const push = (el, kind, extra = {}) => {
    const { name, source } = nameOf(el)
    const rect = el.getBoundingClientRect()
    const figure = el.closest('figure')
    entries.push({
      selector: cssPath(el),
      kind,
      src:
        extra.src ?? (el.currentSrc || el.getAttribute('src') || el.getAttribute('data') || null),
      alt: el.hasAttribute('alt') ? el.getAttribute('alt') : null,
      role: el.getAttribute('role') || null,
      name,
      nameSource: source,
      presentational: presentational(el),
      visible: isVisible(el),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      ...control(el),
      figcaption: figure ? clean(figure.querySelector('figcaption')?.textContent) || null : null,
      nearbyText: nearby(el)
    })
  }
  for (const el of document.querySelectorAll('img')) push(el, 'img')
  for (const el of document.querySelectorAll('svg')) {
    if (el.closest('svg') !== el) continue
    push(el, el.getAttribute('role') === 'img' ? 'role-img' : 'svg')
  }
  for (const el of document.querySelectorAll('input[type="image"]')) push(el, 'input-image')
  for (const el of document.querySelectorAll('area')) push(el, 'area')
  for (const el of document.querySelectorAll('object, embed')) push(el, 'object')
  for (const el of document.querySelectorAll('canvas')) push(el, 'canvas')
  for (const el of document.querySelectorAll('[role="img"]:not(svg):not(img)')) push(el, 'role-img')
  // CSS background images on elements that carry no text of their own.
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('svg')) continue
    const bg = getComputedStyle(el).backgroundImage
    if (!bg || bg === 'none' || !/url\(/.test(bg)) continue
    if (clean(el.textContent)) continue
    const rect = el.getBoundingClientRect()
    if (rect.width < 8 || rect.height < 8) continue
    push(el, 'css-background', { src: bg.match(/url\(["']?(?<url>[^"')]+)/)?.groups.url || bg })
  }
  // Emoji and symbol-only text nodes that carry meaning on their own (1.1.1, H86).
  const emoji = /\p{Extended_Pictographic}/u
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const seen = new Set()
  while (walker.nextNode()) {
    const text = walker.currentNode.nodeValue
    if (!emoji.test(text)) continue
    const el = walker.currentNode.parentElement
    if (!el || seen.has(el) || el.closest('svg')) continue
    seen.add(el)
    if (clean(text).length > 12) continue
    push(el, 'emoji', { src: clean(text) })
  }
  return {
    url: location.href,
    images: entries,
    counts: {
      total: entries.length,
      withoutAlt: entries.filter((e) => e.kind === 'img' && e.alt === null).length,
      presentational: entries.filter((e) => e.presentational).length,
      inControlsWithoutName: entries.filter(
        (e) => (e.inLink || e.inButton) && !e.name && !e.controlText && !e.presentational
      ).length
    }
  }
})()
