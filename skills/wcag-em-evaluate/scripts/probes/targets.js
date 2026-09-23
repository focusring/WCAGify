// Pointer target sizes on the current page, for 2.5.8 (24 by 24) and 2.5.5 (44 by 44).
// Run against the open page:  agent-browser eval --stdin < targets.js
// Measures every visible interactive element and marks the two detectable exceptions as
// `inline` and `userAgentDefault`. "Essential" and "equivalent" are judged by the evaluator.
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
  const nameOf = (el) =>
    byIds(el, 'aria-labelledby') ||
    clean(el.getAttribute('aria-label')) ||
    (el.labels && el.labels.length
      ? clean([...el.labels].map((l) => l.textContent).join(' '))
      : '') ||
    clean(el.textContent) ||
    clean(el.getAttribute('title')) ||
    clean(el.getAttribute('alt')) ||
    ''
  const roleOf = (el) => {
    if (el.getAttribute('role')) return el.getAttribute('role')
    if (el.localName === 'a') return 'link'
    return el.localName === 'input' ? el.type : el.localName
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
  const elements = [
    ...document.querySelectorAll(
      'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="switch"], [role="tab"], [role="menuitem"], [role="option"], [role="slider"], [tabindex]:not([tabindex="-1"]), [onclick]'
    )
  ].filter((el) => isVisible(el) && !el.disabled)
  // The clickable box: the element itself, or its largest clickable ancestor label for inputs.
  const boxOf = (el) => {
    let rect = el.getBoundingClientRect()
    if (
      el.localName === 'input' &&
      /^(?:checkbox|radio)$/.test(el.type) &&
      el.labels &&
      el.labels[0]
    ) {
      const label = el.labels[0].getBoundingClientRect()
      if (label.width * label.height > rect.width * rect.height) rect = label
    }
    return {
      x: rect.left,
      y: rect.top,
      w: rect.width,
      h: rect.height,
      cx: rect.left + rect.width / 2,
      cy: rect.top + rect.height / 2
    }
  }
  const boxes = elements.map((el) => ({ el, box: boxOf(el) }))
  const isInline = (el) => {
    const style = getComputedStyle(el)
    if (!style.display.startsWith('inline')) return false
    const parent = el.closest(
      'p, li, td, th, dd, figcaption, blockquote, span, h1, h2, h3, h4, h5, h6'
    )
    if (!parent) return false
    const text = clean(parent.textContent)
    return text.length > clean(el.textContent).length + 3
  }
  const isUserAgentDefault = (el) => {
    if (!['input', 'select', 'button', 'textarea', 'summary'].includes(el.localName)) return false
    const style = getComputedStyle(el)
    return (
      style.appearance !== 'none' &&
      style.webkitAppearance !== 'none' &&
      (el.localName !== 'button' || !el.style.length)
    )
  }
  const distance = (a, b) => {
    const dx = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w), 0)
    const dy = Math.max(b.y - (a.y + a.h), a.y - (b.y + b.h), 0)
    return Math.hypot(dx, dy)
  }
  const targets = boxes.map(({ el, box }) => {
    const others = boxes.filter((o) => o.el !== el && !o.el.contains(el) && !el.contains(o.el))
    let nearest = null
    for (const o of others) {
      const d = distance(box, o.box)
      if (!nearest || d < nearest.distance)
        nearest = { selector: cssPath(o.el), distance: Math.round(d), box: o.box }
    }
    const sizeOk24 = box.w >= 24 && box.h >= 24
    // Spacing exception of 2.5.8: a 24 px circle centred on the target must not intersect
    // Neighbouring targets or their circles.
    let spacingOk = true
    for (const o of others) {
      const centreDist = Math.hypot(o.box.cx - box.cx, o.box.cy - box.cy)
      const circleToBox = Math.hypot(
        Math.max(o.box.x - box.cx, box.cx - (o.box.x + o.box.w), 0),
        Math.max(o.box.y - box.cy, box.cy - (o.box.y + o.box.h), 0)
      )
      if (centreDist < 24 || circleToBox < 12) {
        spacingOk = false
        break
      }
    }
    return {
      selector: cssPath(el),
      role: roleOf(el),
      name: nameOf(el).slice(0, 60),
      w: Math.round(box.w),
      h: Math.round(box.h),
      inline: isInline(el),
      userAgentDefault: isUserAgentDefault(el),
      passes24: sizeOk24 || spacingOk,
      passes44: box.w >= 44 && box.h >= 44,
      nearest: nearest ? { selector: nearest.selector, distance: nearest.distance } : null
    }
  })
  return {
    url: location.href,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    targets,
    counts: {
      total: targets.length,
      failing24: targets.filter((t) => !t.passes24 && !t.inline && !t.userAgentDefault).length,
      failing44: targets.filter((t) => !t.passes44 && !t.inline && !t.userAgentDefault).length
    }
  }
})()
