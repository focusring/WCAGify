#!/usr/bin/env node
import { mkdir, writeFile, access } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { slugPattern, generateReportMarkdown } from './report-template'

const { positionals } = parseArgs({ allowPositionals: true })
const [slug] = positionals

if (!slug) {
  console.error('Usage: wcagify-new-report <slug>')
  console.error('Example: wcagify-new-report my-audit-report')
  process.exit(1)
}

if (!slugPattern.test(slug)) {
  console.error('Invalid slug. Use only lowercase letters, numbers, and hyphens.')
  process.exit(1)
}

const contentDir = resolve(process.cwd(), 'content', 'reports', slug)

try {
  await access(contentDir)
  console.error(`A report with slug "${slug}" already exists.`)
  process.exit(1)
} catch (error: unknown) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
}

await mkdir(contentDir, { recursive: true })
await writeFile(join(contentDir, 'index.md'), generateReportMarkdown(slug), 'utf8')

console.log(`Created new report at content/reports/${slug}/index.md`)
