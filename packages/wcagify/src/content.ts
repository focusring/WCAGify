import { defineCollection } from '@nuxt/content'
import { z } from 'zod'
import { reportSchema, issueSchema } from './schemas'

// Nuxt Content's dev watcher opens every file under a source's base folder, included or not.
// Excluding the audit notes from each source keeps a large audit from exhausting file handles.
const evaluatorNotes = ['**/.notes', '**/.notes/**']

function defineWcagifyCollections() {
  return {
    reports: defineCollection({
      type: 'page' as const,
      source: {
        include: 'reports/**/index.md',
        exclude: evaluatorNotes,
        prefix: '/reports'
      },
      schema: reportSchema
    }),
    issues: defineCollection({
      type: 'page' as const,
      source: {
        include: 'reports/**/*.md',
        exclude: ['reports/**/index.md', ...evaluatorNotes],
        prefix: '/reports'
      },
      schema: issueSchema
    }),
    navigation: defineCollection({
      type: 'data' as const,
      source: {
        include: '**/.navigation.yml',
        exclude: evaluatorNotes
      },
      schema: z.object({
        title: z.string().optional(),
        icon: z.string().optional()
      })
    })
  }
}

export { defineWcagifyCollections }
