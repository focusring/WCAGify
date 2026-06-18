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

// Parse the first `name=value` pair from a Set-Cookie header so it can be sent
// back on a follow-up request.
function cookiePair(setCookie: string | null): string {
  return (setCookie ?? '').split(';')[0] ?? ''
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

    // The share API uses libsql (local SQLite), whose native binding isn't traced
    // into a standalone Nitro build — so these tests must run against `nuxt dev`,
    // not a production preview server. The trade-off is dev's on-demand compilation
    // (handled by warming the password route in beforeAll, see below).
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

    beforeAll(async () => {
      const response = await fetch(`${baseUrl}/api/shares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportSlug: REPORT_SLUG, password })
      })
      expect(response.status).toBe(201)
      share = (await response.json()) as ShareResponse
    })

    it('creates a password-protected share link', () => {
      expect(share.token).toBeTruthy()
      expect(share.passwordProtected).toBe(true)
    })

    // The password-gate UI is server-rendered, so this is a stable check. The
    // actual password verification / unlock is asserted at the API level below
    // rather than by driving the form: the submit only works after the page's
    // client bundle hydrates, which under `nuxt dev` (on-demand compilation) is
    // too slow and variable to time reliably in CI.
    it('shows the password form (not the report) when opening the link', async () => {
      const context = await browser.newContext()
      const page = await context.newPage()
      try {
        await page.goto(`${baseUrl}/share/${share.token}`)
        await page.waitForSelector('input[type="password"]', { timeout: 30_000 })
        expect(await page.$('input[type="password"]')).toBeTruthy()
        expect(await page.$('#executive-summary')).toBeFalsy()
      } finally {
        await page.close()
        await context.close()
      }
    })

    it('rejects a wrong password', async () => {
      const response = await fetch(`${baseUrl}/api/share/${share.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'wrong-password' })
      })
      expect(response.status).toBe(401)

      // Still gated: without a valid unlock the report payload is withheld.
      const stillLocked = await fetch(`${baseUrl}/api/share/${share.token}`)
      expect(((await stillLocked.json()) as { passwordRequired?: boolean }).passwordRequired).toBe(
        true
      )
    })

    it('unlocks with the correct password', async () => {
      const response = await fetch(`${baseUrl}/api/share/${share.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      expect(response.status).toBe(200)

      const unlockCookie = cookiePair(response.headers.get('set-cookie'))
      expect(unlockCookie).toBeTruthy()

      // The unlock cookie grants access: the same endpoint now returns the report
      // and its issues instead of requiring a password.
      const unlocked = await fetch(`${baseUrl}/api/share/${share.token}`, {
        headers: { cookie: unlockCookie }
      })
      expect(unlocked.status).toBe(200)
      const data = (await unlocked.json()) as {
        passwordRequired?: boolean
        report?: { title?: string }
        issues?: unknown[]
      }
      expect(data.passwordRequired).toBeFalsy()
      expect(data.report?.title).toBeTruthy()
      expect(Array.isArray(data.issues)).toBe(true)
    })
  })

  describe('invalid share token', () => {
    it('returns 404 for non-existent token', async () => {
      const response = await fetch(`${baseUrl}/api/share/nonexistent123`)
      expect(response.status).toBe(404)
    })
  })
})
