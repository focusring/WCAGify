// Reflow facts for 1.4.10, run after `agent-browser set viewport 320 900`.
// Run against the open page:  agent-browser eval --stdin < reflow.js
// Reports two-dimensional scrolling and the elements that are wider than the viewport.
// Content that legitimately needs two dimensions is listed separately.
/* oxlint-disable unicorn/consistent-function-scoping, unicorn/no-null, unicorn/prefer-dom-node-text-content */
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
  const viewportWidth = window.innerWidth
  const docWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)
  const wideElements = [...document.querySelectorAll('body *')]
    .filter((el) => {
      if (!isVisible(el) || el.closest('svg')) return false
      const rect = el.getBoundingClientRect()
      return rect.right > viewportWidth + 2 || rect.width > viewportWidth + 2
    })
    .filter(
      (el) =>
        ![...el.children].some((child) => child.getBoundingClientRect().right > viewportWidth + 2)
    )
    .slice(0, 30)
    .map((el) => ({
      selector: cssPath(el),
      width: Math.round(el.getBoundingClientRect().width),
      textSample: clean(el.textContent).slice(0, 60)
    }))
  const twoDimensional = [
    ...[...document.querySelectorAll('table')]
      .filter(isVisible)
      .map((el) => ({ selector: cssPath(el), reason: 'table' })),
    ...[...document.querySelectorAll('canvas, [class*="map"], iframe[src*="maps"]')]
      .filter(isVisible)
      .map((el) => ({ selector: cssPath(el), reason: 'map' })),
    ...[...document.querySelectorAll('[role="toolbar"], [class*="toolbar"]')]
      .filter(isVisible)
      .map((el) => ({ selector: cssPath(el), reason: 'toolbar' })),
    ...[...document.querySelectorAll('img[width], svg')]
      .filter((el) => isVisible(el) && el.getBoundingClientRect().width > viewportWidth)
      .map((el) => ({ selector: cssPath(el), reason: 'diagram' }))
  ]
  // Elements that scroll horizontally on their own (carousels, code blocks, tables in wrappers).
  const scrollers = [...document.querySelectorAll('body *')]
    .filter((el) => {
      const s = getComputedStyle(el)
      return /auto|scroll/.test(s.overflowX) && el.scrollWidth > el.clientWidth + 2 && isVisible(el)
    })
    .slice(0, 20)
    .map((el) => ({
      selector: cssPath(el),
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      containsText: clean(el.textContent).length > 40
    }))
  // Text hidden at this width compared to the amount of text in the DOM.
  const allText = clean(document.body.innerText || '').length
  const hiddenText = [...document.querySelectorAll('body *')]
    .filter(
      (el) =>
        !isVisible(el) &&
        getComputedStyle(el).display === 'none' &&
        clean(el.textContent).length > 40 &&
        !el.closest('script, style, template, noscript')
    )
    .filter((el) => !el.parentElement || getComputedStyle(el.parentElement).display !== 'none')
    .slice(0, 20)
    .map((el) => ({ selector: cssPath(el), textSample: clean(el.textContent).slice(0, 60) }))
  return {
    url: location.href,
    viewportWidth,
    scrollWidth: docWidth,
    horizontalScroll: docWidth > viewportWidth + 2,
    wideElements,
    twoDimensional,
    scrollers,
    hiddenBlocks: hiddenText,
    visibleTextChars: allText,
    textBelow320px: viewportWidth <= 320
  }
})()
