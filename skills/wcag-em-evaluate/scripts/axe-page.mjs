#!/usr/bin/env node
/*
 * Runs axe-core on the page that is open in the agent-browser session and records the result
 * for one sample state of a WCAGify report.
 *
 *   node axe-page.mjs --report content/reports/<slug> --sample page-3 [--state cookie-dialog]
 *   node axe-page.mjs --report content/reports/<slug> --summary          # re-print all results
 *
 * The report's index.md gives the target level and WCAG version, which select the axe tags.
 * The full `agent-browser a11y --json` result is written to
 * .notes/audit/axe/<sample>[--<state>].json, and one line per success criterion is printed:
 * `fail` for violations (certainty 100), `review` for incomplete results that need a manual step.
 * The session comes from AGENT_BROWSER_SESSION or --session. Exit code 1 only on a tool error;
 * violations are results, not errors.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { parseArgs } from 'node:util'

const { values } = parseArgs({
  options: {
    report: { type: 'string' },
    sample: { type: 'string' },
    state: { type: 'string' },
    session: { type: 'string' },
    selector: { type: 'string' },
    summary: { type: 'boolean' }
  }
})

if (!values.report || (!values.summary && !values.sample)) {
  console.error(
    'Usage: axe-page.mjs --report <report-dir> --sample <id> [--state <slug>] [--session <name>] [--selector <css>]\n       axe-page.mjs --report <report-dir> --summary'
  )
  process.exit(1)
}

const reportDir = statSync(values.report).isDirectory()
  ? resolve(values.report)
  : dirname(resolve(values.report))
const indexPath = join(reportDir, 'index.md')
const axeDir = join(reportDir, '.notes', 'audit', 'axe')

function frontmatter(path) {
  const match = readFileSync(path, 'utf8').match(/^---\r?\n(?<yaml>[\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!match) throw new Error(`${path}: no frontmatter`)
  return match.groups.yaml
}
const yaml = frontmatter(indexPath)
const targetLevel =
  yaml.match(/^\s*targetLevel:\s*['"]?(?<level>A{1,3})['"]?/m)?.groups.level ?? 'AA'
const targetVersion =
  yaml.match(/^\s*targetWcagVersion:\s*['"]?(?<version>2\.[012])['"]?/m)?.groups.version ?? '2.2'

function tagsFor(level, version) {
  const levels = { A: ['a'], AA: ['a', 'aa'], AAA: ['a', 'aa', 'aaa'] }[level]
  const tags = levels.map((l) => `wcag2${l}`)
  if (version !== '2.0') tags.push(...levels.filter((l) => l !== 'aaa').map((l) => `wcag21${l}`))
  if (version === '2.2' && level !== 'A') tags.push('wcag22aa')
  return tags
}
const tags = tagsFor(targetLevel, targetVersion)

const slug = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

function criterionOf(tag) {
  const m = tag.match(/^wcag(?<p>\d)(?<g>\d)(?<n>\d{1,2})$/)
  return m ? `${m.groups.p}.${m.groups.g}.${m.groups.n}` : undefined
}
const bySc = (a, b) => a.localeCompare(b, undefined, { numeric: true })

function summarize(result) {
  const lines = new Map()
  const add = (kind, rule) => {
    for (const sc of new Set(rule.tags.map(criterionOf).filter(Boolean))) {
      if (!lines.has(sc)) lines.set(sc, { fail: [], review: [] })
      const entry = lines.get(sc)
      entry[kind].push(`${rule.id} (${rule.nodeCount} node${rule.nodeCount === 1 ? '' : 's'})`)
    }
  }
  for (const rule of result.violations ?? []) add('fail', rule)
  for (const rule of result.incomplete ?? []) add('review', rule)
  const out = []
  for (const sc of [...lines.keys()].toSorted(bySc)) {
    const { fail, review } = lines.get(sc)
    if (fail.length) out.push(`${sc}\tfail\t${fail.join(', ')}`)
    if (review.length) out.push(`${sc}\treview\t${review.join(', ')}`)
  }
  return out
}

function printFile(path) {
  const saved = JSON.parse(readFileSync(path, 'utf8'))
  const { meta, result } = saved
  const c = result.counts ?? {}
  console.log(
    `${meta.sample}${meta.state ? ` (${meta.state})` : ''}\t${meta.url}\taxe ${meta.axeVersion}\tviolations ${c.violations ?? 0}, incomplete ${c.incomplete ?? 0}, passes ${c.passes ?? 0}, inapplicable ${c.inapplicable ?? 0}`
  )
  for (const line of summarize(result)) console.log(`  ${line}`)
}

if (values.summary) {
  if (!existsSync(axeDir)) {
    console.log(`no axe results yet in ${axeDir}`)
    process.exit(0)
  }
  for (const name of readdirSync(axeDir)
    .filter((n) => n.endsWith('.json'))
    .toSorted()) {
    printFile(join(axeDir, name))
  }
  process.exit(0)
}

const args = ['a11y', '--json', '--tags', tags.join(',')]
if (values.selector) args.push('--selector', values.selector)
if (values.session) args.push('--session', values.session)

let raw = undefined
try {
  raw = execFileSync('agent-browser', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
} catch (error) {
  console.error(`agent-browser a11y failed: ${error.stderr || error.message}`)
  process.exit(1)
}
let parsed = undefined
try {
  parsed = JSON.parse(raw)
} catch {
  console.error(`agent-browser a11y returned no JSON:\n${raw.slice(0, 500)}`)
  process.exit(1)
}
if (parsed.success === false) {
  console.error(`agent-browser a11y error: ${parsed.error || 'unknown'}`)
  process.exit(1)
}
const result = parsed.data ?? parsed
const meta = {
  sample: values.sample,
  state: values.state ? slug(values.state) : undefined,
  url: result.url,
  date: new Date().toISOString(),
  axeVersion: result.axeVersion,
  targetLevel,
  targetVersion,
  tags,
  selector: values.selector
}
mkdirSync(axeDir, { recursive: true })
const file = join(axeDir, `${values.sample}${meta.state ? `--${meta.state}` : ''}.json`)
writeFileSync(file, `${JSON.stringify({ meta, result }, undefined, 2)}\n`)
console.log(`wrote ${file}`)
printFile(file)
if ((result.violations ?? []).some((rule) => rule.nodeCount > (rule.nodes ?? []).length)) {
  console.log(
    '  note: a rule reports more nodes than it lists (10 max); rerun with --selector <css> to enumerate a subtree'
  )
}
