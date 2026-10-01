import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const dir = fileURLToPath(new URL('.', import.meta.url))

/* A render-only layer: report components, prose overrides, the report
 * translations and Nuxt UI's app config. No pages, no server routes, no Nuxt
 * Content.
 *
 * Neither stylesheet is registered here. A consumer imports `report.css` from
 * its own stylesheet after `tailwindcss` and `@nuxt/ui`, so Tailwind's base
 * styles load once, and lists `print.css` in its own `css` after that
 * stylesheet. Nuxt puts a layer's `css` before the project's, where the print
 * rules would lose to the screen rules of the same specificity. */
const nuxtConfig = {
  modules: ['@nuxt/ui', '@nuxtjs/i18n', '@nuxt/fonts'],

  /* Nuxt UI registers its prose components, and the `#build/ui/prose/pre`
   * template `ProsePre` imports, only with this option or when the
   * `@nuxtjs/mdc` or `@nuxt/content` module is registered. This layer
   * registers neither; it imports `MDCRenderer` directly. */
  ui: {
    prose: true
  },

  /* The prose overrides (`ProseImg`, `ProsePre`) replace Nuxt UI's global
   * prose components of the same name, so they are registered globally too,
   * without a path prefix. A layer's components rank above Nuxt UI's
   * (priority 0) and below the project's, so a project's own `ProseImg` still
   * wins. Setting `components` replaces the layer's default directories, so
   * `app/components` is listed as well. */
  components: [
    { path: join(dir, 'app/components/prose'), global: true },
    { path: join(dir, 'app/components') }
  ],

  i18n: {
    restructureDir: false,
    langDir: 'locales',
    locales: [
      {
        code: 'en',
        name: 'English',
        language: 'en-US',
        file: 'en.ts'
      },
      {
        code: 'nl',
        name: 'Nederlands',
        language: 'nl-NL',
        file: 'nl.ts'
      }
    ]
  }
}

export default nuxtConfig
