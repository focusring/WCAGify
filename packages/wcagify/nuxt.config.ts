import { fileURLToPath } from 'node:url'

const dir = fileURLToPath(new URL('.', import.meta.url))

const hasStudioRepoInfo = Boolean(
  (process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG) ||
  process.env.NETLIFY ||
  process.env.NODE_ENV !== 'production'
)

const nuxtConfig = {
  modules: [
    '@nuxt/ui',
    '@nuxt/content',
    '@nuxtjs/i18n',
    ...(hasStudioRepoInfo ? ['nuxt-studio' as const] : []),
    '@nuxt/a11y',
    '@focusring/wcagify/nuxt'
  ],

  css: [`${dir}/app/assets/css/main.css`, `${dir}/print.css`],

  runtimeConfig: {
    weasyprintUrl: 'https://magnificent-encouragement-production.up.railway.app'
  },

  content: {
    experimental: {
      sqliteConnector: 'native'
    }
  },

  icon: {
    customCollections: [
      {
        prefix: 'logo',
        dir: `${dir}/app/assets/logo`
      }
    ]
  },

  // CJS packages used by nuxt-studio that lack ESM default exports, breaking Vite's @fs serving in the layer architecture
  alias: {
    extend: `${dir}/shims/extend-esm.js`,
    debug: `${dir}/shims/debug-esm.js`
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
