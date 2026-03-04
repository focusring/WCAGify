import { defineCollection } from '@nuxt/content'
import { reportSchema, issueSchema } from './schemas'

const contentSources = {
  reports: {
    include: '**/index.md',
    prefix: '/reports'
  },
  issues: {
    include: '**/*.md',
    exclude: ['**/index.md'],
    prefix: '/reports'
  }
}

function defineWcagifyCollections(reportsCwd: string) {
  return {
    reports: defineCollection({
      type: 'page' as const,
      source: { ...contentSources.reports, cwd: reportsCwd },
      schema: reportSchema
    }),
    issues: defineCollection({
      type: 'page' as const,
      source: { ...contentSources.issues, cwd: reportsCwd },
      schema: issueSchema
    })
  }
}

export { contentSources, defineWcagifyCollections }
