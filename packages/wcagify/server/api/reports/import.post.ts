import { writeFile, access, mkdir, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { toSlug, buildIssueFrontmatter, buildReportFrontmatter } from '@focusring/wcagify'
import { parseEarl } from '@focusring/wcagify/earl'
import type { ParsedIssue } from '@focusring/wcagify/earl'

const MAX_BODY_BYTES = 5 * 1024 * 1024
const MAX_SLUG_COLLISIONS = 100
const SLUG_PATTERN = /^[a-z0-9]+(?:[-/][a-z0-9]+)*$/

async function resolveFreshSlug(baseSlug: string): Promise<string> {
  let candidate = baseSlug
  for (let counter = 1; counter <= MAX_SLUG_COLLISIONS; counter++) {
    const { filepath: dir } = resolveSecurePath(['content', 'reports'], candidate)
    try {
      await access(dir)
      candidate = `${baseSlug}-${counter + 1}`
    } catch {
      return candidate
    }
  }
  throw createError({ statusCode: 409, statusMessage: 'Too many reports with similar title' })
}

async function resolveFreshIssueFilename(
  dir: string,
  base: string,
  existing: Set<string>
): Promise<string> {
  let counter = 1
  while (counter <= MAX_SLUG_COLLISIONS) {
    const filename = counter === 1 ? `${base}.md` : `${base}-${counter}.md`
    if (!existing.has(filename)) return filename
    counter++
  }
  throw createError({
    statusCode: 409,
    statusMessage: `Too many issues with similar slug "${base}"`
  })
  void dir
}

async function writeIssues(
  reportDir: string,
  issues: ParsedIssue[],
  seeded: string[] = []
): Promise<string[]> {
  const existing = new Set(seeded)
  const written: string[] = []
  for (const issue of issues) {
    const base = toSlug(issue.title) || toSlug(`issue-${issue.sc}`) || 'issue'
    const filename = await resolveFreshIssueFilename(reportDir, base, existing)
    existing.add(filename)
    const yaml = buildIssueFrontmatter({
      title: issue.title,
      sc: issue.sc,
      severity: issue.severity,
      type: issue.type,
      difficulty: issue.difficulty,
      sample: issue.sample
    })
    await writeFile(join(reportDir, filename), `${yaml}\n`, { encoding: 'utf8', flag: 'wx' })
    written.push(filename)
  }
  return written
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const targetSlug = typeof query.target === 'string' ? query.target : undefined

  if (targetSlug !== undefined && !SLUG_PATTERN.test(targetSlug)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid target slug' })
  }

  const raw = await readRawBody(event, 'utf8')
  if (!raw) {
    throw createError({ statusCode: 400, statusMessage: 'Empty request body' })
  }
  if (Buffer.byteLength(raw) > MAX_BODY_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'Import file too large (max 5 MB)' })
  }

  const doc: unknown = (() => {
    try {
      return JSON.parse(raw)
    } catch {
      throw createError({ statusCode: 400, statusMessage: 'File is not valid JSON' })
    }
  })()

  const parsed = (() => {
    try {
      return parseEarl(doc)
    } catch (error) {
      throw createError({
        statusCode: 400,
        statusMessage: error instanceof Error ? error.message : 'Failed to parse EARL document'
      })
    }
  })()

  const { report, issues, warnings, format } = parsed

  if (targetSlug) {
    const { filepath: reportDir } = resolveSecurePath(['content', 'reports'], targetSlug)
    try {
      await access(reportDir)
    } catch {
      throw createError({
        statusCode: 404,
        statusMessage: `Report "${targetSlug}" not found`
      })
    }
    const existingFiles = await readdir(reportDir)
    const written = await writeIssues(reportDir, issues, existingFiles)

    return {
      success: true,
      mode: 'merge',
      format,
      slug: targetSlug,
      reportPath: `/reports/${targetSlug}`,
      issueCount: written.length,
      warnings
    }
  }

  const baseSlug = toSlug(report.title || 'imported-evaluation') || 'imported-evaluation'
  const slug = await resolveFreshSlug(baseSlug)
  const { filepath: reportDir } = resolveSecurePath(['content', 'reports'], slug)

  await mkdir(reportDir, { recursive: true })

  const frontmatter = buildReportFrontmatter({
    title: report.title,
    language: report.language,
    evaluation: report.evaluation,
    scope: report.scope,
    baseline: report.baseline,
    technologies: report.technologies,
    sample: report.sample,
    scStatuses: Object.keys(report.scStatuses).length > 0 ? report.scStatuses : undefined
  })
  await writeFile(join(reportDir, 'index.md'), `${frontmatter}\n`, { encoding: 'utf8', flag: 'wx' })

  const written = await writeIssues(reportDir, issues)

  return {
    success: true,
    mode: 'create',
    format,
    slug,
    reportPath: `/reports/${slug}`,
    issueCount: written.length,
    warnings
  }
})
