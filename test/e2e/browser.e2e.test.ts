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
})
