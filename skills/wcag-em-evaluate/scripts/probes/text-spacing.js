// Applies the 1.4.12 Text Spacing metrics to the current page and reports clipped text.
// Run against the open page:  agent-browser eval --stdin < text-spacing.js
// The style stays applied so a screenshot can show the result; `agent-browser reload` removes it.
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
    return rect.width > 0 && rect.height > 0 && getComputedStyle(el).visibility !== 'hidden'
  }
  const textElements = () =>
    [...document.querySelectorAll('body *')].filter(
      (el) =>
        isVisible(el) &&
        !el.closest('svg, script, style') &&
        [...el.childNodes].some((n) => n.nodeType === 3 && clean(n.nodeValue))
    )
  // Overlap between two visible text elements that are not nested.
  const overlaps = (a, b) => {
    const r = a.getBoundingClientRect()
    const s = b.getBoundingClientRect()
    return (
      r.left < s.right - 2 && s.left < r.right - 2 && r.top < s.bottom - 2 && s.top < r.bottom - 2
    )
  }
  const id = 'wcag-em-text-spacing'
  let style = document.getElementById(id)
  if (!style) {
    style = document.createElement('style')
    style.id = id
    style.textContent =
      '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }'
    document.head.append(style)
  }
  // Force layout, then inspect.
  void document.body.offsetHeight
  const elements = textElements().slice(0, 1500)
  const clipped = []
  for (const el of elements) {
    const s = getComputedStyle(el)
    const hidesOverflow =
      /hidden|clip/.test(s.overflow) ||
      /hidden|clip/.test(s.overflowY) ||
      /hidden|clip/.test(s.overflowX)
    const truncates = s.textOverflow === 'ellipsis' || s.webkitLineClamp !== 'none'
    if (
      (hidesOverflow || truncates) &&
      (el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2)
    ) {
      clipped.push({
        selector: cssPath(el),
        textSample: clean(el.textContent).slice(0, 80),
        kind: 'clipped'
      })
      continue
    }
    const fixedHeight = s.height !== 'auto' && s.height.endsWith('px') && s.overflow === 'visible'
    if (fixedHeight && el.scrollHeight > el.clientHeight + 2) {
      clipped.push({
        selector: cssPath(el),
        textSample: clean(el.textContent).slice(0, 80),
        kind: 'overflowing'
      })
    }
  }
  // Overlaps: compare each text element with its following siblings' text elements.
  const visibleText = elements.filter((el) => clean(el.textContent).length > 1)
  for (let i = 0; i < visibleText.length && clipped.length < 60; i += 1) {
    const a = visibleText[i]
    const partner = visibleText
      .slice(i + 1, i + 25)
      .find((b) => !a.contains(b) && !b.contains(a) && overlaps(a, b))
    if (partner) {
      clipped.push({
        selector: cssPath(a),
        textSample: clean(a.textContent).slice(0, 80),
        kind: 'overlapping',
        with: cssPath(partner)
      })
    }
  }
  return {
    url: location.href,
    applied: true,
    clipped,
    counts: {
      textElements: elements.length,
      clipped: clipped.filter((c) => c.kind === 'clipped').length,
      overflowing: clipped.filter((c) => c.kind === 'overflowing').length,
      overlapping: clipped.filter((c) => c.kind === 'overlapping').length
    }
  }
})()
