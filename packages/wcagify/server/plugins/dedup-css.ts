import { defineNitroPlugin } from 'nitropack/runtime'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html) => {
    // Deduplicate CSS <link> tags — Nuxt's Vite dev renderer can produce
    // duplicate stylesheet links with different URL prefixes (@fs/ vs bare path)
    const seen = new Set<string>()
    html.head = html.head.map((chunk: string) =>
      chunk.replace(
        /<link[^>]*rel="stylesheet"[^>]*href="([^"]*)"[^>]*>/g,
        (match: string, href: string) => {
          const normalized = href
            .replace(/^\/_nuxt\//, '')
            .replace(/^@fs\//, '')
            .replace(/^virtual:nuxt:[^"]*$/, (v: string) => v)
          if (seen.has(normalized)) {
            return ''
          }
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
