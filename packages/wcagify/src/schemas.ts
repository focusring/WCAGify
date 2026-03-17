import { z } from 'zod'

const evaluationSchema = z.object({
  evaluator: z.string(),
  commissioner: z.string(),
  target: z.string(),
  targetLevel: z.string(),
  targetWcagVersion: z.string(),
  date: z.string(),
  specialRequirements: z.string()
})

const samplePageSchema = z.object({
  title: z.string(),
  id: z.string(),
  url: z.string(),
  description: z.string()
})

const scStatusSchema = z.enum(['passed', 'not-present'])

const reportSchema = z.object({
  language: z.enum(['nl', 'en']),
  evaluation: evaluationSchema,
  scope: z.array(z.string()),
  outOfScope: z.array(z.string()).optional(),
  baseline: z.array(z.string()),
  technologies: z.array(z.string()),
  sample: z.array(samplePageSchema),
  scStatuses: z.record(z.string(), scStatusSchema).optional()
})

const issueSchema = z.object({
  sc: z.string(),
  severity: z.enum(['Low', 'Medium', 'High']),
  type: z.enum(['Content', 'Technical', 'Design', 'Unknown']).optional(),
  difficulty: z.enum(['Low', 'Medium', 'High']),
  sample: z.string()
})

export { evaluationSchema, samplePageSchema, reportSchema, issueSchema }
