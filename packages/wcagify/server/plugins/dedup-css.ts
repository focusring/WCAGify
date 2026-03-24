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
    // duplicate stylesheet links when a Nuxt layer resolves via both a
    // bare node_modules path and the fully-resolved absolute path.
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

    // Prevent FOUC: hide the page until all external CSS stylesheets have loaded.
    // In Vite dev mode, Tailwind utilities are served as external stylesheets that
    // load asynchronously, causing a flash of unstyled content. We hide the page
    // with an inline style, then unhide once every <link rel="stylesheet"> fires
    // its load event (with a safety timeout fallback).
    html.head.unshift('<style>html:not(.css-ready){visibility:hidden}</style>')
    html.head.push(
      `<script>(function(){var d=document.documentElement,l=document.querySelectorAll('link[rel="stylesheet"]'),n=0;function r(){if(--n<=0)d.classList.add('css-ready')}for(var i=0;i<l.length;i++){if(l[i].sheet)continue;n++;l[i].addEventListener('load',r);l[i].addEventListener('error',r)}if(n===0)d.classList.add('css-ready');setTimeout(function(){d.classList.add('css-ready')},1500)})();</script>`
    )
  })
})
