import type { NuxtModule } from '@nuxt/schema'
import { defineNuxtModule, createResolver } from '@nuxt/kit'

const module: NuxtModule = defineNuxtModule({
  meta: {
    name: 'wcagify',
    configKey: 'wcagify'
  },
  setup(_options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    nuxt.hook('i18n:registerModule', (register) => {
      register({
        langDir: resolve('../locales'),
        locales: [
          { code: 'nl', file: 'nl.json' },
          { code: 'en', file: 'en.json' }
        ]
      })
    })
  }
})

export default module
