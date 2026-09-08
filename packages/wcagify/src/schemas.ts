import { z } from 'zod'

const evaluationSchema = z.object({
  evaluator: z.string(),
  commissioner: z.string(),
  target: z.string(),
  targetLevel: z.enum(['A', 'AA', 'AAA']),
  targetWcagVersion: z.enum(['2.0', '2.1', '2.2']),
  date: z.string(),
  specialRequirements: z.string()
})

const samplePageSchema = z.object({
  title: z.string(),
  id: z.string(),
  url: z.string(),
  description: z.string()
})

/**
 * Recorded outcomes for success criteria without issues, as lists of
 * criterion numbers. Lists are used instead of a map keyed by criterion
 * because Nuxt Content unflattens dotted keys such as `1.1.1` into nested
 * objects.
 */
const scStatusesSchema = z.object({
  passed: z.array(z.string()).optional(),
  'not-present': z.array(z.string()).optional()
})

const reportSchema = z.object({
  language: z.enum(['nl', 'en']),
  evaluation: evaluationSchema,
  scope: z.array(z.string()),
  outOfScope: z.array(z.string()).optional(),
  baseline: z.array(z.string()),
  technologies: z.array(z.string()),
  sample: z.array(samplePageSchema),
  scStatuses: scStatusesSchema.optional()
})

const issueSchema = z.object({
  sc: z.string(),
  severity: z.enum(['Low', 'Medium', 'High']).optional(),
  type: z.enum(['Content', 'Technical', 'Design', 'Unknown']).optional(),
  difficulty: z.enum(['Low', 'Medium', 'High']).optional(),
  sample: z.string()
})

export { evaluationSchema, samplePageSchema, scStatusesSchema, reportSchema, issueSchema }
