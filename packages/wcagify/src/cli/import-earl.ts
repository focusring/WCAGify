#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { parseEarlReport } from '../earl/parse'
import { writeImportedReport } from '../earl/write'
import { toSlug } from '../content-utils'

const USAGE = `Usage: wcagify-import-earl <file.jsonld> [options]

Imports an EARL (JSON-LD) evaluation as a WCAGify report.

Options:
  --slug <slug>         Report slug (directory under content/reports). Defaults to a slug of the title.
  --merge               Merge issues and outcomes into an existing report instead of creating one.
  --content-dir <dir>   Content directory (default: content).
  --language <en|nl>    Language of the created report (default: from the document, else en).
  --dry-run             Parse and report what would be written without writing.
  --json                Print the result as JSON (for scripts and agents).
  --help                Show this help.

Examples:
  wcagify-import-earl audit.jsonld --slug my-audit
  wcagify-import-earl axe-results.json --slug my-audit --merge --json`

function fail(message: string, asJson: boolean): never {
  if (asJson) {
    console.log(JSON.stringify({ ok: false, error: message }))
  } else {
    console.error(message)
  }
  process.exit(1)
}

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    slug: { type: 'string' },
    merge: { type: 'boolean', default: false },
    'content-dir': { type: 'string', default: 'content' },
    language: { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
    json: { type: 'boolean', default: false },
    help: { type: 'boolean', default: false }
  }
})

const asJson = values.json === true

if (values.help || positionals.length === 0) {
  console.log(USAGE)
  process.exit(values.help ? 0 : 1)
}

const [file] = positionals
if (values.language && values.language !== 'en' && values.language !== 'nl') {
  fail('Invalid language. Use en or nl.', asJson)
}
const language = values.language as 'en' | 'nl' | undefined

const filePath = resolve(process.cwd(), file!)
const source = await readFile(filePath, 'utf8').catch((error: Error) =>
  fail(`Could not read ${file}: ${error.message}`, asJson)
)
let document: unknown = undefined
try {
  document = JSON.parse(source)
} catch (error) {
  fail(`Could not read ${file}: ${(error as Error).message}`, asJson)
}

try {
  const imported = await parseEarlReport(document, { language })
  const slug = values.slug ?? toSlug(imported.report.title)
  const summary = {
    slug,
    title: imported.report.title,
    wcagVersion: imported.report.evaluation.targetWcagVersion,
    targetLevel: imported.report.evaluation.targetLevel,
    samples: imported.report.sample.length,
    issues: imported.issues.length,
    passed: imported.report.scStatuses.passed.length,
    notPresent: imported.report.scStatuses['not-present'].length,
    warnings: imported.warnings
  }

  if (values['dry-run']) {
    if (asJson) {
      console.log(JSON.stringify({ ok: true, dryRun: true, ...summary }, undefined, 2))
    } else {
      console.log(`Would ${values.merge ? 'merge into' : 'create'} report "${slug}":`)
      console.log(
        `  ${summary.issues} issue(s), ${summary.passed} passed, ${summary.notPresent} not present, ${summary.samples} sample(s)`
      )
      for (const warning of imported.warnings) console.log(`  warning: ${warning}`)
    }
    process.exit(0)
  }

  const result = await writeImportedReport(imported, {
    contentDir: resolve(process.cwd(), values['content-dir']!),
    slug,
    mode: values.merge ? 'merge' : 'create'
  })

  if (asJson) {
    console.log(JSON.stringify({ ok: true, ...summary, ...result }, undefined, 2))
  } else {
    console.log(
      `${result.mode === 'merge' ? 'Merged into' : 'Created'} report at ${values['content-dir']}/${result.reportDir}`
    )
    console.log(
      `  ${result.issuesWritten} issue(s) written, ${summary.passed} passed, ${summary.notPresent} not present`
    )
    for (const warning of result.warnings) console.log(`  warning: ${warning}`)
  }
} catch (error) {
  fail((error as Error).message, asJson)
}
