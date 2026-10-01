import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { githubLightA11y } from './highlight/github-light-a11y'

const dir = fileURLToPath(new URL('.', import.meta.url))
const require = createRequire(import.meta.url)

const nuxtConfig = {
  devtools: { enabled: false },

  /* The report layer brings `@nuxt/ui`, `@nuxtjs/i18n` and `@nuxt/fonts`,
   * the report components, their translations and the app config. */
  extends: ['@focusring/wcagify-reporter/layer'],

  modules: ['@nuxt/content', '@nuxt/a11y', '@focusring/wcagify/nuxt'],

  /* `main.css` imports the report layer's `report.css`. The print styles come
   * last so they win over screen rules of the same specificity. Resolved from
   * here, because under pnpm the project cannot resolve the report package. */
  css: [
    join(dir, 'app/assets/css/main.css'),
    require.resolve('@focusring/wcagify-reporter/print.css')
  ],

  runtimeConfig: {
    weasyprintUrl: 'https://magnificent-encouragement-production.up.railway.app'
  },

  content: {
    experimental: {
      sqliteConnector: 'native'
    },
    build: {
      markdown: {
        highlight: {
          /* Every token colour must reach 4.5:1 on the code background (WCAG 1.4.3)
           * while the token classes stay visibly different. No bundled light theme
           * does both: github-light-high-contrast passes but renders nearly
           * monochrome, and colourful ones fail (github-light: variables 3.34:1,
           * material-theme-lighter: strings 2.18:1). So the light theme is
           * github-light with four colours darkened to pass on the light `bg-muted`
           * (slate-50) and on the #f3f4f6 PDF background; see highlight/. Nuxt Content
           * and @nuxtjs/mdc accept a theme object wherever a theme name is allowed.
           * github-dark-default passes as is on the dark `bg-muted` (slate-800).
           * `default` doubles as the theme for pages rendered without a colour-mode
           * class, such as the server-rendered HTML the PDF export is built from. */
          theme: {
            default: githubLightA11y,
            light: githubLightA11y,
            dark: 'github-dark-default'
          }
        }
      }
    }
  },

  icon: {
    customCollections: [
      {
        prefix: 'logo',
        dir: join(dir, 'app/assets/logo')
      }
    ]
  },

  vite: {
    optimizeDeps: {
      exclude: [
        'axe-core',
        'remark-gfm',
        'remark-emoji',
        'remark-mdc',
        'remark-rehype',
        'rehype-raw',
        'parse5',
        'unist-util-visit',
        'unified'
      ]
    }
  },

  i18n: {
    baseUrl: process.env.NUXT_PUBLIC_SITE_URL || '',
    defaultLocale: 'en',
    strategy: 'no_prefix',
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
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root'
    }
  }
}

export default nuxtConfig
