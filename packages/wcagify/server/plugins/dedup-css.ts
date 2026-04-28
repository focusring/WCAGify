import { defineNitroPlugin } from 'nitropack/runtime'

/**
 * Extract the meaningful filename from a Vite-served CSS href.
 * Vite dev mode serves the same file via multiple URL prefixes:
 *   /_nuxt/node_modules/@focusring/wcagify/app/assets/css/main.css
 *   /_nuxt/Users/tim/dev/project/node_modules/@focusring/wcagify/app/assets/css/main.css
 * We normalize by extracting the path from the last `node_modules/` segment onward,
 * or falling back to the basename for virtual/other URLs.
 */
function normalizeCssHref(href: string): string {
  const decoded = decodeURIComponent(href)
  // Extract from last node_modules/ onward — handles both short and absolute-path variants
  const nmIndex = decoded.lastIndexOf('node_modules/')
  if (nmIndex !== -1) return decoded.slice(nmIndex)
  // For virtual modules and .nuxt paths, use the filename after the last /
  const lastSlash = decoded.lastIndexOf('/')
  return lastSlash !== -1 ? decoded.slice(lastSlash + 1) : decoded
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html) => {
    // Deduplicate CSS <link> tags — Nuxt's Vite dev renderer can produce
    // Duplicate stylesheet links when a Nuxt layer resolves via both a
    // Bare node_modules path and the fully-resolved absolute path.
    const seen = new Set<string>()
    html.head = html.head.map((chunk: string) =>
      chunk.replace(
        /<link[^>]*rel="stylesheet"[^>]*href="([^"]*)"[^>]*>/g,
        (match: string, href: string) => {
          const normalized = normalizeCssHref(href)
          if (seen.has(normalized)) return ''
          seen.add(normalized)
          return match
        }
      )
    )

    // Prevent FOUC: hide the page until CSS is actually applied.
    // In Vite dev mode, <link rel="stylesheet"> tags load JS modules that call
    // __vite__updateStyle() to inject <style> tags — the link's `load` event fires
    // When the JS is received, BEFORE styles are in the DOM. In production, CSS is
    // Inlined or loaded as real stylesheets, so the `load` event works.
    // We use a two-pronged approach:
    //   1. Watch for Tailwind's marker (--font-sans) via getComputedStyle
    //   2. Safety timeout so the page is never hidden indefinitely
    html.head.unshift('<style>html:not(.css-ready){visibility:hidden}</style>')
    html.head.push(
      `<script>(function(){var d=document.documentElement;function show(){d.classList.add('css-ready')}function check(){if(getComputedStyle(d).getPropertyValue('--font-sans'))return show();requestAnimationFrame(check)}check();setTimeout(show,3000)})();</script>`
    )
  })
})
