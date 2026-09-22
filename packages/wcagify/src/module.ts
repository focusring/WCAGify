import type { NuxtModule } from '@nuxt/schema'
import { join } from 'node:path'
import { defineNuxtModule } from '@nuxt/kit'

/**
 * The slice of Nitro's config this module sets. `nitropack` is not a dependency of this
 * package, so its augmentation of `NuxtOptions` is not in scope here; this describes only
 * the one field we touch.
 */
interface NitroServerAssets {
  nitro?: {
    serverAssets?: { baseName: string; dir: string }[]
  }
}

const module: NuxtModule = defineNuxtModule({
  meta: {
    name: 'wcagify',
    configKey: 'wcagify'
  },
  setup(_options, nuxt) {
    /*
     * Issue evidence lives in `<app>/uploads`, deliberately outside `public/`: these are
     * screenshots of the audited site and must stay behind the app's auth rather than be
     * served as static files. Registering the directory as a server asset bundles it into
     * the build so `/api/uploads/**` can read it on a serverless host, where `public/` is
     * not on the server's filesystem at all.
     */
    const options = nuxt.options as typeof nuxt.options & NitroServerAssets
    options.nitro ||= {}
    options.nitro.serverAssets ||= []
    options.nitro.serverAssets.push({
      baseName: 'uploads',
      dir: join(nuxt.options.rootDir, 'uploads')
    })

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
