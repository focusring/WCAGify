import type { NuxtModule } from '@nuxt/schema'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
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

/**
 * The slice of Nuxt Content's config this module sets. Content imports each remark plugin
 * by its key at parse time (Node), and @nuxtjs/mdc bundles it from `src` for its runtime
 * renderer (Vite), so the key is a file URL and `src` the matching path. A function
 * `instance` is avoided because nuxt-studio copies this config into runtime config.
 */
interface ContentRemarkPlugins {
  content?: {
    build?: {
      markdown?: {
        remarkPlugins?: Record<string, false | { src?: string; options?: object }>
      }
    }
  }
}

/** Sibling plugin file: `.ts` next to this source file, `.js` next to the built module. */
const remarkCodeLangUrl = new URL(
  import.meta.url.endsWith('.ts') ? './remark-code-lang.ts' : './remark-code-lang.js',
  import.meta.url
)

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

    /*
     * Reports mostly quote code in indented blocks or bare fences with no language, which
     * Shiki leaves as one-colour text. Guess html/css/js/json for those so they are
     * highlighted like labelled blocks. Blocks that declare a language are left alone.
     */
    const contentOptions = nuxt.options as typeof nuxt.options & ContentRemarkPlugins
    contentOptions.content ||= {}
    contentOptions.content.build ||= {}
    contentOptions.content.build.markdown ||= {}
    contentOptions.content.build.markdown.remarkPlugins ||= {}
    contentOptions.content.build.markdown.remarkPlugins[remarkCodeLangUrl.href] ||= {
      src: fileURLToPath(remarkCodeLangUrl),
      options: {}
    }

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
