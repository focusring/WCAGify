import { type ChildProcess } from 'node:child_process'
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

const PROJECT_NAME = 'browser-test'

describe('Browser E2E', () => {
  let browser: Browser
  let page: Page
  let devServerProcess: ChildProcess
  let baseUrl: string

  beforeAll(async () => {
    cleanupProject(PROJECT_NAME)
    const projectPath = scaffoldProject(PROJECT_NAME)
    const tarball = packWcagify()
    patchPackageJsonForLocalWcagify(projectPath, tarball)
    installDependencies(projectPath)

    const server = await startDevServer(projectPath)
    devServerProcess = server.process
    baseUrl = server.url

    browser = await chromium.launch()
    page = await browser.newPage()
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

      // Issue title is inside a collapsed criterion accordion — click to expand
      await page.locator('#issues button', { hasText: '2.1.2' }).first().click()
      await page.waitForSelector(`text=${issueTitle}`)

      const expandedContent = await page.textContent('#issues')
      expect(expandedContent).toContain(issueTitle)
    })
  })
})
