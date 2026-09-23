#!/usr/bin/env node
/*
 * Checks a WCAGify report after the scope and sample set were written.
 *
 *   node check-report.mjs content/reports/<slug>/index.md
 *
 * Parses the frontmatter, validates it against the `reportSchema` that the
 * report's own @focusring/wcagify install exports, and checks what the schema
 * cannot: unique sample ids, no template placeholders, and every issue in the
 * report directory pointing at a sample that exists. Exit code 1 on any failure.
 *
 * It also warns where the sample set drifts from the skill: samples sharing one
 * address, descriptions carrying evaluator material instead of the client's, and
 * a missing or committed .notes/ directory.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const [target] = process.argv.slice(2)
if (!target) {
  console.error('Usage: check-report.mjs <path to content/reports/<slug>/index.md>')
  process.exit(1)
}

const indexPath = statSync(target).isDirectory()
  ? join(resolve(target), 'index.md')
  : resolve(target)
const reportDir = dirname(indexPath)
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
const { reportSchema } = await import(pathToFileURL(entry).href)
const requireFromPackage = createRequire(join(packageDir, 'package.json'))
const yaml = await import(pathToFileURL(requireFromPackage.resolve('yaml')).href)
const parseYaml = yaml.parse ?? yaml.default.parse

function frontmatterOf(path) {
  const text = readFileSync(path, 'utf8')
  const match = text.match(/^---\r?\n(?<yaml>[\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!match) throw new Error('no frontmatter block (--- ... ---) at the top of the file')
  return parseYaml(match.groups.yaml)
}

function rawFrontmatterOf(path) {
  const match = readFileSync(path, 'utf8').match(/^---\r?\n(?<yaml>[\s\S]*?)\r?\n---(?:\r?\n|$)/)
  return match?.groups.yaml ?? ''
}

function readReport(path) {
  try {
    return frontmatterOf(path)
  } catch (error) {
    console.error(`${path}: ${error.message}`)
    return process.exit(1)
  }
}

const report = readReport(indexPath)

const parsed = reportSchema.safeParse(report)
if (!parsed.success) {
  for (const issue of parsed.error.issues) {
    failures.push(`frontmatter ${issue.path.join('.') || '(root)'}: ${issue.message}`)
  }
}

const samples = Array.isArray(report.sample) ? report.sample : []
const ids = samples.map((sample) => sample?.id).filter(Boolean)
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index)
for (const id of new Set(duplicates)) failures.push(`sample id "${id}" is used more than once`)

const placeholder = /https?:\/\/(?:www\.)?example\.com/i
for (const [index, sample] of samples.entries()) {
  const label = `sample[${index}] (${sample?.id ?? 'no id'})`
  if (placeholder.test(sample?.url ?? ''))
    failures.push(`${label}: template placeholder url "${sample.url}"`)
  if (!sample?.title?.trim()) failures.push(`${label}: empty title`)
  if (!sample?.description?.trim()) failures.push(`${label}: empty description`)
  try {
    const url = new URL(sample?.url)
    if (!/^https?:$/.test(url.protocol))
      warnings.push(`${label}: url is not http(s): ${sample.url}`)
  } catch {
    warnings.push(`${label}: url is not an absolute URL: ${sample?.url}`)
  }
}

// One sample, one address: states sharing an address belong to a single sample.
const urls = samples.map((sample) => sample?.url).filter(Boolean)
const shared = new Set(urls.filter((address, index) => urls.indexOf(address) !== index))
for (const address of shared) {
  const sharing = samples.filter((sample) => sample?.url === address).map((sample) => sample.id)
  warnings.push(
    `${sharing.join(', ')} share the address ${address}; states reached without the address changing belong to one sample`
  )
}

// Descriptions are read by the commissioner; evaluator material belongs in .notes/sample.md.
const evaluatorMaterial = [
  [/aria-[a-z]+|role=|lang=|<[a-z]+>|\b[a-z]+#[A-Za-z][\w-]*/, 'markup or selectors'],
  [/\(\s*[1-3]\.[1-5]\s*\)|\bWCAG-EM\b|\bstep [1-3]\.[1-5]\b/i, 'WCAG-EM requirement numbers'],
  [/\b\d+\.\d+\.\d+\b/, 'version numbers'],
  [
    /\b\d+ (?:headings|links|elements|stylesheets|scripts|inputs|attributes|lists|regions|controls|sources|form controls)\b/i,
    'element counts'
  ]
]
for (const sample of samples) {
  for (const [pattern, what] of evaluatorMaterial) {
    if (pattern.test(sample?.description ?? ''))
      warnings.push(
        `${sample?.id ?? '?'}: description carries ${what}; that belongs in .notes/sample.md`
      )
  }
}

// Each group of samples is opened by its own comment, so the random set stays identifiable.
const frontmatterText = rawFrontmatterOf(indexPath)
const comments = frontmatterText.match(/^\s*#.*$/gm) ?? []
const groups = [
  [/^Random sample|^Willekeurige steekproef/i, /random|willekeurig/i, 'random samples (3.2)'],
  [/\bstep \d+\/\d+/i, /process|proces/i, 'process samples (3.3)']
]
for (const [inDescription, inComment, label] of groups) {
  const present = samples.some((sample) => inDescription.test(sample?.description ?? ''))
  if (present && !comments.some((comment) => inComment.test(comment)))
    warnings.push(
      `the ${label} are not opened by a YAML comment naming them, so the groups run together`
    )
}

const notesDir = join(reportDir, '.notes')
if (!existsSync(join(notesDir, 'sample.md'))) {
  warnings.push('.notes/sample.md is missing; the evaluator notes of the sample set go there')
} else {
  try {
    execFileSync('git', ['check-ignore', '-q', notesDir], { cwd: reportDir, stdio: 'ignore' })
  } catch {
    warnings.push('.notes/ is not gitignored; add `.notes` to the project .gitignore')
  }
}

const scope = Array.isArray(report.scope) ? report.scope : []
if (scope.length === 0) failures.push('scope is empty')
for (const item of scope) {
  if (placeholder.test(item)) failures.push(`scope: template placeholder "${item}"`)
}
for (const item of Array.isArray(report.outOfScope) ? report.outOfScope : []) {
  if (placeholder.test(item)) failures.push(`outOfScope: template placeholder "${item}"`)
}
if (!report.evaluation?.target?.trim())
  warnings.push('evaluation.target is empty (WCAG-EM Step 1.1)')
if ((report.technologies ?? []).length === 0)
  failures.push('technologies is empty (WCAG-EM Step 2.4)')

const issueFiles = readdirSync(reportDir).filter(
  (name) => name.endsWith('.md') && name !== 'index.md'
)
for (const name of issueFiles) {
  try {
    const issue = frontmatterOf(join(reportDir, name))
    if (!ids.includes(issue?.sample)) {
      failures.push(`${name}: sample "${issue?.sample}" is not an id in the report's sample list`)
    }
  } catch (error) {
    failures.push(`${name}: ${error.message}`)
  }
}

console.log(`${indexPath}`)
console.log(
  `scope: ${scope.length} item(s), outOfScope: ${(report.outOfScope ?? []).length}, technologies: ${(report.technologies ?? []).length}, sample: ${samples.length}, issues: ${issueFiles.length}`
)
for (const sample of samples)
  console.log(`  ${sample?.id ?? '?'}\t${sample?.title ?? '?'}\t${sample?.url ?? '?'}`)
for (const warning of warnings) console.log(`warning: ${warning}`)
for (const failure of failures) console.log(`FAIL: ${failure}`)
if (failures.length > 0) {
  console.log(`${failures.length} failure(s)`)
  process.exit(1)
}
console.log('OK')
