import { type ChildProcess } from 'node:child_process'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright'

import {
  cleanupProject,
  installDependencies,
  packWcagify,
  patchPackageJsonForLocalWcagify,
  scaffoldProject,
  startDevServer,
  stopDevServer
} from './setup/test-utils.js'

const PROJECT_NAME = 'share-test'
const REPORT_SLUG = 'example'

interface ShareResponse {
  token: string
  report_slug: string
  passwordProtected: boolean
  delete_token: string
}

// Fill the share password and submit, returning only once the JS handler has
// actually run (i.e. a POST to the share route was issued).
//
// Why the retry: these tests run against `nuxt dev`, which compiles the share
// page's client bundle on demand. The first interaction can race hydration — a
// click before the form's `@submit.prevent` handler is bound triggers a *native*
// form submit (a full-page reload to `?`) instead of the JS password check, so no
// POST is sent and no error/unlock ever appears. We click, watch for the POST,
// and retry on the reloaded page until hydration catches up.
async function submitSharePassword(page: Page, token: string, value: string): Promise<void> {
  const deadline = Date.now() + 30_000
  let lastError: unknown
  while (Date.now() < deadline) {
    try {
      const input = await page.waitForSelector('input[type="password"]', { timeout: 10_000 })
      await input.fill(value)
      const [posted] = await Promise.all([
        page
          .waitForResponse(
            (r) => r.url().includes(`/api/share/${token}`) && r.request().method() === 'POST',
            { timeout: 3_000 }
          )
          .then(() => true)
          .catch(() => false),
        page.click('button[type="submit"]')
      ])
      if (posted) return
    } catch (error) {
      lastError = error
    }
  }
  throw new Error(
    `Share password form never issued a POST within 30s (dev hydration race did not resolve): ${lastError ?? 'no POST observed'}`
  )
}

describe('Share E2E', () => {
  let browser: Browser
  let devServerProcess: ChildProcess
  let baseUrl: string

  beforeAll(async () => {
    cleanupProject(PROJECT_NAME)
    const projectPath = scaffoldProject(PROJECT_NAME)
    const tarball = packWcagify()
    patchPackageJsonForLocalWcagify(projectPath, tarball)
    installDependencies(projectPath)

    const server = await startDevServer(projectPath, 3102)
    devServerProcess = server.process
    baseUrl = server.url

    browser = await chromium.launch()
  }, 300_000)

  afterAll(async () => {
    await browser?.close()
    if (devServerProcess) stopDevServer(devServerProcess)
  })

  describe('share without password', () => {
    let share: ShareResponse
    let context: BrowserContext
    let page: Page

    beforeAll(async () => {
      const response = await fetch(`${baseUrl}/api/shares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportSlug: REPORT_SLUG })
      })
      expect(response.status).toBe(201)
      share = (await response.json()) as ShareResponse
    })

    afterAll(async () => {
      await page?.close()
      await context?.close()
    })

    it('creates a share link', () => {
      expect(share.token).toBeTruthy()
      expect(share.report_slug).toBe(REPORT_SLUG)
      expect(share.passwordProtected).toBe(false)
    })

    it('opens the shared report directly', async () => {
      context = await browser.newContext()
      page = await context.newPage()

      await page.goto(`${baseUrl}/share/${share.token}`)
      await page.waitForSelector('#executive-summary', { timeout: 30_000 })

      expect(await page.$('#executive-summary')).toBeTruthy()
      expect(await page.$('#scorecard')).toBeTruthy()
      expect(await page.$('#issues')).toBeTruthy()
    })
  })

  describe('share with password', () => {
    const password = 'test-password-123'
    let share: ShareResponse
    let context: BrowserContext
    let page: Page

    beforeAll(async () => {
      const response = await fetch(`${baseUrl}/api/shares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportSlug: REPORT_SLUG, password })
      })
      expect(response.status).toBe(201)
      share = (await response.json()) as ShareResponse
    })

    afterAll(async () => {
      await page?.close()
      await context?.close()
    })

    it('creates a password-protected share link', () => {
      expect(share.token).toBeTruthy()
      expect(share.passwordProtected).toBe(true)
    })

    it('shows password form when opening the link', async () => {
      context = await browser.newContext()
      page = await context.newPage()

      // Don't wait for 'networkidle': the Nuxt dev server keeps a persistent Vite
      // HMR connection open, so the network never goes idle and goto would hang for
      // the full timeout. The password form is server-rendered, so the default
      // 'load' wait plus waitForSelector below is enough (mirrors the no-password test).
      await page.goto(`${baseUrl}/share/${share.token}`)
      await page.waitForSelector('input[type="password"]', { timeout: 30_000 })

      expect(await page.$('input[type="password"]')).toBeTruthy()
      expect(await page.$('#executive-summary')).toBeFalsy()
    })

    it('rejects wrong password', async () => {
      await submitSharePassword(page, share.token, 'wrong-password')

      await page.waitForSelector('[role="alert"]', { timeout: 10_000 })
      const alert = await page.textContent('[role="alert"]')
      expect(alert).toBeTruthy()
      expect(await page.$('#executive-summary')).toBeFalsy()
    })

    it('unlocks with correct password', async () => {
      await submitSharePassword(page, share.token, password)

      await page.waitForSelector('#executive-summary', { timeout: 30_000 })
      expect(await page.$('#executive-summary')).toBeTruthy()
      expect(await page.$('#scorecard')).toBeTruthy()
      expect(await page.$('#issues')).toBeTruthy()
    })
  })

  describe('invalid share token', () => {
    it('returns 404 for non-existent token', async () => {
      const response = await fetch(`${baseUrl}/api/share/nonexistent123`)
      expect(response.status).toBe(404)
    })
  })
})
