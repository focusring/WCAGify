import { defineCollection } from '@nuxt/content'
import { z } from 'zod'
import { reportSchema, issueSchema } from './schemas'

function defineWcagifyCollections() {
  return {
    reports: defineCollection({
      type: 'page' as const,
      source: {
        include: 'reports/**/index.md',
        prefix: '/reports'
      },
      schema: reportSchema
    }),
    issues: defineCollection({
      type: 'page' as const,
      source: {
        include: 'reports/**/*.md',
        exclude: ['reports/**/index.md', 'reports/**/.notes/**'],
        prefix: '/reports'
      },
      schema: issueSchema
    }),
    navigation: defineCollection({
      type: 'data' as const,
      source: {
        include: '**/.navigation.yml'
      },
      schema: z.object({
        title: z.string().optional(),
        icon: z.string().optional()
      })
    })
  }
}

export { defineWcagifyCollections }
