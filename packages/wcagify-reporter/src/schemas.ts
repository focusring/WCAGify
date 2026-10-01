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
 * Criteria with no matching content anywhere in the sample set. WCAG-EM deems
 * those satisfied ("not applicable"). Every other criterion passes unless an
 * issue records a failure against it, so nothing else is authored here.
 *
 * A list is used instead of a map keyed by criterion because Nuxt Content
 * unflattens dotted keys such as `1.1.1` into nested objects. The object is
 * loose so that a legacy map keyed by criterion (`{ '1.2.1': 'not-present' }`)
 * survives parsing and reaches `normalizeScStatuses`, which accepts both
 * shapes.
 */
const scStatusesSchema = z.looseObject({
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
