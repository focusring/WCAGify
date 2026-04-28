import { writeFile, access, rename, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { issueSchema, toSlug, buildIssueFrontmatter } from '@focusring/wcagify'

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const UPLOAD_URL_RE = /\/api\/uploads\/([a-f0-9-]+\.webp)/g

const createIssueSchema = issueSchema.extend({
  report: z.string().regex(SLUG_PATTERN, 'Invalid report slug'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().max(100_000).optional()
})

function buildImageName(titleSlug: string, sc: string): string {
  const scSlug = sc.replace(/[^0-9.]+/g, '').replace(/\./g, '-')
  const shortHash = randomUUID().slice(0, 8)
  return `${titleSlug}-${scSlug}-${shortHash}.webp`
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const result = createIssueSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues.map((i) => i.message).join(', ')
    })
  }

  const { report, title, sc, severity, type, difficulty, sample, description } = result.data

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

  // Rename and move uploaded images from flat uploads to report folder
  let finalDescription = description || ''
  if (finalDescription) {
    const { dir: reportUploadsDir } = resolveSecurePath(['public', 'uploads', report], '_')

    await mkdir(reportUploadsDir, { recursive: true })

    const moves: { oldUrl: string; newUrl: string; oldPath: string; newPath: string }[] = []

    for (const match of finalDescription.matchAll(UPLOAD_URL_RE)) {
      const oldFilename = match[1]!
      const newFilename = buildImageName(slug, sc)
      const { filepath: oldPath } = resolveSecurePath(['public', 'uploads'], oldFilename)
      const newPath = join(reportUploadsDir, newFilename)

      moves.push({
        oldUrl: match[0],
        newUrl: `/api/uploads/${report}/${newFilename}`,
        oldPath,
        newPath
      })
    }

    for (const move of moves) {
      try {
        await access(move.oldPath)
        await rename(move.oldPath, move.newPath)
        finalDescription = finalDescription.replace(move.oldUrl, move.newUrl)
      } catch {
        // Image missing — leave URL as-is
      }
    }
  }

  const frontmatter = buildIssueFrontmatter({ title, sc, severity, type, difficulty, sample })

  const content = finalDescription ? `${frontmatter}\n\n${finalDescription}\n` : `${frontmatter}\n`

  let filename = `${slug}.md`
  let filepath = join(reportDir, filename)

  const MAX_COLLISIONS = 100
  let counter = 1
  while (true) {
    try {
      await writeFile(filepath, content, { encoding: 'utf8', flag: 'wx' })
      break
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        'code' in error &&
        (error as NodeJS.ErrnoException).code === 'EEXIST'
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
        throw error
      }
    }
  }

  return {
    success: true,
    path: `content/reports/${report}/${filename}`
  }
})
