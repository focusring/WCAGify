// Sequential focus order of the current page, for 2.1.1, 2.4.3, 2.4.7, 2.4.11, 2.4.13, 4.1.2.
// Run against the open page:  agent-browser eval --stdin < focusables.js
// Moves focus programmatically through every focusable element and compares its styles.
// It also checks whether the element is covered after scrolling into view. Focus is restored.
// A style change is evidence that an indicator exists, not that it is visible enough.
// The criterion file says which elements to screenshot.
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
    clean(el.getAttribute('alt')) ||
    clean(el.textContent) ||
    clean(el.getAttribute('title')) ||
    clean(el.getAttribute('placeholder')) ||
    clean(el.value) ||
    ''
  const roleOf = (el) => {
    if (el.getAttribute('role')) return el.getAttribute('role')
    const map = {
      a: el.hasAttribute('href') ? 'link' : 'generic',
      button: 'button',
      select: 'combobox',
      textarea: 'textbox',
      summary: 'button',
      iframe: 'frame'
    }
    if (el.localName === 'input') {
      const t = el.type
      if (['submit', 'reset', 'button', 'image'].includes(t)) return 'button'
      if (t === 'checkbox' || t === 'radio' || t === 'range') return t === 'range' ? 'slider' : t
      return 'textbox'
    }
    return map[el.localName] || el.localName
  }
  const isVisible = (el) => {
    const rect = el.getBoundingClientRect()
    const style = getComputedStyle(el)
    return (
      rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
    )
  }
  const styleKeys = [
    'outlineStyle',
    'outlineWidth',
    'outlineColor',
    'outlineOffset',
    'boxShadow',
    'borderColor',
    'borderWidth',
    'backgroundColor',
    'color',
    'textDecorationLine',
    'filter',
    'transform'
  ]
  const snapshot = (el) => {
    const s = getComputedStyle(el)
    const own = Object.fromEntries(styleKeys.map((k) => [k, s[k]]))
    const before = getComputedStyle(el, '::before')
    const after = getComputedStyle(el, '::after')
    own.pseudo = `${before.content}|${before.boxShadow}|${before.outlineStyle}|${after.content}|${after.boxShadow}|${after.outlineStyle}`
    return own
  }
  const candidates = [
    ...document.querySelectorAll(
      'a[href], area[href], button, input:not([type="hidden"]), select, textarea, iframe, summary, audio[controls], video[controls], [contenteditable="true"], [tabindex]'
    )
  ].filter((el) => !el.disabled && el.tabIndex >= 0 && !el.closest('[inert]'))
  const positives = candidates
    .filter((el) => el.tabIndex > 0)
    .toSorted((a, b) => a.tabIndex - b.tabIndex)
  const ordered = [...positives, ...candidates.filter((el) => el.tabIndex === 0)]
  const previouslyFocused = document.activeElement
  const { scrollX, scrollY } = globalThis
  const order = []
  let index = 0
  for (const el of ordered) {
    if (index >= 400) break
    const visible = isVisible(el)
    const blurred = snapshot(el)
    let focusStyleChanged = false
    let focused = blurred
    let obscured = false
    let obscuredBy = null
    if (visible) {
      try {
        el.scrollIntoView({ block: 'center', inline: 'nearest' })
        el.focus({ preventScroll: true })
        if (document.activeElement === el) {
          focused = snapshot(el)
          focusStyleChanged =
            styleKeys.some((k) => blurred[k] !== focused[k]) || blurred.pseudo !== focused.pseudo
        }
        const rect = el.getBoundingClientRect()
        const cx = Math.min(Math.max(rect.left + rect.width / 2, 0), window.innerWidth - 1)
        const cy = Math.min(Math.max(rect.top + rect.height / 2, 0), window.innerHeight - 1)
        const top = document.elementFromPoint(cx, cy)
        if (top && top !== el && !el.contains(top) && !top.contains(el)) {
          const topStyle = getComputedStyle(top)
          const covering =
            top.closest('[style*="position: fixed"], [style*="position: sticky"]') || top
          if (
            ['fixed', 'sticky', 'absolute'].includes(getComputedStyle(covering).position) ||
            topStyle.position === 'fixed' ||
            topStyle.position === 'sticky'
          ) {
            obscured = true
            obscuredBy = cssPath(covering)
          }
        }
      } catch {
        // An element that refuses focus stays unfocused: focusStyleChanged stays false
      }
    }
    const rect = el.getBoundingClientRect()
    order.push({
      index: index++,
      selector: cssPath(el),
      tag: el.localName,
      role: roleOf(el),
      name: nameOf(el).slice(0, 80),
      tabindex: el.getAttribute('tabindex'),
      visible,
      inAriaHidden: Boolean(el.closest('[aria-hidden="true"]')),
      box: {
        x: Math.round(rect.left + window.scrollX),
        y: Math.round(rect.top + window.scrollY),
        w: Math.round(rect.width),
        h: Math.round(rect.height)
      },
      focusStyleChanged,
      focusStyle: {
        outline: `${focused.outlineStyle} ${focused.outlineWidth} ${focused.outlineColor}`,
        outlineOffset: focused.outlineOffset,
        boxShadow: focused.boxShadow,
        border: `${focused.borderWidth} ${focused.borderColor}`,
        background: focused.backgroundColor,
        color: focused.color
      },
      obscured,
      obscuredBy
    })
  }
  try {
    if (previouslyFocused && previouslyFocused !== document.body)
      previouslyFocused.focus({ preventScroll: true })
    else if (document.activeElement) document.activeElement.blur()
  } catch {
    // Nothing to restore
  }
  window.scrollTo(scrollX, scrollY)
  // Elements that react to a click but are not in the focus order (2.1.1 candidates).
  const clickableNotFocusable = [
    ...document.querySelectorAll(
      '[onclick], [role="button"], [role="link"], [role="tab"], [role="menuitem"], [role="option"], [role="checkbox"], [role="switch"], div[class*="btn"], span[class*="btn"], div[class*="button"], span[class*="button"]'
    )
  ]
    .filter(
      (el) =>
        el.tabIndex < 0 &&
        !el.closest('a[href], button, input, select, textarea, [tabindex]') &&
        isVisible(el)
    )
    .slice(0, 40)
    .map((el) => ({
      selector: cssPath(el),
      reason: el.hasAttribute('onclick')
        ? 'onclick without tabindex'
        : `${el.getAttribute('role') || el.className} without tabindex`
    }))
  return {
    url: location.href,
    order,
    tabindexPositive: positives.map(cssPath),
    ariaHiddenFocusable: order.filter((o) => o.inAriaHidden).map((o) => o.selector),
    clickableNotFocusable,
    counts: {
      focusable: order.length,
      visible: order.filter((o) => o.visible).length,
      withoutFocusStyleChange: order.filter((o) => o.visible && !o.focusStyleChanged).length,
      obscured: order.filter((o) => o.obscured).length,
      truncated: ordered.length > 400
    }
  }
})()
