// Facts about the current view for WCAG-EM Step 2, as one JSON object.
// Run against the open page:  agent-browser eval --stdin < inspect-view.js
//
// `links`      -> Step 2.1 common views and the inventory for Step 3.2
// `content`    -> Step 2.3 sample types (forms, tables, media, dialogs, live regions ...)
// `technology` -> Step 2.4 technologies relied upon and the systems behind them
//
// Everything stays inside the IIFE so evaluating the script leaves no globals on the page.
/* oxlint-disable unicorn/consistent-function-scoping */
;(() => {
  const all = (selector) => document.querySelectorAll(selector)
  const unique = (values) => [...new Set(values)].toSorted()
  const hostOf = (url) => {
    try {
      return new URL(url).host
    } catch {
      return undefined
    }
  }
  const hasGlobal = (...names) => names.some((name) => name in globalThis)
  const hrefs = [...all('a[href]')].map((a) => a.href).filter((href) => /^https?:/.test(href))
  const internal = hrefs.filter((href) => href.startsWith(`${location.origin}/`))
  const external = hrefs.filter((href) => !href.startsWith(`${location.origin}/`))
  const withAria = [...all('*')].filter((el) =>
    [...el.attributes].some((attr) => attr.name === 'role' || attr.name.startsWith('aria-'))
  )

  return {
    url: location.href,
    title: document.title,
    lang: document.documentElement.lang || undefined,
    generator: document.querySelector('meta[name="generator"]')?.content,
    links: {
      internal: unique(internal.map((href) => href.replace(/#.*$/, ''))),
      externalHosts: unique(external.map(hostOf).filter(Boolean)),
      documents: unique(
        hrefs.filter((href) => /\.(?:pdf|docx?|xlsx?|pptx?|epub)(?:\?|$)/i.test(href))
      )
    },
    content: {
      headings: all('h1, h2, h3, h4, h5, h6').length,
      forms: all('form').length,
      inputs: all('input, select, textarea').length,
      tables: all('table').length,
      lists: all('ul, ol, dl').length,
      images: all('img').length,
      svg: all('svg').length,
      canvas: all('canvas').length,
      media: all('video, audio').length,
      iframes: unique([...all('iframe')].map((frame) => frame.src).filter(Boolean)),
      dialogs: all('dialog, [role="dialog"], [role="alertdialog"]').length,
      liveRegions: all('[aria-live], [role="status"], [role="alert"]').length,
      ariaElements: withAria.length,
      math: all('math').length
    },
    technology: {
      vue:
        hasGlobal('__VUE__', '__NUXT__') ||
        Boolean(document.querySelector('#__nuxt, [data-v-app]')),
      react:
        hasGlobal('__NEXT_DATA__') ||
        Boolean(document.querySelector('#__next, [data-reactroot]')) ||
        Object.keys(globalThis).some((key) => key.startsWith('__REACT')),
      angular: Boolean(document.querySelector('[ng-version]')),
      svelte: Boolean(document.querySelector('[class*="svelte-"]')),
      jquery: typeof globalThis.jQuery === 'function' ? String(globalThis.jQuery.fn.jquery) : false,
      scriptHosts: unique(
        [...document.scripts]
          .map((script) => script.src)
          .map(hostOf)
          .filter(Boolean)
      ),
      stylesheets: all('link[rel="stylesheet"], style').length
    }
  }
})()
