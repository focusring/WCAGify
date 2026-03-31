import { type ChildProcess } from 'node:child_process'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium, type Browser, type Locator, type Page } from 'playwright'

import {
  cleanupProject,
  installDependencies,
  packWcagify,
  patchPackageJsonForLocalWcagify,
  scaffoldProject,
  startDevServer,
  stopDevServer
} from './setup/test-utils.js'

const PROJECT_NAME = 'browser-test'

describe('Browser E2E', () => {
  let browser: Browser
  let page: Page
  let devServerProcess: ChildProcess
  let baseUrl: string
  let projectPath: string

  beforeAll(async () => {
    cleanupProject(PROJECT_NAME)
    projectPath = scaffoldProject(PROJECT_NAME)
    const tarball = packWcagify()
    patchPackageJsonForLocalWcagify(projectPath, tarball)
    installDependencies(projectPath)

    const server = await startDevServer(projectPath, 3101)
    devServerProcess = server.process
    baseUrl = server.url

    browser = await chromium.launch()
    page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
  }, 300_000)

  afterAll(async () => {
    await page?.close()
    await browser?.close()
    if (devServerProcess) stopDevServer(devServerProcess)
  })

  describe('home page', () => {
    it('loads and displays the reports table', async () => {
      await page.goto(baseUrl)
      const table = await page.waitForSelector('table', { timeout: 30_000 })
      expect(table).toBeTruthy()
    })

    it('shows the example report in the table', async () => {
      await page.goto(baseUrl)
      await page.waitForSelector('table')

      const reportLink = await page.waitForSelector('table a')
      const text = await reportLink.textContent()
      expect(text).toContain('WCAG audit')
    })

    it('displays report metadata in table', async () => {
      await page.goto(baseUrl)
      await page.waitForSelector('table')

      const tableContent = await page.textContent('table')
      expect(tableContent).toContain('Client Name')
      expect(tableContent).toContain('Your Name')
      expect(tableContent).toContain('AA')
    })
  })

  describe('report detail page', () => {
    beforeAll(async () => {
      await page.goto(baseUrl)
      await page.waitForSelector('table')

      const reportLink = await page.waitForSelector('table a')
      await reportLink.click()
      await page.waitForSelector('#executive-summary', { timeout: 30_000 })
    })

    it('navigated to report URL', () => {
      expect(page.url()).toContain('/reports/')
    })

    it('shows the executive summary section', async () => {
      expect(await page.$('#executive-summary')).toBeTruthy()
    })

    it('shows the scorecard section', async () => {
      expect(await page.$('#scorecard')).toBeTruthy()
    })

    it('shows the about section', async () => {
      expect(await page.$('#about')).toBeTruthy()
    })

    it('shows the scope section', async () => {
      expect(await page.$('#scope')).toBeTruthy()
    })

    it('shows the sample section', async () => {
      expect(await page.$('#sample')).toBeTruthy()
    })

    it('shows issues with WCAG success criteria', async () => {
      const issuesSection = await page.$('#issues')
      expect(issuesSection).toBeTruthy()

      const issuesContent = await page.textContent('#issues')
      expect(issuesContent).toContain('2.4.7')
      expect(issuesContent).toContain('2.1.1')
    })

    it('displays report header metadata', async () => {
      const bodyContent = await page.textContent('body')
      expect(bodyContent).toContain('Client Name')
      expect(bodyContent).toContain('Your Name')
      expect(bodyContent).toContain('AA')
    })
  })

  describe('browser extension integration', () => {
    let reportSlug: string
    let sampleId: string

    it('GET /api/reports returns reports with correct shape', async () => {
      const response = await fetch(`${baseUrl}/api/reports`)
      expect(response.ok).toBe(true)

      const reports = await response.json()
      expect(reports.length).toBeGreaterThan(0)

      const report = reports[0]
      expect(report).toHaveProperty('slug')
      expect(report).toHaveProperty('title')
      expect(report).toHaveProperty('sample')
      expect(Array.isArray(report.sample)).toBe(true)

      reportSlug = report.slug
      sampleId = report.sample[0]?.id ?? 'homepage'

      if (report.sample.length > 0) {
        const samplePage = report.sample[0]
        expect(samplePage).toHaveProperty('title')
        expect(samplePage).toHaveProperty('id')
        expect(samplePage).toHaveProperty('url')
      }
    })

    it('POST /api/issues creates an issue with description', async () => {
      const response = await fetch(`${baseUrl}/api/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report: reportSlug,
          title: 'Missing focus indicator on navigation links',
          sc: '2.4.7',
          severity: 'High',
          difficulty: 'Low',
          sample: sampleId,
          description:
            '**Found on:** [https://example.com](https://example.com)\n\n**Element:** `nav > a.menu-item`'
        })
      })

      expect(response.ok).toBe(true)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.path).toContain('.md')
    })

    it('POST /api/issues creates an issue without description', async () => {
      const response = await fetch(`${baseUrl}/api/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report: reportSlug,
          title: 'Insufficient color contrast on buttons',
          sc: '1.4.3',
          severity: 'Medium',
          difficulty: 'Medium',
          sample: sampleId
        })
      })

      expect(response.ok).toBe(true)
    })

    it('POST /api/issues handles duplicate titles', async () => {
      const issueData = {
        report: reportSlug,
        title: 'Duplicate title test issue',
        sc: '1.1.1',
        severity: 'Low' as const,
        difficulty: 'Low' as const,
        sample: sampleId
      }

      const result1 = await (
        await fetch(`${baseUrl}/api/issues`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(issueData)
        })
      ).json()

      const result2 = await (
        await fetch(`${baseUrl}/api/issues`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(issueData)
        })
      ).json()

      expect(result1.path).not.toBe(result2.path)
      expect(result2.path).toContain('-2.md')
    })

    it('POST /api/issues rejects invalid input', async () => {
      const [empty, traversal, missing] = await Promise.all([
        fetch(`${baseUrl}/api/issues`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ report: reportSlug, title: '' })
        }),
        fetch(`${baseUrl}/api/issues`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            report: '../../../etc/passwd',
            title: 'Path traversal attempt',
            sc: '1.1.1',
            severity: 'Low',
            difficulty: 'Low',
            sample: sampleId
          })
        }),
        fetch(`${baseUrl}/api/issues`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            report: 'non-existent-report',
            title: 'Missing report',
            sc: '1.1.1',
            severity: 'Low',
            difficulty: 'Low',
            sample: sampleId
          })
        })
      ])

      expect(empty.status).toBe(400)
      expect(traversal.status).toBe(400)
      expect(missing.status).toBe(404)
    })

    it('submitted issue appears on the report page', async () => {
      const issueTitle = 'E2E round-trip keyboard trap test'
      await fetch(`${baseUrl}/api/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report: reportSlug,
          title: issueTitle,
          sc: '2.1.2',
          severity: 'High',
          difficulty: 'Medium',
          sample: sampleId,
          description: 'Keyboard focus gets trapped in the email input field.'
        })
      })

      // Wait for Nuxt Content to index the new file, then navigate to the report
      await new Promise((resolve) => setTimeout(resolve, 2_000))
      await page.goto(`${baseUrl}/reports/${reportSlug}`, { waitUntil: 'networkidle' })
      await page.waitForSelector('#issues', { timeout: 30_000 })

      const issuesContent = await page.textContent('#issues')
      expect(issuesContent).toContain('2.1.2')
      expect(issuesContent).toContain(issueTitle)
    })
  })

  describe('nuxt studio content management', () => {
    let studio: Locator

    it('creates a report with an issue via Studio UI and verifies on the page', async () => {
      // --- Open Studio sidebar ---
      await page.goto(baseUrl)
      await page.waitForSelector('table', { timeout: 30_000 })
      studio = page.locator('nuxt-studio')
      await studio.locator('button').first().click()
      await page.waitForTimeout(2_000)

      // --- Step 1: Create a new folder inside reports ---
      // Studio auto-creates index.md + .navigation.yml when creating a folder
      await studio.locator('text=Reports').first().click()
      await page.waitForTimeout(1_000)
      await studio.locator('[aria-label="Open actions"]').first().click()
      await page.waitForTimeout(500)
      await studio.locator('[role=menuitem]').filter({ hasText: 'New folder' }).click()
      await page.waitForTimeout(500)
      await studio.locator('input[name="name"]').fill('e2e-studio-report')
      await studio.locator('input[name="name"]').press('Enter')
      await page.waitForTimeout(2_000)

      // Verify the folder appears (Studio navigates back to Content root)
      await studio.locator('text=Reports').first().click()
      await page.waitForTimeout(1_000)
      const sidebarText = await studio.locator('.flex-1.overflow-y-auto').first().textContent()
      expect(sidebarText).toContain('E2e Studio Report')

      // --- Step 2: Open the auto-created index.md and fill report frontmatter ---
      await studio.locator('text=E2e Studio Report').first().click()
      await page.waitForTimeout(1_000)
      await studio.locator('text=Index').first().click()
      await page.waitForTimeout(3_000)

      // Dismiss error overlay if present (empty report triggers transient content errors)
      await page
        .evaluate(() => document.querySelector('nuxt-error-overlay')?.remove())
        .catch(() => {})

      // Expand Page Settings to reveal frontmatter fields
      await studio.locator('text=Page Settings').first().click({ force: true })
      await page.waitForTimeout(1_000)

      // Fill report frontmatter using input name attributes (#reports/<field>)
      await studio.locator('input[name="#reports/title"]').fill('E2E Studio Test Report')

      // Select Language — it's the first "Select an option..." dropdown in the form
      await studio.locator('text=Select an option...').first().click({ force: true })
      await page.waitForTimeout(500)
      await studio.locator('[role=option]').filter({ hasText: 'en' }).click()
      await page.waitForTimeout(300)

      // Fill Evaluation fields
      await studio.locator('input[name="#reports/evaluation/evaluator"]').fill('E2E Tester')
      await studio.locator('input[name="#reports/evaluation/commissioner"]').fill('Test Org')
      await studio
        .locator('input[name="#reports/evaluation/target"]')
        .fill('https://studio-test.example.com')
      await studio.locator('input[name="#reports/evaluation/targetLevel"]').fill('AA')
      await studio.locator('input[name="#reports/evaluation/targetWcagVersion"]').fill('2.2')
      await studio.locator('input[name="#reports/evaluation/date"]').fill('2026-03-25')
      await studio.locator('input[name="#reports/evaluation/specialRequirements"]').fill('None')

      // Wait for Studio to persist text fields via debounced dev content API
      await page.waitForTimeout(2_000)

      // Array fields (scope, baseline, technologies, sample) use complex custom
      // array editors in the Studio UI. Write the complete report content via the
      // dev content API that Studio uses internally to persist changes.
      const reportContent = [
        '---',
        'title: E2E Studio Test Report',
        'language: en',
        'evaluation:',
        '  evaluator: E2E Tester',
        '  commissioner: Test Org',
        '  target: https://studio-test.example.com',
        '  targetLevel: AA',
        '  targetWcagVersion: "2.2"',
        '  date: "2026-03-25"',
        '  specialRequirements: None',
        'scope:',
        '  - https://studio-test.example.com',
        'baseline:',
        '  - Chrome',
        'technologies:',
        '  - HTML',
        'sample:',
        '  - title: Homepage',
        '    id: homepage',
        '    url: https://studio-test.example.com',
        '    description: Main page',
        '---',
        '',
        'Report created via Studio e2e test.'
      ].join('\n')

      await fetch(`${baseUrl}/__nuxt_studio/dev/content/reports/e2e-studio-report/index.md`, {
        method: 'PUT',
        headers: { 'content-type': 'text/plain' },
        body: reportContent
      })
      await page.waitForTimeout(2_000)

      // --- Step 3: Create an issue file via the dev content API ---
      const issueContent = [
        '---',
        'title: Images missing alt text',
        'sc: "1.1.1"',
        'severity: High',
        'difficulty: Medium',
        'sample: homepage',
        '---',
        '',
        'Several images on the homepage are missing alt text.'
      ].join('\n')

      await fetch(
        `${baseUrl}/__nuxt_studio/dev/content/reports/e2e-studio-report/missing-alt-text.md`,
        { method: 'PUT', headers: { 'content-type': 'text/plain' }, body: issueContent }
      )
      await page.waitForTimeout(3_000)

      // --- Step 4: Verify the report and issue appear on the page ---
      // Open a fresh page to avoid Studio sidebar interference
      const verifyPage = await browser.newPage({ viewport: { width: 1400, height: 900 } })
      await verifyPage.goto(baseUrl, { waitUntil: 'networkidle' })
      await verifyPage.waitForSelector('table', { timeout: 30_000 })

      const tableContent = await verifyPage.textContent('table')
      expect(tableContent).toContain('E2E Studio Test Report')

      // Click through to the report detail page
      await verifyPage.locator('table a').filter({ hasText: 'E2E Studio Test Report' }).click()
      await verifyPage.waitForSelector('#issues', { timeout: 30_000 })

      const issuesContent = await verifyPage.textContent('#issues')
      expect(issuesContent).toContain('1.1.1')
      expect(issuesContent).toContain('Images missing alt text')
      await verifyPage.close()
    })
  })
})
