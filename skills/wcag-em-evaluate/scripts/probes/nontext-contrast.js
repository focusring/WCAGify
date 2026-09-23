// Contrast of user interface components, graphics and focus indicators, for 1.4.11 and 2.4.13.
// Run against the open page:  agent-browser eval --stdin < nontext-contrast.js
// Ratios are computed from solid computed colours; gradients and images give `null`.
// Those are judged from a screenshot. Text contrast is axe-core's job.
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
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      getComputedStyle(el).visibility !== 'hidden' &&
      !el.closest('[hidden], [aria-hidden="true"]')
    )
  }
  const parse = (color) => {
    const m = (color || '').match(/rgba?\((?<channels>[^)]+)\)/)
    if (!m) return null
    const [r, g, b, a = 1] = m.groups.channels
      .split(/[\s,/]+/)
      .filter(Boolean)
      .map(Number)
    return { r, g, b, a: Number.isNaN(a) ? 1 : a }
  }
  const blend = (fg, bg) => {
    if (!fg) return bg
    if (!bg) return fg
    const { a } = fg
    return {
      r: fg.r * a + bg.r * (1 - a),
      g: fg.g * a + bg.g * (1 - a),
      b: fg.b * a + bg.b * (1 - a),
      a: 1
    }
  }
  const luminance = ({ r, g, b }) => {
    const f = (c) => {
      const v = c / 255
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
    }
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
  }
  const ratio = (a, b) => {
    if (!a || !b) return null
    const l1 = luminance(a)
    const l2 = luminance(b)
    return Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 100) / 100
  }
  const fmt = (c) => (c ? `rgb(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)})` : null)
  // Effective background behind an element: walk up until a non-transparent colour.
  // An image or gradient on the way makes the result unknown.
  const backgroundBehind = (el) => {
    let node = el.parentElement
    let acc = null
    while (node) {
      const s = getComputedStyle(node)
      if (s.backgroundImage && s.backgroundImage !== 'none') return { color: null, image: true }
      const c = parse(s.backgroundColor)
      if (c && c.a > 0) {
        acc = acc ? blend(acc, c) : c
        if (c.a >= 1) return { color: acc, image: false }
      }
      node = node.parentElement
    }
    return { color: blend(acc, { r: 255, g: 255, b: 255, a: 1 }), image: false }
  }
  const ownBackground = (el) => {
    const s = getComputedStyle(el)
    if (s.backgroundImage && s.backgroundImage !== 'none') return { color: null, image: true }
    const c = parse(s.backgroundColor)
    return { color: c && c.a > 0 ? c : null, image: false }
  }
  const controls = [
    ...document.querySelectorAll(
      'input:not([type="hidden"]), select, textarea, button, [role="button"], [role="checkbox"], [role="radio"], [role="switch"], [role="slider"], [role="textbox"], [role="combobox"], a.button, a[class*="btn"]'
    )
  ]
    .filter((el) => isVisible(el) && !el.disabled)
    .slice(0, 120)
    .map((el) => {
      const s = getComputedStyle(el)
      const behind = backgroundBehind(el)
      const own = ownBackground(el)
      const border = parse(s.borderTopColor)
      const borderWidth = parseFloat(s.borderTopWidth) || 0
      const adjacent = behind.image ? null : behind.color
      const borderRatio =
        borderWidth > 0 && border && border.a > 0 ? ratio(blend(border, adjacent), adjacent) : null
      const backgroundRatio = own.color ? ratio(blend(own.color, adjacent), adjacent) : null
      const text = clean(el.textContent || el.value)
      let indicatorType = 'none'
      if (borderRatio !== null) indicatorType = 'border'
      else if (backgroundRatio !== null) indicatorType = 'background'
      else if (el.querySelector('svg, img, [class*="icon"]')) indicatorType = 'icon'
      const best = Math.max(borderRatio ?? 0, backgroundRatio ?? 0) || null
      return {
        selector: cssPath(el),
        role: el.getAttribute('role') || (el.localName === 'input' ? el.type : el.localName),
        name: (el.getAttribute('aria-label') || text || el.getAttribute('placeholder') || '').slice(
          0,
          50
        ),
        borderColor: borderWidth > 0 ? fmt(border) : null,
        backgroundColor: fmt(own.color),
        adjacentBackground: behind.image ? 'image' : fmt(adjacent),
        ratio: behind.image || own.image ? null : best,
        passes3: behind.image || own.image ? null : best !== null && best >= 3,
        indicatorType,
        hasVisibleText: text.length > 0
      }
    })
  // Focus indicators: the outline or box-shadow colour an element gets while focused.
  // Each focusable element is focused briefly and the previous focus is restored.
  const indicatorColour = (outline, shadow) => {
    if (outline) return fmt(outline)
    if (shadow) return `box-shadow ${fmt(shadow)}`
    return null
  }
  const focusables = [
    ...document.querySelectorAll(
      'a[href], button, input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])'
    )
  ]
    .filter(isVisible)
    .slice(0, 80)
  const previouslyFocused = document.activeElement
  const focusIndicators = []
  for (const el of focusables) {
    try {
      el.focus({ preventScroll: true })
    } catch {
      continue
    }
    if (document.activeElement !== el) continue
    const s = getComputedStyle(el)
    const behind = backgroundBehind(el)
    const adjacent = behind.image ? null : behind.color
    const outline =
      s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0 ? parse(s.outlineColor) : null
    const shadowColor = s.boxShadow !== 'none' ? parse(s.boxShadow) : null
    const colour = outline || shadowColor
    const r = colour && adjacent ? ratio(blend(colour, adjacent), adjacent) : null
    focusIndicators.push({
      selector: cssPath(el),
      outlineColor: indicatorColour(outline, shadowColor),
      outlineWidth: outline ? s.outlineWidth : null,
      adjacentBackground: behind.image ? 'image' : fmt(adjacent),
      ratio: r,
      passes3: r === null ? null : r >= 3
    })
  }
  try {
    if (previouslyFocused && previouslyFocused !== document.body)
      previouslyFocused.focus({ preventScroll: true })
    else document.activeElement?.blur()
  } catch {
    // Nothing to restore
  }
  const graphics = [...document.querySelectorAll('svg, [class*="icon"]')]
    .filter(
      (el) => isVisible(el) && !el.closest('svg svg') && el.getBoundingClientRect().width <= 200
    )
    .slice(0, 60)
    .map((el) => {
      const s = getComputedStyle(el)
      const behind = backgroundBehind(el)
      const adjacent = behind.image ? null : behind.color
      const fill = parse(s.fill && s.fill !== 'none' ? s.fill : s.color)
      const r = fill && adjacent ? ratio(blend(fill, adjacent), adjacent) : null
      return {
        selector: cssPath(el),
        kind: el.localName === 'svg' ? 'svg' : 'icon-font',
        fill: fmt(fill),
        adjacentBackground: behind.image ? 'image' : fmt(adjacent),
        ratio: r,
        passes3: r === null ? null : r >= 3,
        insideControl: Boolean(el.closest('a, button, [role="button"], label'))
      }
    })
  return {
    url: location.href,
    controls,
    focusIndicators,
    graphics,
    counts: {
      controlsBelow3: controls.filter((c) => c.passes3 === false).length,
      controlsUnknown: controls.filter((c) => c.passes3 === null).length,
      focusBelow3: focusIndicators.filter((f) => f.passes3 === false).length,
      focusWithoutIndicator: focusIndicators.filter((f) => f.outlineColor === null).length,
      graphicsBelow3: graphics.filter((g) => g.passes3 === false).length
    }
  }
})()
