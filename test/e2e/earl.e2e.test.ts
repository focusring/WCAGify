import { execSync, type ChildProcess } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium, type Browser, type Page } from 'playwright'

import {
  cleanupProject,
  installDependencies,
  packWcagify,
  patchPackageJsonForLocalWcagify,
  scaffoldProject,
  startDevServer,
  stopDevServer
} from './setup/test-utils.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FIXTURES_DIR = join(__dirname, '../../packages/wcagify/test/fixtures/earl')
const PROJECT_NAME = 'earl-test'
const REPORT_SLUG = 'example'

interface EarlAssertion {
  type: string
  test: string
  subject: string | string[]
  result: { outcome: string; title?: string; description?: string }
  hasPart?: EarlAssertion[]
}

interface EarlEvaluation {
  type: string
  id: string
  title: string
  language: string
  auditResult: EarlAssertion[]
  structuredSample: { webpage: { id: string; title: string; source?: string }[] }
  scorecard: { conforming: number; failed: number; notTested: number; total: number }
  evaluationScope: { conformanceTarget: string }
  [key: string]: unknown
}

interface EarlDocument {
  '@context': Record<string, unknown>
  '@graph': [EarlEvaluation, Record<string, unknown>]
}

interface ImportResponse {
  ok: boolean
  dryRun: boolean
  slug: string
  mode: string
  title: string
  wcagVersion: string
  targetLevel: string
  samples: number
  issues: number
  passed: number
  notPresent: number
  warnings: string[]
  created?: string[]
  updated?: string[]
  issuesWritten?: number
}

function outcomeCounts(evaluation: EarlEvaluation): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const assertion of evaluation.auditResult) {
    counts[assertion.result.outcome] = (counts[assertion.result.outcome] ?? 0) + 1
  }
  return counts
}

async function postImport(baseUrl: string, body: Record<string, unknown>): Promise<Response> {
  return fetch(`${baseUrl}/api/earl/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
}

/**
 * The dev server indexes new content files through a watcher, so a report
 * written by an import becomes queryable a moment later. Poll until the
 * export route knows it.
 */
async function waitForExport(
  baseUrl: string,
  slug: string,
  timeoutMs = 90_000
): Promise<EarlDocument> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/api/earl/${slug}`)
      if (response.ok) return (await response.json()) as EarlDocument
    } catch {
      // server may reset connections while recompiling; keep polling
    }
    await new Promise((resolve) => setTimeout(resolve, 1_500))
  }
  throw new Error(`Report "${slug}" did not become exportable within ${timeoutMs}ms`)
}

describe('EARL export and import E2E', () => {
  let devServerProcess: ChildProcess
  let baseUrl: string
  let projectPath: string
  let exportOfExample: EarlDocument

  beforeAll(async () => {
    cleanupProject(PROJECT_NAME)
    projectPath = scaffoldProject(PROJECT_NAME)
    const tarball = packWcagify()
    patchPackageJsonForLocalWcagify(projectPath, tarball)
    installDependencies(projectPath)

    const server = await startDevServer(projectPath, 3106)
    devServerProcess = server.process
    baseUrl = server.url
  }, 600_000)

  afterAll(() => {
    if (devServerProcess) stopDevServer(devServerProcess)
  })

  describe('GET /api/earl/{slug}', () => {
    let response: Response

    beforeAll(async () => {
      response = await fetch(`${baseUrl}/api/earl/${REPORT_SLUG}`)
      exportOfExample = (await response.json()) as EarlDocument
    })

    it('serves the report as a JSON-LD download', () => {
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('application/ld+json')
      expect(response.headers.get('content-disposition')).toContain('-earl.jsonld')
    })

    it('contains an evaluation and an evaluator node', () => {
      const [evaluation, evaluator] = exportOfExample['@graph']
      expect(exportOfExample['@context'].earl).toBe('http://www.w3.org/ns/earl#')
      expect(exportOfExample['@context'].WCAG2).toBe('http://www.w3.org/TR/WCAG22/#')
      expect(evaluation.type).toBe('Evaluation')
      expect(evaluation.id).toBe(`${baseUrl}/reports/${REPORT_SLUG}`)
      expect(evaluation.title).toContain('WCAG audit')
      expect(evaluation.evaluationScope.conformanceTarget).toBe('wai:WCAG2AA-Conformance')
      expect(evaluator).toMatchObject({ id: '_:evaluator', type: 'Person', name: 'Your Name' })
    })

    it('asserts every criterion at the target level with the report outcomes', () => {
      const [evaluation] = exportOfExample['@graph']
      expect(evaluation.auditResult).toHaveLength(55)
      expect(outcomeCounts(evaluation)).toEqual({
        'earl:passed': 38,
        'earl:inapplicable': 15,
        'earl:failed': 2
      })
      expect(evaluation.scorecard).toEqual({ conforming: 53, failed: 2, notTested: 0, total: 55 })
    })

    it('nests each issue under its criterion, asserted against its sample', () => {
      const [evaluation] = exportOfExample['@graph']
      const keyboard = evaluation.auditResult.find((a) => a.test === 'WCAG2:keyboard')!
      expect(keyboard.result.outcome).toBe('earl:failed')
      expect(keyboard.hasPart).toHaveLength(1)
      expect(keyboard.hasPart![0]).toMatchObject({
        type: 'Assertion',
        test: 'WCAG2:keyboard',
        subject: ['_:sample-page-2'],
        result: { outcome: 'earl:failed', severity: 'High' }
      })
      expect(keyboard.hasPart![0]!.result.description).toContain('custom dropdown')
      expect(evaluation.structuredSample.webpage.map((page) => page.id)).toEqual([
        '_:sample-page-1',
        '_:sample-page-2',
        '_:sample-page-3'
      ])
    })

    it('returns 404 for an unknown report', async () => {
      const notFound = await fetch(`${baseUrl}/api/earl/does-not-exist`)
      expect(notFound.status).toBe(404)
    })
  })

  describe('GET /api/share/{token}/jsonld', () => {
    it('serves the same export through a share link', async () => {
      const created = await fetch(`${baseUrl}/api/shares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportSlug: REPORT_SLUG })
      })
      expect(created.status).toBe(201)
      const { token } = (await created.json()) as { token: string }

      const response = await fetch(`${baseUrl}/api/share/${token}/jsonld`)
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('application/ld+json')
      const shared = (await response.json()) as EarlDocument
      expect(shared['@graph'][0].auditResult).toHaveLength(55)
      expect(shared['@graph'][0].title).toBe(exportOfExample['@graph'][0].title)
    })

    it('returns 404 for an unknown token', async () => {
      const response = await fetch(`${baseUrl}/api/share/nonexistent123/jsonld`)
      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/earl/import', () => {
    it('previews an import without writing anything (dry run)', async () => {
      const response = await postImport(baseUrl, { earl: exportOfExample, dryRun: true })
      expect(response.status).toBe(200)
      const summary = (await response.json()) as ImportResponse
      expect(summary).toMatchObject({
        ok: true,
        dryRun: true,
        slug: 'wcag-audit-earl-test',
        mode: 'create',
        wcagVersion: '2.2',
        targetLevel: 'AA',
        samples: 3,
        issues: 2,
        passed: 38,
        notPresent: 15,
        warnings: []
      })
      expect(existsSync(join(projectPath, 'content/reports/wcag-audit-earl-test'))).toBe(false)
    })

    it('round-trips an export into a new report', async () => {
      const response = await postImport(baseUrl, { earl: exportOfExample, slug: 'round-trip' })
      expect(response.status).toBe(200)
      const result = (await response.json()) as ImportResponse
      expect(result.ok).toBe(true)
      expect(result.issuesWritten).toBe(2)
      expect(result.created).toEqual([
        'reports/round-trip/index.md',
        'reports/round-trip/not-all-functionality-is-reachable-with-the-keyboard.md',
        'reports/round-trip/focus-style-missing-on-interactive-elements.md'
      ])

      const reportDir = join(projectPath, 'content/reports/round-trip')
      const index = readFileSync(join(reportDir, 'index.md'), 'utf-8')
      expect(index).toContain("targetWcagVersion: '2.2'")
      expect(index).toContain('scStatuses:')
      const issue = readFileSync(
        join(reportDir, 'not-all-functionality-is-reachable-with-the-keyboard.md'),
        'utf-8'
      )
      expect(issue).toContain('sc: 2.1.1')
      expect(issue).toContain('sample: page-2')
      expect(issue).toContain('severity: High')

      const reExport = await waitForExport(baseUrl, 'round-trip')
      const [evaluation] = reExport['@graph']
      expect(evaluation.title).toBe(exportOfExample['@graph'][0].title)
      expect(outcomeCounts(evaluation)).toEqual(outcomeCounts(exportOfExample['@graph'][0]))
      expect(evaluation.scorecard).toEqual(exportOfExample['@graph'][0].scorecard)
    })

    it('rejects a second create for the same slug', async () => {
      const response = await postImport(baseUrl, { earl: exportOfExample, slug: 'round-trip' })
      expect(response.status).toBe(409)
    })

    it('merges automated results from another tool into an existing report', async () => {
      const axe = JSON.parse(readFileSync(join(FIXTURES_DIR, 'axe.json'), 'utf-8'))
      const response = await postImport(baseUrl, { earl: axe, slug: 'round-trip', mode: 'merge' })
      expect(response.status).toBe(200)
      const result = (await response.json()) as ImportResponse
      expect(result.mode).toBe('merge')
      expect(result.issuesWritten).toBe(4)
      expect(result.updated).toEqual(['reports/round-trip/index.md'])
      expect(result.warnings).toContain(
        'No WCAG-EM evaluation metadata found; report details use placeholders.'
      )

      const reportDir = join(projectPath, 'content/reports/round-trip')
      for (const file of [
        'aria-required-children',
        'aria-roles',
        'button-name',
        'definition-list'
      ]) {
        expect(existsSync(join(reportDir, `${file}.md`))).toBe(true)
      }
      const index = readFileSync(join(reportDir, 'index.md'), 'utf-8')
      // The axe findings fail 1.3.1 and 4.1.2, which the original recorded as passed.
      expect(index).not.toMatch(/passed:[\s\S]*?- '1\.3\.1'/)
      expect(index).not.toMatch(/passed:[\s\S]*?- '4\.1\.2'/)
      // Pages the findings refer to are added to the sample set.
      expect(index).toContain('https://website-name.org/search/')
    })

    it('rejects an invalid document, an invalid slug and a merge into a missing report', async () => {
      expect((await postImport(baseUrl, { earl: 'not json', slug: 'x' })).status).toBe(400)
      expect((await postImport(baseUrl, { earl: exportOfExample, slug: 'Not Valid' })).status).toBe(
        400
      )
      expect(
        (await postImport(baseUrl, { earl: exportOfExample, slug: 'missing', mode: 'merge' }))
          .status
      ).toBe(409)
    })
  })

  describe('wcagify-import-earl CLI', () => {
    let exportFile: string

    function runImportCli(args: string): { stdout: string; stderr: string; exitCode: number } {
      const script = join(projectPath, 'node_modules/@focusring/wcagify/dist/cli/import-earl.js')
      try {
        const stdout = execSync(`node "${script}" ${args}`, {
          cwd: projectPath,
          encoding: 'utf-8',
          timeout: 60_000,
          env: { ...process.env, NO_COLOR: '1' }
        })
        return { stdout, stderr: '', exitCode: 0 }
      } catch (error) {
        const execError = error as { stdout?: string; stderr?: string; status?: number }
        return {
          stdout: execError.stdout ?? '',
          stderr: execError.stderr ?? '',
          exitCode: execError.status ?? 1
        }
      }
    }

    beforeAll(() => {
      exportFile = join(projectPath, 'example-export.jsonld')
      writeFileSync(exportFile, JSON.stringify(exportOfExample), 'utf-8')
    })

    it('is installed as a binary of the scaffolded project', () => {
      expect(
        existsSync(join(projectPath, 'node_modules/@focusring/wcagify/dist/cli/import-earl.js'))
      ).toBe(true)
      expect(existsSync(join(projectPath, 'node_modules/.bin/wcagify-import-earl'))).toBe(true)
    })

    it('prints a dry-run summary as JSON', () => {
      const result = runImportCli(`"${exportFile}" --dry-run --json`)
      expect(result.exitCode).toBe(0)
      const summary = JSON.parse(result.stdout) as ImportResponse
      expect(summary).toMatchObject({ ok: true, dryRun: true, issues: 2, passed: 38 })
      expect(existsSync(join(projectPath, 'content/reports/wcag-audit-earl-test'))).toBe(false)
    })

    it('creates a report from a file', () => {
      const result = runImportCli(`"${exportFile}" --slug cli-import`)
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Created report at content/reports/cli-import')
      expect(result.stdout).toContain('2 issue(s) written')
      expect(existsSync(join(projectPath, 'content/reports/cli-import/index.md'))).toBe(true)
    })

    it('fails with a JSON error when the slug exists', () => {
      const result = runImportCli(`"${exportFile}" --slug cli-import --json`)
      expect(result.exitCode).toBe(1)
      expect(JSON.parse(result.stdout)).toMatchObject({ ok: false })
      expect((JSON.parse(result.stdout) as { error: string }).error).toContain('already exists')
    })

    it('merges into an existing report', () => {
      const axeFile = join(FIXTURES_DIR, 'axe.json')
      const result = runImportCli(`"${axeFile}" --slug cli-import --merge --json`)
      expect(result.exitCode).toBe(0)
      const summary = JSON.parse(result.stdout) as ImportResponse
      expect(summary).toMatchObject({ ok: true, mode: 'merge', issuesWritten: 4 })
      expect(existsSync(join(projectPath, 'content/reports/cli-import/aria-roles.md'))).toBe(true)
    })

    it('fails for a missing file', () => {
      const result = runImportCli('"/does/not/exist.jsonld"')
      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('Could not read')
    })
  })

  describe('in the browser', () => {
    let browser: Browser
    let page: Page

    beforeAll(async () => {
      // A local Chromium can be pointed at through PLAYWRIGHT_CHROMIUM_PATH
      // when the installed Playwright build is unavailable.
      browser = await chromium.launch({
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined
      })
      page = await browser.newPage({
        viewport: { width: 1400, height: 900 },
        acceptDownloads: true
      })
      page.setDefaultTimeout(60_000)
      page.setDefaultNavigationTimeout(60_000)
    }, 120_000)

    afterAll(async () => {
      await page?.close()
      await browser?.close()
    })

    it('downloads the report as EARL from the report page', async () => {
      await page.goto(`${baseUrl}/reports/${REPORT_SLUG}`)
      await page.waitForSelector('#executive-summary', { timeout: 90_000 })
      // Wait for hydration: the download button only works once Vue is live.
      await page.waitForLoadState('networkidle')

      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: 'Download EARL' }).click()
      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/-earl\.jsonld$/)

      const path = await download.path()
      const document = JSON.parse(readFileSync(path!, 'utf-8')) as EarlDocument
      expect(document['@graph'][0].auditResult).toHaveLength(55)
    })

    it('imports an EARL file as a new report through the import dialog', async () => {
      const file = join(projectPath, 'ui-import.jsonld')
      writeFileSync(file, JSON.stringify(exportOfExample), 'utf-8')

      await page.goto(baseUrl)
      await page.waitForSelector('table')
      await page.waitForLoadState('networkidle')

      await page.getByRole('button', { name: 'Import EARL' }).click()
      await page.locator('#earl-file').setInputFiles(file)

      // The preview is filled from a dry-run import. Scope to the dialog: the
      // reports table behind it shows the same "WCAG 2.2 AA" badge.
      const dialog = page.getByRole('dialog')
      await dialog.getByText('WCAG 2.2 AA').waitFor()
      const slugInput = dialog.getByRole('textbox', { name: 'Report slug' })
      expect(await slugInput.inputValue()).toBe('wcag-audit-earl-test')
      await slugInput.fill('ui-import')

      await dialog.getByRole('button', { name: 'Import', exact: true }).click()
      await page.waitForURL(`${baseUrl}/reports/ui-import`, { timeout: 90_000 })

      const reportDir = join(projectPath, 'content/reports/ui-import')
      expect(existsSync(join(reportDir, 'index.md'))).toBe(true)
      expect(
        existsSync(join(reportDir, 'not-all-functionality-is-reachable-with-the-keyboard.md'))
      ).toBe(true)
    })

    it('merges an EARL file into an existing report through the import dialog', async () => {
      const file = join(projectPath, 'ui-merge.json')
      writeFileSync(file, readFileSync(join(FIXTURES_DIR, 'axe.json'), 'utf-8'), 'utf-8')

      await page.goto(baseUrl)
      await page.waitForSelector('table')
      await page.waitForLoadState('networkidle')

      await page.getByRole('button', { name: 'Import EARL' }).click()
      await page.locator('#earl-file').setInputFiles(file)
      const dialog = page.getByRole('dialog')
      await dialog.getByText('WCAG 2.0 AA').waitFor()

      await dialog.getByRole('radio', { name: 'Add to an existing report' }).check()
      // Several reports carry the same title by now (round-trip imports keep
      // it), so the option is picked by its slug suffix.
      await dialog.getByRole('combobox').first().click()
      await page.getByRole('option', { name: `WCAG audit earl-test (${REPORT_SLUG})` }).click()

      await dialog.getByRole('button', { name: 'Import', exact: true }).click()
      await page.waitForURL(`${baseUrl}/reports/${REPORT_SLUG}`, { timeout: 90_000 })

      const reportDir = join(projectPath, 'content/reports', REPORT_SLUG)
      expect(existsSync(join(reportDir, 'aria-roles.md'))).toBe(true)
      expect(existsSync(join(reportDir, 'button-name.md'))).toBe(true)
    })
  })
})
