import { defineContentConfig } from '@nuxt/content'
import { defineWcagifyCollections } from 'wcagify/content'

const reportsCwd = new URL('reports', import.meta.url).pathname

export default defineContentConfig({
  collections: defineWcagifyCollections(reportsCwd)
})
