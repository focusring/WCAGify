import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'
import { toSlug, buildIssueFrontmatter } from '../content-utils'
import type { EarlImport, ImportedIssue, ImportedReport } from './parse'

type ImportMode = 'create' | 'merge'

interface WriteImportOptions {
  /** Directory that holds `reports/`, usually `content`. */
  contentDir: string
  /** Report slug: the directory name under `reports/`. */
  slug: string
  /** `create` a new report directory, or `merge` issues and outcomes into an existing one. */
  mode?: ImportMode
}

interface WriteImportResult {
  mode: ImportMode
  slug: string
  /** Report directory, relative to the content directory. */
  reportDir: string
  /** Files written, relative to the content directory. */
  created: string[]
  /** Files updated, relative to the content directory. */
  updated: string[]
  issuesWritten: number
  warnings: string[]
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/

async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

function sortSc(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true })
}

/** Frontmatter of a report `index.md`, in the key order WCAGify uses. */
function reportFrontmatter(report: ImportedReport): Record<string, unknown> {
  return {
    title: report.title,
    description: report.description,
    language: report.language,
    evaluation: { ...report.evaluation },
    scope: report.scope,
    ...(report.outOfScope.length > 0 ? { outOfScope: report.outOfScope } : {}),
    baseline: report.baseline,
    technologies: report.technologies,
    sample: report.sample,
    scStatuses: {
      passed: report.scStatuses.passed.toSorted(sortSc),
      'not-present': report.scStatuses['not-present'].toSorted(sortSc)
    }
  }
}

function toMarkdown(frontmatter: Record<string, unknown>, body: string): string {
  const yaml = stringifyYaml(frontmatter, { lineWidth: 0, singleQuote: true }).trimEnd()
  const content = body.trim()
  return content ? `---\n${yaml}\n---\n\n${content}\n` : `---\n${yaml}\n---\n`
}

function issueMarkdown(issue: ImportedIssue): string {
  const frontmatter = buildIssueFrontmatter({
    title: issue.title,
    sc: issue.sc,
    severity: issue.severity,
    type: issue.type,
    difficulty: issue.difficulty,
    sample: issue.sample
  })
  const body = issue.body.trim()
  return body ? `${frontmatter}\n\n${body}\n` : `${frontmatter}\n`
}

async function writeIssues(
  issues: ImportedIssue[],
  target: { reportDir: string; relativeDir: string; result: WriteImportResult }
): Promise<void> {
  const { reportDir, relativeDir, result } = target
  const used = new Set<string>()
  for (const issue of issues) {
    const base = toSlug(issue.title) || `issue-${issue.sc.replace(/\./g, '-')}`
    let filename = `${base}.md`
    let counter = 2
    while (used.has(filename) || (await exists(join(reportDir, filename)))) {
      filename = `${base}-${counter++}.md`
    }
    used.add(filename)
    await writeFile(join(reportDir, filename), issueMarkdown(issue), {
      encoding: 'utf8',
      flag: 'wx'
    })
    result.created.push(`${relativeDir}/${filename}`)
    result.issuesWritten++
  }
}

/**
 * Merges imported outcomes into the frontmatter of an existing report.
 * Criteria with imported issues lose any recorded pass; recorded outcomes
 * for other criteria are added; samples referenced by issues are added.
 */
function mergeFrontmatter(
  existing: Record<string, unknown>,
  imported: EarlImport
): Record<string, unknown> {
  const merged = { ...existing }
  const failed = new Set(imported.issues.map((issue) => issue.sc))

  const current = (existing.scStatuses ?? {}) as { passed?: string[]; 'not-present'?: string[] }
  const passed = new Set<string>([...(current.passed ?? []), ...imported.report.scStatuses.passed])
  const notPresent = new Set<string>([
    ...(current['not-present'] ?? []),
    ...imported.report.scStatuses['not-present']
  ])
  for (const sc of failed) {
    passed.delete(sc)
    notPresent.delete(sc)
  }
  for (const sc of passed) notPresent.delete(sc)
  merged.scStatuses = {
    passed: [...passed].toSorted(sortSc),
    'not-present': [...notPresent].toSorted(sortSc)
  }

  const samples = Array.isArray(existing.sample) ? [...(existing.sample as { id: string }[])] : []
  const knownIds = new Set(samples.map((page) => page.id))
  const referenced = new Set(imported.issues.map((issue) => issue.sample))
  for (const page of imported.report.sample) {
    if (referenced.has(page.id) && !knownIds.has(page.id)) {
      samples.push(page)
      knownIds.add(page.id)
    }
  }
  merged.sample = samples

  return merged
}

/**
 * Writes an imported EARL evaluation as WCAGify content: a report
 * `index.md` and one markdown file per issue. In `merge` mode the report
 * must already exist and only its outcomes, samples and issues change.
 */
async function writeImportedReport(
  imported: EarlImport,
  options: WriteImportOptions
): Promise<WriteImportResult> {
  const mode = options.mode ?? 'create'
  const { slug } = options
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error('Invalid slug. Use only lowercase letters, numbers, and hyphens.')
  }

  const contentDir = resolve(options.contentDir)
  const relativeDir = `reports/${slug}`
  const reportDir = join(contentDir, 'reports', slug)
  const indexPath = join(reportDir, 'index.md')
  const result: WriteImportResult = {
    mode,
    slug,
    reportDir: relativeDir,
    created: [],
    updated: [],
    issuesWritten: 0,
    warnings: [...imported.warnings]
  }

  if (mode === 'create') {
    if (await exists(reportDir)) {
      throw new Error(`A report with slug "${slug}" already exists. Use merge mode to add to it.`)
    }
    await mkdir(reportDir, { recursive: true })
    await writeFile(
      indexPath,
      toMarkdown(reportFrontmatter(imported.report), imported.report.summary),
      'utf8'
    )
    result.created.push(`${relativeDir}/index.md`)
  } else {
    if (!(await exists(indexPath))) {
      throw new Error(`Report "${slug}" was not found. Use create mode to create it.`)
    }
    const source = await readFile(indexPath, 'utf8')
    const match = FRONTMATTER_RE.exec(source)
    if (!match) {
      throw new Error(`Report "${slug}" has no frontmatter to merge into.`)
    }
    const existing = (parseYaml(match[1]!) ?? {}) as Record<string, unknown>
    await writeFile(
      indexPath,
      toMarkdown(mergeFrontmatter(existing, imported), match[2] ?? ''),
      'utf8'
    )
    result.updated.push(`${relativeDir}/index.md`)
  }

  await writeIssues(imported.issues, { reportDir, relativeDir, result })
  return result
}

export { writeImportedReport, reportFrontmatter, mergeFrontmatter }
export type { ImportMode, WriteImportOptions, WriteImportResult }
