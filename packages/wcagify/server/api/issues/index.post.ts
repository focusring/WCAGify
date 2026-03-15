import { writeFile, access } from 'node:fs/promises'
import { join } from 'node:path'
import { z } from 'zod'
import { issueSchema, toSlug, buildIssueFrontmatter } from '@focusring/wcagify'

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const createIssueSchema = issueSchema.extend({
  report: z.string().regex(SLUG_PATTERN, 'Invalid report slug'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().max(100_000).optional()
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const result = createIssueSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues.map((i) => i.message).join(', ')
    })
  }

  const { report, title, sc, severity, difficulty, sample, description } = result.data

  const { filepath: reportDir } = resolveSecurePath(['content', 'reports'], report)

  try {
    await access(reportDir)
  } catch {
    throw createError({ statusCode: 404, statusMessage: `Report "${report}" not found` })
  }

  const slug = toSlug(title)
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Title produces empty slug' })
  }

  const frontmatter = buildIssueFrontmatter({ title, sc, severity, difficulty, sample })

  const content = description ? `${frontmatter}\n\n${description}\n` : `${frontmatter}\n`

  let filename = `${slug}.md`
  let filepath = join(reportDir, filename)

  const MAX_COLLISIONS = 100
  let counter = 1
  while (true) {
    try {
      await writeFile(filepath, content, { encoding: 'utf8', flag: 'wx' })
      break
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        'code' in err &&
        (err as NodeJS.ErrnoException).code === 'EEXIST'
      ) {
        counter++
        if (counter > MAX_COLLISIONS) {
          throw createError({
            statusCode: 409,
            statusMessage: 'Too many issues with similar title'
          })
        }
        filename = `${slug}-${counter}.md`
        filepath = join(reportDir, filename)
      } else {
        throw err
      }
    }
  }

  return {
    success: true,
    path: `content/reports/${report}/${filename}`
  }
})
