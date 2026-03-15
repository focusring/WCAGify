import type { NuxtModule } from '@nuxt/schema'
import { defineNuxtModule } from '@nuxt/kit'

const module: NuxtModule = defineNuxtModule({
  meta: {
    name: 'wcagify',
    configKey: 'wcagify'
  },
  setup(_options, nuxt) {
    if (nuxt.options.dev) {
      nuxt.hook('listen', () => {
        if (!process.env.WCAGIFY_ADMIN_SECRET) {
          console.warn(
            '\x1b[33m[wcagify]\x1b[0m WCAGIFY_ADMIN_SECRET is not set. In production, the app will be locked until this is configured.'
          )
        }
      })
    }
  }
})

export default module
