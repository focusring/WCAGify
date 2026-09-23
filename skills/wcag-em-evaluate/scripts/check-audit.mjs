#!/usr/bin/env node
/*
 * Checks a WCAGify report after (or during) a WCAG-EM Step 4 evaluation.
 *
 *   node check-audit.mjs content/reports/<slug>
 *
 * Report side (failures, exit code 1):
 * - every issue file validates against the report's own `issueSchema`, names a sample that
 *   exists, has exactly one "#### Recommendation" heading after the problem description, and
 *   carries no certainty statement;
 * - every image URL in an issue resolves to a file in uploads/<slug>/ with a name the
 *   serving route accepts;
 * - `scStatuses.not-present` lists only criteria in the target set, none of which has an issue.
 *
 * Evaluation side (warnings, from `.notes/audit/`):
 * - the plan has no unit left in `todo`;
 * - every criterion in scope has an outcome on every sample, read from the "## Outcomes" tables
 *   of `.notes/audit/findings/*.md` (columns: SC, Outcome, Certainty, Evidence);
 * - every fail with certainty ≥ 70 has an issue filed under its criterion, and every criterion
 *   in `not-present` was recorded as not-present on every sample where it was evaluated;
 * - every sample has at least one axe result file.
 * Prints the criterion × sample matrix at the end.
 */
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { basename, dirname, join, resolve } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'

const [target] = process.argv.slice(2)
if (!target) {
  console.error('Usage: check-audit.mjs <path to content/reports/<slug>>')
  process.exit(1)
}
const reportDir = statSync(target).isDirectory() ? resolve(target) : dirname(resolve(target))
const reportSlug = basename(reportDir)
const projectRoot = resolve(reportDir, '..', '..', '..')
const auditDir = join(reportDir, '.notes', 'audit')
const skillDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const criteria = JSON.parse(readFileSync(join(skillDir, 'scripts', 'criteria.json'), 'utf8'))
const failures = []
const warnings = []

function findPackage(from) {
  let dir = from
  for (;;) {
    const candidate = join(dir, 'node_modules', '@focusring', 'wcagify')
    if (existsSync(join(candidate, 'package.json'))) return realpathSync(candidate)
    const parent = dirname(dir)
    if (parent === dir) return undefined
    dir = parent
  }
}
const packageDir = findPackage(reportDir)
if (!packageDir) {
  console.error(
    `No @focusring/wcagify install found above ${reportDir}; run the package manager install first.`
  )
  process.exit(1)
}
const entry = join(packageDir, 'dist', 'index.js')
if (!existsSync(entry)) {
  console.error(`${entry} is missing; build it first (pnpm --filter @focusring/wcagify build).`)
  process.exit(1)
}
const { issueSchema, reportSchema } = await import(pathToFileURL(entry).href)
const requireFromPackage = createRequire(join(packageDir, 'package.json'))
const yaml = await import(pathToFileURL(requireFromPackage.resolve('yaml')).href)
const parseYaml = yaml.parse ?? yaml.default.parse

function split(path) {
  const text = readFileSync(path, 'utf8')
  const match = text.match(/^---\r?\n(?<yaml>[\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!match) throw new Error('no frontmatter block (--- ... ---) at the top of the file')
  return { front: parseYaml(match.groups.yaml) ?? {}, body: text.slice(match[0].length) }
}

// Report frontmatter.
let report = undefined
try {
  report = split(join(reportDir, 'index.md')).front
} catch (error) {
  console.error(`index.md: ${error.message}`)
  process.exit(1)
}
const parsedReport = reportSchema.safeParse(report)
if (!parsedReport.success)
  for (const issue of parsedReport.error.issues)
    failures.push(`index.md ${issue.path.join('.') || '(root)'}: ${issue.message}`)
const targetLevel = report.evaluation?.targetLevel ?? 'AA'
const targetVersion = report.evaluation?.targetWcagVersion ?? '2.2'
const versionOrder = ['2.0', '2.1', '2.2']
const levelOrder = ['A', 'AA', 'AAA']
const scoped = criteria.filter(
  (c) =>
    versionOrder.indexOf(c.since) <= versionOrder.indexOf(targetVersion) &&
    levelOrder.indexOf(c.level) <= levelOrder.indexOf(targetLevel) &&
    !(c.obsolete && targetVersion === '2.2')
)
const scopedIds = new Set(scoped.map((c) => c.sc))
const samples = (report.sample ?? []).map((s) => s.id).filter(Boolean)
const bySc = (a, b) => a.localeCompare(b, undefined, { numeric: true })

// Issues.
const issueFiles = readdirSync(reportDir).filter((n) => n.endsWith('.md') && n !== 'index.md')
const issuesBySc = new Map()
const uploadsDir = join(projectRoot, 'uploads', reportSlug)
const safeName = /^[a-z0-9-]+\.\w+$/
for (const name of issueFiles) {
  let parts = undefined
  try {
    parts = split(join(reportDir, name))
  } catch (error) {
    failures.push(`${name}: ${error.message}`)
    continue
  }
  const { front, body } = parts
  const parsed = issueSchema.safeParse(front)
  if (!parsed.success)
    for (const issue of parsed.error.issues)
      failures.push(`${name}: frontmatter ${issue.path.join('.') || '(root)'}: ${issue.message}`)
  if (!front.title || !String(front.title).trim()) failures.push(`${name}: empty title`)
  if (front.sample && !samples.includes(front.sample))
    failures.push(`${name}: sample "${front.sample}" is not an id in index.md`)
  if (front.sc && front.sc !== 'none') {
    if (!issuesBySc.has(front.sc)) issuesBySc.set(front.sc, [])
    issuesBySc.get(front.sc).push(name)
    if (!scopedIds.has(front.sc))
      warnings.push(
        `${name}: criterion ${front.sc} is outside the target (WCAG ${targetVersion} ${targetLevel}); it counts as a tip, not a failure`
      )
  }
  const headings = body.match(/^#{1,6}\s+(?:Recommendation|Aanbeveling)\s*$/gim) ?? []
  if (headings.length !== 1)
    failures.push(
      `${name}: expected exactly one "#### Recommendation" heading, found ${headings.length}`
    )
  else if (!/^####\s+(?:Recommendation|Aanbeveling)\s*$/m.test(body))
    failures.push(`${name}: the recommendation heading must be level 4`)
  else {
    const before = body
      .slice(0, body.search(/^####\s+(?:Recommendation|Aanbeveling)/m))
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .trim()
    if (!before) failures.push(`${name}: no problem description before the recommendation`)
    const after = body
      .slice(body.search(/^####\s+(?:Recommendation|Aanbeveling)/m))
      .split('\n')
      .slice(1)
      .join('\n')
      .trim()
    if (!after) failures.push(`${name}: the recommendation is empty`)
  }
  if (/\bcertainty\b|\bzekerheid\b|\b\d{1,3}\s?%\s*(?:certain|confidence|zeker)/i.test(body))
    failures.push(`${name}: carries a certainty statement; that belongs in .notes/`)
  for (const m of body.matchAll(/!\[(?<alt>[^\]]*)\]\((?<url>[^)\s]+)\)/g)) {
    const { alt, url } = m.groups
    if (!alt.trim()) failures.push(`${name}: image ${url} has no alt text`)
    const expected = `/api/uploads/${reportSlug}/`
    if (!url.startsWith(expected)) {
      failures.push(`${name}: image ${url} is not served from ${expected}`)
      continue
    }
    const file = url.slice(expected.length)
    if (!safeName.test(file))
      failures.push(
        `${name}: image name "${file}" is not accepted by the serving route ([a-z0-9-]+.ext)`
      )
    if (!existsSync(join(uploadsDir, file)))
      failures.push(`${name}: image ${join('uploads', reportSlug, file)} does not exist`)
  }
  if (!/!\[[^\]]*\]\(/.test(body))
    warnings.push(`${name}: no screenshot or GIF; the skill asks for evidence first in every issue`)
}

// Not present.
const notPresent = Array.isArray(report.scStatuses?.['not-present'])
  ? report.scStatuses['not-present']
  : []
for (const sc of notPresent) {
  if (!scopedIds.has(sc))
    failures.push(
      `scStatuses.not-present: ${sc} is not a criterion of WCAG ${targetVersion} ${targetLevel}`
    )
  if (issuesBySc.has(sc))
    failures.push(
      `scStatuses.not-present: ${sc} is listed as not present but has issues (${issuesBySc.get(sc).join(', ')})`
    )
}

// Evaluation notes.
const outcomes = new Map() // Criterion -> sample -> { outcome, certainty }
const validOutcomes = new Set(['pass', 'fail', 'not-present', 'cannot-tell'])
const findingsDir = join(auditDir, 'findings')
if (!existsSync(auditDir)) {
  warnings.push('.notes/audit/ is missing; no evaluation notes to check')
} else {
  const planPath = join(auditDir, 'plan.json')
  if (!existsSync(planPath)) warnings.push('.notes/audit/plan.json is missing (run plan-audit.mjs)')
  else {
    const plan = JSON.parse(readFileSync(planPath, 'utf8'))
    const todo = plan.units.filter((u) => u.status === 'todo').map((u) => u.id)
    if (todo.length)
      warnings.push(
        `plan: ${todo.length} unit(s) still todo: ${todo.slice(0, 8).join(', ')}${todo.length > 8 ? ', ...' : ''}`
      )
  }
  const axeDir = join(auditDir, 'axe')
  const axeFiles = existsSync(axeDir) ? readdirSync(axeDir).filter((n) => n.endsWith('.json')) : []
  for (const id of samples)
    if (!axeFiles.some((n) => n === `${id}.json` || n.startsWith(`${id}--`)))
      warnings.push(`${id}: no axe result in .notes/audit/axe/`)
  if (existsSync(findingsDir)) {
    for (const name of readdirSync(findingsDir).filter((n) => n.endsWith('.md'))) {
      const text = readFileSync(join(findingsDir, name), 'utf8')
      const [sampleStem] = name.split('--')
      const sampleFromName = sampleStem.replace(/\.md$/, '')
      const section = text.split(/^##\s+Outcomes\s*$/m)[1]?.split(/^##\s/m)[0] ?? ''
      for (const line of section.split('\n')) {
        const cells = line.split('|').map((c) => c.trim())
        if (cells.length < 4 || !/^\d\.\d\.\d{1,2}$/.test(cells[1])) continue
        const [, sc, outcome, certainty] = cells
        let sample = sampleFromName
        const extraSample = cells.at(5)
        if (!samples.includes(sampleFromName) && extraSample && samples.includes(extraSample))
          sample = extraSample
        if (!validOutcomes.has(outcome.toLowerCase())) {
          warnings.push(
            `${name}: outcome "${outcome}" for ${sc} is not pass | fail | not-present | cannot-tell`
          )
          continue
        }
        if (!outcomes.has(sc)) outcomes.set(sc, new Map())
        const prev = outcomes.get(sc).get(sample)
        const cert = Number.parseInt(certainty, 10)
        const rank = { fail: 3, 'cannot-tell': 2, pass: 1, 'not-present': 0 }
        const row = {
          outcome: outcome.toLowerCase(),
          certainty: Number.isNaN(cert) ? undefined : cert,
          file: name
        }
        if (
          !prev ||
          rank[row.outcome] > rank[prev.outcome] ||
          (row.outcome === prev.outcome && (row.certainty ?? 0) > (prev.certainty ?? 0))
        )
          outcomes.get(sc).set(sample, row)
      }
    }
  } else warnings.push('.notes/audit/findings/ is missing; no outcomes recorded yet')

  for (const c of scoped) {
    const perSample = outcomes.get(c.sc) ?? new Map()
    const missing = samples.filter((s) => !perSample.has(s))
    if (c.group === 'consistency' || c.also?.includes?.('consistency')) {
      if (perSample.size === 0) warnings.push(`${c.sc}: no outcome recorded (consistency pass)`)
    } else if (missing.length === samples.length) warnings.push(`${c.sc}: no outcome on any sample`)
    else if (missing.length)
      warnings.push(
        `${c.sc}: no outcome on ${missing.length} sample(s): ${missing.slice(0, 6).join(', ')}${missing.length > 6 ? ', ...' : ''}`
      )
    const fails = [...perSample.entries()].filter(
      ([, e]) => e.outcome === 'fail' && (e.certainty ?? 0) >= 70
    )
    if (fails.length && !issuesBySc.has(c.sc))
      warnings.push(
        `${c.sc}: failed with certainty ≥ 70 on ${fails.map(([s]) => s).join(', ')} but has no issue file`
      )
    const cannot = [...perSample.entries()].filter(([, e]) => e.outcome === 'cannot-tell')
    if (cannot.length)
      warnings.push(
        `${c.sc}: cannot-tell on ${cannot.map(([s]) => s).join(', ')}; settle it with the human or report it as open`
      )
    if (notPresent.includes(c.sc)) {
      const present = [...perSample.entries()].filter(([, e]) => e.outcome !== 'not-present')
      if (present.length)
        failures.push(
          `scStatuses.not-present: ${c.sc} is listed but the notes record ${present.map(([s, e]) => `${e.outcome} on ${s}`).join(', ')}`
        )
    } else if (
      perSample.size &&
      [...perSample.values()].every((e) => e.outcome === 'not-present') &&
      perSample.size === samples.length
    ) {
      warnings.push(
        `${c.sc}: not present on every sample; add it to scStatuses.not-present in index.md`
      )
    }
  }
}

console.log(`${reportDir}`)
console.log(
  `WCAG ${targetVersion} ${targetLevel}: ${scoped.length} criteria in scope, ${samples.length} samples, ${issueFiles.length} issue file(s), ${notPresent.length} not present`
)
const short = (e) =>
  e ? { pass: 'P', fail: 'F', 'not-present': '-', 'cannot-tell': '?' }[e.outcome] : '.'
if (outcomes.size) {
  console.log(`\nSC       ${samples.map((s) => s.replace(/^page-/, 'p')).join(' ')}`)
  for (const c of scoped.toSorted((a, b) => bySc(a.sc, b.sc))) {
    const row = samples
      .map((s) =>
        short(outcomes.get(c.sc)?.get(s)).padEnd(Math.max(2, s.replace(/^page-/, 'p').length))
      )
      .join(' ')
    console.log(`${c.sc.padEnd(8)} ${row}`)
  }
  console.log('P pass · F fail · - not present · ? cannot tell · . no outcome\n')
}
for (const w of warnings) console.log(`warning: ${w}`)
for (const f of failures) console.log(`FAIL: ${f}`)
if (failures.length) {
  console.log(`${failures.length} failure(s)`)
  process.exit(1)
}
console.log('OK')
