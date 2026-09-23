// Moving, blinking, auto-updating and timed content, for 2.2.1, 2.2.2, 2.3.1, 2.3.3.
// Run against the open page:  agent-browser eval --stdin < motion.js
// Watches the page for five seconds, so the command takes about that long to return.
// Flash frequency is not measured here: a suspected flash is recorded on video.
// The evaluator judges the recording against the 2.3.1 thresholds.
/* oxlint-disable unicorn/consistent-function-scoping, unicorn/no-null */
;(async () => {
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
  const animations = (document.getAnimations ? document.getAnimations() : [])
    .filter((a) => a.effect && a.effect.target && isVisible(a.effect.target))
    .slice(0, 60)
    .map((a) => {
      const timing = a.effect.getTiming ? a.effect.getTiming() : {}
      let type = 'web-animation'
      if (a instanceof CSSAnimation) type = 'css-animation'
      else if (a instanceof CSSTransition) type = 'css-transition'
      return {
        selector: cssPath(a.effect.target),
        type,
        name: a.animationName || a.transitionProperty || a.id || null,
        duration: timing.duration ?? null,
        iterations: timing.iterations === Infinity ? 'infinite' : (timing.iterations ?? null),
        playState: a.playState
      }
    })
  const changes = new Map()
  const observer = new MutationObserver((records) => {
    for (const r of records) {
      const target = r.type === 'characterData' ? r.target.parentElement : r.target
      if (!target || target.nodeType !== 1) continue
      const host =
        target.closest(
          '[aria-live], [role="status"], [role="alert"], [role="marquee"], [role="timer"], [class*="carousel"], [class*="slider"], [class*="ticker"], [class*="countdown"], [class*="timer"]'
        ) || target
      changes.set(host, (changes.get(host) || 0) + 1)
    }
  })
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['class', 'style', 'aria-hidden', 'hidden', 'src']
  })
  await new Promise((resolve) => setTimeout(resolve, 5000))
  observer.disconnect()
  const autoUpdating = [...changes.entries()]
    .filter(([el, n]) => n >= 3 && el.isConnected && isVisible(el))
    .toSorted((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([el, n]) => ({
      selector: cssPath(el),
      changesIn5s: n,
      textSample: clean(el.textContent).slice(0, 80)
    }))
  const carousels = [
    ...document.querySelectorAll(
      '[class*="carousel"], [class*="slider"], [class*="slideshow"], [role="region"][aria-roledescription="carousel"], .swiper, .slick-slider, .glide'
    )
  ]
    .filter(isVisible)
    .slice(0, 10)
    .map((el) => {
      const pause = [...el.querySelectorAll('button, [role="button"], a')].find((b) =>
        /pause|play|stop|pauze/i.test(
          `${b.textContent} ${b.getAttribute('aria-label') || ''} ${b.className}`
        )
      )
      return {
        selector: cssPath(el),
        autoAdvances: changes.has(el) || [...changes.keys()].some((c) => el.contains(c)),
        pauseControl: pause ? cssPath(pause) : null
      }
    })
  let reducedMotionQueryUsed = false
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule.media && /prefers-reduced-motion/.test(rule.media.mediaText)) {
          reducedMotionQueryUsed = true
          break
        }
      }
    } catch {
      // Cross-origin stylesheet: not readable
    }
    if (reducedMotionQueryUsed) break
  }
  return {
    url: location.href,
    reducedMotionActive: matchMedia('(prefers-reduced-motion: reduce)').matches,
    animations,
    marquee: document.querySelectorAll('marquee, [role="marquee"]').length,
    blink:
      document.querySelectorAll('blink').length +
      [...document.querySelectorAll('body *')].filter((el) =>
        getComputedStyle(el).textDecorationLine.includes('blink')
      ).length,
    autoUpdating,
    carousels,
    metaRefresh:
      document.querySelector('meta[http-equiv="refresh" i]')?.getAttribute('content') || null,
    reducedMotionQueryUsed,
    counts: {
      runningAnimations: animations.filter((a) => a.playState === 'running').length,
      infiniteAnimations: animations.filter((a) => a.iterations === 'infinite').length,
      autoUpdating: autoUpdating.length
    }
  }
})()
