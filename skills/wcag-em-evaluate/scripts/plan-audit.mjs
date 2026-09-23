#!/usr/bin/env node
/*
 * Builds and maintains the work plan of a WCAG-EM Step 4 evaluation for one WCAGify report.
 *
 *   node plan-audit.mjs <report-dir>                       # create or refresh the plan, print it
 *   node plan-audit.mjs <report-dir> --unit page-3/keyboard # print one unit's brief
 *   node plan-audit.mjs <report-dir> --done page-3/keyboard [--note "..."]
 *   node plan-audit.mjs <report-dir> --skip page-3/media --note "no media on this sample"
 *   node plan-audit.mjs <report-dir> --reset page-3/keyboard
 *
 * The plan is `.notes/audit/plan.json` (source of truth) rendered to `.notes/audit/plan.md`.
 * A unit is one context session of work: `recon` per sample (axe + probes), one group pass per
 * sample, `consistency` once per report, `process/<name>` per complete process. Units that
 * already exist keep their status when the plan is refreshed; new samples add new units.
 */
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { fileURLToPath } from 'node:url'

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    unit: { type: 'string' },
    done: { type: 'string' },
    skip: { type: 'string' },
    reset: { type: 'string' },
    note: { type: 'string' }
  }
})

const [target] = positionals
if (!target) {
  console.error(
    'Usage: plan-audit.mjs <report-dir> [--unit <id> | --done <id> | --skip <id> | --reset <id>] [--note <text>]'
  )
  process.exit(1)
}

const reportDir = statSync(target).isDirectory() ? resolve(target) : dirname(resolve(target))
const indexPath = join(reportDir, 'index.md')
const auditDir = join(reportDir, '.notes', 'audit')
const planJson = join(auditDir, 'plan.json')
const planMd = join(auditDir, 'plan.md')
const skillDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const criteria = JSON.parse(readFileSync(join(skillDir, 'scripts', 'criteria.json'), 'utf8'))

const text = readFileSync(indexPath, 'utf8')
const match = text.match(/^---\r?\n(?<yaml>[\s\S]*?)\r?\n---(?:\r?\n|$)/)
if (!match) {
  console.error(`${indexPath}: no frontmatter`)
  process.exit(1)
}
const { yaml } = match.groups
function field(name, fallback) {
  const found = yaml.match(new RegExp(`^\\s*${name}:\\s*['"]?(?<value>[^'"\\n]+)['"]?`, 'm'))
  return found ? found.groups.value.trim() : fallback
}
const targetLevel = field('targetLevel', 'AA')
const targetVersion = field('targetWcagVersion', '2.2')
const language = field('language', 'en')
const title = field('title', reportDir.split('/').pop())

// Samples: parse the `sample:` list items (title, id, url, description) from the YAML text.
const samples = []
const sampleBlock = yaml.match(/^sample:\s*\n(?<block>[\s\S]*?)(?=^\S)/m)?.groups.block ?? ''
for (const item of sampleBlock.split(/^\s*-\s+(?=\w)/m).slice(1)) {
  const get = (key) =>
    item
      .match(new RegExp(`^\\s*${key}:\\s*(?<value>.+)$`, 'm'))
      ?.groups.value.trim()
      .replace(/^'(?<inner>.*)'$/s, '$<inner>')
      .replace(/''/g, "'")
      .replace(/^"(?<inner>.*)"$/s, '$<inner>')
  const id = get('id')
  if (id)
    samples.push({
      id,
      title: get('title'),
      url: get('url'),
      description: get('description') || ''
    })
}
if (samples.length === 0) {
  console.error(`${indexPath}: no samples with an id found`)
  process.exit(1)
}

const versionOrder = ['2.0', '2.1', '2.2']
const levelOrder = ['A', 'AA', 'AAA']
const inScope = (c) =>
  versionOrder.indexOf(c.since) <= versionOrder.indexOf(targetVersion) &&
  levelOrder.indexOf(c.level) <= levelOrder.indexOf(targetLevel) &&
  !(c.obsolete && targetVersion === '2.2')
const scoped = criteria.filter(inScope)
const groupsOrder = ['structure', 'keyboard', 'visual', 'motion', 'pointer', 'forms', 'media']
const criteriaOf = (group) =>
  scoped.filter((c) => c.group === group || c.also.includes(group)).map((c) => c.sc)

// Complete processes: sample descriptions of the form "<process>, step n/m: ...".
const processes = new Map()
for (const s of samples) {
  const m = s.description.match(/^(?<name>.+?),\s*(?:step|stap)\s+(?<step>\d+)\/(?<of>\d+):/i)
  if (!m) continue
  const name = m.groups.name.trim()
  if (!processes.has(name)) processes.set(name, { name, steps: [] })
  processes
    .get(name)
    .steps.push({ sample: s.id, step: Number(m.groups.step), of: Number(m.groups.of) })
}
const slugOf = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const units = []
for (const s of samples) {
  units.push({ id: `${s.id}/recon`, kind: 'recon', sample: s.id, criteria: [] })
  for (const group of groupsOrder) {
    const list = criteriaOf(group)
    if (list.length)
      units.push({ id: `${s.id}/${group}`, kind: 'group', group, sample: s.id, criteria: list })
  }
}
units.push({ id: 'consistency', kind: 'consistency', criteria: criteriaOf('consistency') })
for (const p of processes.values()) {
  units.push({
    id: `process/${slugOf(p.name)}`,
    kind: 'process',
    process: p.name,
    steps: p.steps.toSorted((a, b) => a.step - b.step),
    criteria: []
  })
}
units.push({ id: 'compare', kind: 'compare', criteria: [] })

// Merge with the existing plan: statuses and notes survive a refresh.
let plan = {
  report: title,
  reportDir,
  targetLevel,
  targetVersion,
  language,
  created: new Date().toISOString(),
  units: []
}
if (existsSync(planJson)) plan = JSON.parse(readFileSync(planJson, 'utf8'))
const previous = new Map(plan.units.map((u) => [u.id, u]))
plan.targetLevel = targetLevel
plan.targetVersion = targetVersion
plan.language = language
plan.samples = samples
plan.criteria = scoped.map((c) => c.sc)
plan.units = units.map((u) => ({
  ...u,
  status: previous.get(u.id)?.status ?? 'todo',
  note: previous.get(u.id)?.note,
  finished: previous.get(u.id)?.finished
}))

function setStatus(id, status) {
  const unit = plan.units.find((u) => u.id === id)
  if (!unit) {
    console.error(`no unit "${id}" in the plan`)
    process.exit(1)
  }
  unit.status = status
  unit.finished = status === 'todo' ? undefined : new Date().toISOString()
  unit.note = values.note ?? (status === 'todo' ? undefined : unit.note)
}
if (values.done) setStatus(values.done, 'done')
if (values.skip) setStatus(values.skip, 'skipped')
if (values.reset) setStatus(values.reset, 'todo')

mkdirSync(auditDir, { recursive: true })
writeFileSync(planJson, `${JSON.stringify(plan, undefined, 2)}\n`)

const sampleOf = (id) => samples.find((s) => s.id === id)
const describe = (u) => {
  if (u.kind === 'recon') return `axe on the initial state, all probes, states inventory`
  if (u.kind === 'group') return `${u.group}: ${u.criteria.join(', ')}`
  if (u.kind === 'consistency') return `across all samples: ${u.criteria.join(', ')}`
  if (u.kind === 'process')
    return `${u.process}: ${u.steps.map((s) => `${s.sample} (step ${s.step}/${s.of})`).join(' → ')}`
  return 'Step 4.3: random samples against the structured set, then consolidation'
}
const rows = plan.units.map(
  (u) =>
    `| \`${u.id}\` | ${u.sample ? `${u.sample} ${sampleOf(u.sample)?.title ?? ''}` : ''} | ${describe(u)} | ${u.status} | ${u.note ?? ''} |`
)
const md = `# Evaluation plan — ${title}

Target: WCAG ${targetVersion} level ${targetLevel} · ${scoped.length} criteria in scope · ${samples.length} samples · report language ${language}.
Source of truth: \`plan.json\` (update it with \`plan-audit.mjs --done|--skip|--reset <unit>\`); this file is rendered from it.

| Unit | Sample | Work | Status | Note |
| --- | --- | --- | --- | --- |
${rows.join('\n')}

Criteria in scope: ${scoped.map((c) => c.sc).join(', ')}
`
writeFileSync(planMd, md)

if (values.unit) {
  const u = plan.units.find((x) => x.id === values.unit)
  if (!u) {
    console.error(`no unit "${values.unit}"`)
    process.exit(1)
  }
  const s = u.sample ? sampleOf(u.sample) : undefined
  const missingFiles = u.criteria.filter(
    (sc) => !existsSync(join(skillDir, 'references', 'criteria', `${sc}.md`))
  )
  if (missingFiles.length)
    console.error(
      `warning: no criterion file for ${missingFiles.join(', ')}; evaluate those from the W3C Understanding document with the same template`
    )
  console.log(
    JSON.stringify(
      {
        ...u,
        sampleTitle: s?.title,
        url: s?.url,
        description: s?.description,
        targetLevel,
        targetVersion,
        language,
        criteriaFiles: u.criteria.map((sc) => `references/criteria/${sc}.md`)
      },
      undefined,
      2
    )
  )
  process.exit(0)
}

const counts = plan.units.reduce((acc, u) => ((acc[u.status] = (acc[u.status] ?? 0) + 1), acc), {})
console.log(`${planMd}`)
console.log(
  `${plan.units.length} units: ${Object.entries(counts)
    .map(([k, v]) => `${v} ${k}`)
    .join(', ')}`
)
for (const u of plan.units.filter((x) => x.status === 'todo')) console.log(`  todo  ${u.id}`)
