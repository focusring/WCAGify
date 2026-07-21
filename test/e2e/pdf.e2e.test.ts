import { spawnSync, type ChildProcess } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium, type Browser } from 'playwright'
import { extractText, getDocumentProxy } from 'unpdf'

import {
  cleanupProject,
  installDependencies,
  packWcagify,
  patchPackageJsonForLocalWcagify,
  scaffoldProject,
  startPreviewServer,
  stopDevServer
} from './setup/test-utils.js'

const PROJECT_NAME = 'pdf-test'

// PDF generation is delegated to an external WeasyPrint service the same one
// production uses (the Railway URL baked into packages/wcagify/nuxt.config.ts,
// overridable via NUXT_WEASYPRINT_URL). These render tests therefore exercise the
// real renderer end to end; a pre-flight probe + warm-up + retry absorb the
// service's cold starts and transient blips.
const DEFAULT_WEASYPRINT_URL = 'https://magnificent-encouragement-production.up.railway.app'
const WEASYPRINT_URL = process.env.NUXT_WEASYPRINT_URL ?? DEFAULT_WEASYPRINT_URL
const isCI = Boolean(process.env.CI)

// PDF/UA accessibility is validated with Horn (https://horn.report) focusring's
// own Matterhorn-Protocol checker. CI installs the `horn` CLI before the e2e job;
// locally the a11y test skips unless the binary is on PATH (or HORN_BIN points at
// it). To run it locally: HORN_BIN=/path/to/horn pnpm test:e2e
const HORN_BIN = process.env.HORN_BIN ?? 'horn'
function isHornInstalled(): boolean {
  try {
    return spawnSync(HORN_BIN, ['--version'], { stdio: 'ignore' }).status === 0
  } catch {
    return false
  }
}
const hornInstalled = isHornInstalled()

// Reachability probe. Any HTTP response (even 404) means the service is up; only a
// network error / timeout counts as unreachable. Retried to ride out a cold start.
async function isWeasyprintReachable(url: string): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await fetch(url, { method: 'GET', signal: AbortSignal.timeout(10_000) })
      return true
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 2_000))
    }
  }
  return false
}

// Wake the (possibly sleeping) service and pay the first-render cost up front, so a
// cold start doesn't eat into the route's 60s render budget during the real tests.
async function warmUpWeasyprint(url: string): Promise<void> {
  const html =
    '<!doctype html><html lang="en"><head><title>warmup</title></head>' +
    '<body><h1>warmup</h1></body></html>'
  try {
    await fetch(`${url}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html,
        variant: 'pdf/ua-1',
        filename: 'warmup.pdf',
        presentational_hints: true
      }),
      signal: AbortSignal.timeout(60_000)
    })
  } catch {
    // Best-effort if the warm-up itself fails, the real tests will surface it.
  }
}

// Resolved at collection time (not in beforeAll) so `it.skipIf` reads the real
// value: a reachable service runs the render tests; an unreachable one skips them
// locally and fails the suite in CI (see beforeAll).
const weasyReachable = await isWeasyprintReachable(WEASYPRINT_URL)

function assertLooksLikePdf(bytes: Uint8Array): void {
  const buf = Buffer.from(bytes)
  // Magic header: every PDF starts with '%PDF-'.
  expect(buf.subarray(0, 5).toString('latin1')).toBe('%PDF-')
  // Trailer: a complete PDF ends with the '%%EOF' marker (allow trailing whitespace).
  const tail = buf.subarray(Math.max(0, buf.length - 1024)).toString('latin1')
  expect(tail).toContain('%%EOF')
  // A real rendered report is many KB guard against an empty/placeholder body.
  expect(buf.length).toBeGreaterThan(1000)
}

// Extract the PDF's text layer (unpdf wraps a serverless pdf.js build). Whitespace
// is collapsed so line wraps in the rendered PDF don't break substring matches.
async function extractPdfText(bytes: Uint8Array): Promise<string> {
  // Copy into a fresh Uint8Array — pdf.js detaches the buffer it's handed.
  const pdf = await getDocumentProxy(new Uint8Array(bytes))
  const { text } = await extractText(pdf, { mergePages: true })
  return text.replace(/\s+/g, ' ')
}

// Fetch the PDF route, retrying on a transient non-200 (e.g. a render that aborts
// while the live service is still warming).
async function fetchReportPdf(url: string): Promise<Response> {
  let response = await fetch(url)
  for (let attempt = 0; attempt < 2 && !response.ok; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 3_000))
    response = await fetch(url)
  }
  return response
}

type HornCheck = {
  rule_id: string
  checkpoint: number
  description: string
  severity: string
  outcome: { status: string }
}

// Validate a PDF against PDF/UA-1 with the Horn CLI. `compliant` reflects Horn's
// own --fail-on error verdict (exit 0); non-passing checks are returned for
// diagnostics. Throws (exit 2) if Horn itself can't run.
function validatePdfUa(pdfPath: string): { compliant: boolean; failures: HornCheck[] } {
  const result = spawnSync(
    HORN_BIN,
    ['validate', pdfPath, '--format', 'json', '--fail-on', 'error'],
    // timeout kills a hung horn (status null + ETIMEDOUT error) so CI can't stall.
    { encoding: 'utf-8', maxBuffer: 16 * 1024 * 1024, timeout: 30_000 }
  )
  if (result.error || result.status === null || result.status === 2) {
    throw new Error(`Horn could not validate ${pdfPath}: ${result.stderr || result.error?.message}`)
  }
  const report = JSON.parse(result.stdout) as { files: Array<{ results: HornCheck[] }> }
  const failures = report.files.flatMap((file) =>
    file.results.filter((check) => check.outcome?.status !== 'Pass')
  )
  return { compliant: result.status === 0, failures }
}

describe('PDF E2E', () => {
  let browser: Browser
  let devServerProcess: ChildProcess
  let baseUrl: string
  let projectPath: string
  let reportSlug = ''
  let reportTitle = ''
  let prevWeasyEnv: string | undefined

  beforeAll(async () => {
    if (isCI && !weasyReachable) {
      throw new Error(
        `WeasyPrint service unreachable at ${WEASYPRINT_URL}. ` +
          `These e2e tests render against the live service — check its availability.`
      )
    }

    cleanupProject(PROJECT_NAME)
    projectPath = scaffoldProject(PROJECT_NAME)
    const tarball = packWcagify()
    patchPackageJsonForLocalWcagify(projectPath, tarball)
    installDependencies(projectPath)

    // Set the WeasyPrint URL BEFORE starting the server so the child Nitro
    // process inherits it (startPreviewServer spreads process.env into the child;
    // the production node server applies NUXT_WEASYPRINT_URL at runtime).
    prevWeasyEnv = process.env.NUXT_WEASYPRINT_URL
    process.env.NUXT_WEASYPRINT_URL = WEASYPRINT_URL

    // A production build (not `nuxt dev`) is required. WeasyPrint cannot render the dev server's unminified CSS. See startPreviewServer.
    const server = await startPreviewServer(projectPath, 3105)
    devServerProcess = server.process
    baseUrl = server.url
    browser = await chromium.launch()

    // Discover the example report at runtime rather than hardcoding its slug/title.
    const reports = (await (await fetch(`${baseUrl}/api/reports`)).json()) as Array<{
      slug: string
      title: string
    }>
    if (!reports[0]?.slug) {
      throw new Error('Expected at least one report from /api/reports, got none')
    }
    reportSlug = reports[0].slug
    reportTitle = reports[0].title

    // Warm the service now so the first real render isn't paying a cold start.
    if (weasyReachable) await warmUpWeasyprint(WEASYPRINT_URL)
    // Timeout: scaffold + install (up to 300s) + production build (up to
    // 1500s locally, possibly retried) + server start.
  }, 1_800_000)

  afterAll(async () => {
    await browser?.close()
    if (devServerProcess) stopDevServer(devServerProcess)
    if (prevWeasyEnv === undefined) delete process.env.NUXT_WEASYPRINT_URL
    else process.env.NUXT_WEASYPRINT_URL = prevWeasyEnv
  })

  describe('PDF export API route', () => {
    it.skipIf(!weasyReachable)('returns a valid PDF with download headers', async () => {
      const response = await fetchReportPdf(`${baseUrl}/api/reports/${reportSlug}.pdf`)

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('application/pdf')

      const disposition = response.headers.get('content-disposition')
      expect(disposition).toContain('attachment')
      expect(disposition).toContain('.pdf')

      assertLooksLikePdf(new Uint8Array(await response.arrayBuffer()))
    })

    it('returns 404 for an unknown report slug', async () => {
      // Hits the route's not-found path before WeasyPrint is ever called, so this
      // runs regardless of service availability.
      const response = await fetch(`${baseUrl}/api/reports/does-not-exist.pdf`)
      expect(response.status).toBe(404)
    })
  })

  describe('download button', () => {
    it.skipIf(!weasyReachable)(
      'downloads a PDF whose content includes the scorecard and issue findings',
      async () => {
        const page = await browser.newPage({
          viewport: { width: 1400, height: 900 },
          acceptDownloads: true
        })
        try {
          await page.goto(`${baseUrl}/reports/${reportSlug}`, { waitUntil: 'networkidle' })
          await page.waitForSelector('#executive-summary', { timeout: 30_000 })

          // Register the download listener BEFORE clicking the event can fire before click() resolves.
          const [download] = await Promise.all([
            page.waitForEvent('download', { timeout: 90_000 }),
            page.getByRole('button', { name: 'Download PDF' }).click()
          ])

          expect(download.suggestedFilename()).toBe(`${reportTitle}.pdf`)

          const bytes = await readFile(await download.path())
          assertLooksLikePdf(bytes)

          const text = await extractPdfText(bytes)

          // Score table (ReportScorecard): the conformance summary line plus a row
          // per WCAG principle.
          expect(text).toContain('Conformance level:')
          expect(text).toContain('criteria met')
          expect(text).toContain('Perceivable')
          expect(text).toContain('Operable')
          expect(text).toContain('Understandable')
          expect(text).toContain('Robust')

          // The two issues shipped in the scaffolded example report, each identified
          // by its success criterion and a distinctive phrase from its title.
          expect(text).toContain('2.4.7')
          expect(text).toContain('Focus style missing')
          expect(text).toContain('2.1.1')
          expect(text).toContain('reachable with the keyboard')
        } finally {
          await page.close()
        }
      }
    )
  })

  describe('PDF accessibility (PDF/UA)', () => {
    it.skipIf(!weasyReachable || !hornInstalled)(
      'generates a PDF/UA-1 compliant PDF (validated by Horn)',
      async () => {
        const response = await fetchReportPdf(`${baseUrl}/api/reports/${reportSlug}.pdf`)
        expect(response.status).toBe(200)
        const bytes = Buffer.from(await response.arrayBuffer())
        assertLooksLikePdf(bytes)

        const pdfPath = join(tmpdir(), 'wcagify-report-a11y.pdf')
        await writeFile(pdfPath, bytes)

        const { compliant, failures } = validatePdfUa(pdfPath)
        const errors = failures.filter((check) => check.severity === 'error')
        expect(
          compliant,
          `Horn reported PDF/UA error-level failures:\n` +
            errors
              .map((check) => `  ${check.rule_id} (cp${check.checkpoint}): ${check.description}`)
              .join('\n')
        ).toBe(true)
      }
    )
  })
})
