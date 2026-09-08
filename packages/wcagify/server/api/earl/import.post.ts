import { z } from 'zod'
import { parseEarlReport, writeImportedReport } from '@focusring/wcagify/earl/import'
import { toSlug } from '@focusring/wcagify'

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const earlObjectSchema = z.record(z.string(), z.unknown())
const earlStringSchema = z.string().min(2)

const bodySchema = z.object({
  /** The EARL document, as an object or a JSON string. */
  earl: z.union([earlObjectSchema, earlStringSchema]),
  slug: z.string().regex(SLUG_PATTERN, 'Invalid report slug').optional(),
  mode: z.enum(['create', 'merge']).default('create'),
  language: z.enum(['en', 'nl']).optional(),
  /** Parse and summarise only; nothing is written. */
  dryRun: z.boolean().default(false)
})

export default defineEventHandler(async (event) => {
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues.map((issue) => issue.message).join(', ')
    })
  }
  const { earl, mode, language, dryRun } = parsed.data

  let document: unknown = earl
  if (typeof earl === 'string') {
    try {
      document = JSON.parse(earl)
    } catch {
      throw createError({ statusCode: 400, statusMessage: 'EARL document is not valid JSON' })
    }
  }

  const imported = await parseEarlReport(document, { language }).catch((error: Error) => {
    throw createError({
      statusCode: 400,
      statusMessage: `Could not read EARL document: ${error.message}`
    })
  })

  const slug = parsed.data.slug ?? toSlug(imported.report.title)
  if (!SLUG_PATTERN.test(slug)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Could not derive a valid slug from the title'
    })
  }

  const summary = {
    slug,
    mode,
    title: imported.report.title,
    wcagVersion: imported.report.evaluation.targetWcagVersion,
    targetLevel: imported.report.evaluation.targetLevel,
    samples: imported.report.sample.length,
    issues: imported.issues.length,
    passed: imported.report.scStatuses.passed.length,
    notPresent: imported.report.scStatuses['not-present'].length,
    warnings: imported.warnings
  }

  if (dryRun) {
    return { ok: true, dryRun: true, ...summary }
  }

  const { dir: contentDir } = resolveSecurePath(['content'], slug)
  try {
    const result = await writeImportedReport(imported, { contentDir, slug, mode })
    return { ok: true, dryRun: false, ...summary, ...result }
  } catch (error) {
    const { message } = error as Error
    const statusCode = /already exists|not found/.test(message) ? 409 : 400
    throw createError({ statusCode, statusMessage: message })
  }
})
