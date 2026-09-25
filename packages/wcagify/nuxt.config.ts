import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { githubLightA11y } from './highlight/github-light-a11y'

const dir = fileURLToPath(new URL('.', import.meta.url))

const hasStudioRepoInfo = Boolean(
  (process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG) ||
  process.env.NETLIFY ||
  process.env.NUXT_STUDIO ||
  process.env.NODE_ENV !== 'production'
)

const nuxtConfig = {
  devtools: { enabled: false },

  modules: [
    '@nuxt/ui',
    '@nuxt/content',
    '@nuxtjs/i18n',
    '@nuxt/fonts',
    ...(hasStudioRepoInfo ? ['nuxt-studio' as const] : []),
    '@nuxt/a11y',
    '@focusring/wcagify/nuxt'
  ],

  css: [join(dir, 'app/assets/css/main.css'), join(dir, 'print.css')],

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

  // CJS packages used by nuxt-studio that lack ESM default exports, breaking Vite's @fs serving in the layer architecture
  alias: {
    extend: join(dir, 'shims/extend-esm.js'),
    debug: join(dir, 'shims/debug-esm.js')
  },

  vite: {
    optimizeDeps: {
      include: ['debug'],
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
