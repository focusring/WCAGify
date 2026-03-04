const dir = new URL('.', import.meta.url).pathname

const nuxtConfig = {
  modules: [
    '@nuxt/ui',
    '@nuxt/content',
    '@nuxtjs/i18n',
    '@nuxt/icon',
    'nuxt-studio',
    'wcagify/nuxt'
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

  routeRules: {
    '/': { prerender: true }
  },

  i18n: {
    defaultLocale: 'nl',
    strategy: 'prefix_except_default',
    locales: [
      {
        code: 'nl',
        name: 'Nederlands',
        language: 'nl-NL'
      },
      {
        code: 'en',
        name: 'English',
        language: 'en-US'
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
