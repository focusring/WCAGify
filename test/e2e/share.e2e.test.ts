import { type ChildProcess } from 'node:child_process'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright'

import {
  buildProject,
  cleanupProject,
  installDependencies,
  packWcagify,
  patchPackageJsonForLocalWcagify,
  scaffoldProject,
  startBuiltServer,
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

async function createShare(
  baseUrl: string,
  body: { reportSlug: string; password?: string },
  headers: Record<string, string> = {}
): Promise<ShareResponse> {
  const response = await fetch(`${baseUrl}/api/shares`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body)
  })
  expect(response.status).toBe(201)
  return (await response.json()) as ShareResponse
}

describe('Share E2E', () => {
  let browser: Browser
  let projectPath: string
  let serverProcess: ChildProcess
  let baseUrl: string

  beforeAll(async () => {
    cleanupProject(PROJECT_NAME)
    projectPath = scaffoldProject(PROJECT_NAME)
    const tarball = packWcagify()
    patchPackageJsonForLocalWcagify(projectPath, tarball)
    installDependencies(projectPath)

    // Run against a production build + Nitro node server rather than `nuxt dev`.
    // The password flow is driven through the real form, which only works once the
    // page hydrates. Under `nuxt dev` the page's client chunks compile on demand,
    // so hydration is slow and wildly variable (tens of seconds, sometimes minutes
    // on a loaded CI runner) and the form submit can't be timed reliably. A
    // prebuilt app hydrates deterministically in well under a second.
    buildProject(projectPath)
    const server = await startBuiltServer(projectPath, 3102)
    serverProcess = server.process
    baseUrl = server.url

    browser = await chromium.launch()
    // Timeout: scaffold + install (up to 300s) + production build (up to
    // 1500s locally, possibly retried) + server start.
  }, 1_800_000)

  afterAll(async () => {
    await browser?.close()
    if (serverProcess) stopDevServer(serverProcess)
  })

  describe('share without password', () => {
    let share: ShareResponse
    let context: BrowserContext
    let page: Page

    beforeAll(async () => {
      share = await createShare(baseUrl, { reportSlug: REPORT_SLUG })
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
      share = await createShare(baseUrl, { reportSlug: REPORT_SLUG, password })
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

      await page.goto(`${baseUrl}/share/${share.token}`)
      await page.waitForSelector('input[type="password"]', { timeout: 30_000 })

      expect(await page.$('input[type="password"]')).toBeTruthy()
      expect(await page.$('#executive-summary')).toBeFalsy()
    })

    it('rejects wrong password', async () => {
      await page.fill('input[type="password"]', 'wrong-password')
      await page.click('button[type="submit"]')

      await page.waitForSelector('[role="alert"]', { timeout: 15_000 })
      const alert = await page.textContent('[role="alert"]')
      expect(alert).toBeTruthy()
      expect(await page.$('#executive-summary')).toBeFalsy()
    })

    it('unlocks with correct password', async () => {
      await page.fill('input[type="password"]', '')
      await page.fill('input[type="password"]', password)
      await page.click('button[type="submit"]')

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

  // A deployment with WCAGIFY_ADMIN_SECRET: only share links and the sign-in
  // page are public. A second server runs from the same build with the secret.
  describe('with an admin secret', () => {
    const secret = 'e2e-admin-secret'
    let lockedProcess: ChildProcess
    let lockedUrl: string
    let adminCookie: string

    beforeAll(async () => {
      const server = await startBuiltServer(projectPath, 3107, { WCAGIFY_ADMIN_SECRET: secret })
      lockedProcess = server.process
      lockedUrl = server.url

      const login = await fetch(`${lockedUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret })
      })
      expect(login.status).toBe(200)
      adminCookie = login.headers.getSetCookie()[0]!.split(';')[0]!
    })

    afterAll(() => {
      if (lockedProcess) stopDevServer(lockedProcess)
    })

    // Records every response a viewer's page gets that the admin auth refused:
    // a 401, or a redirect to the sign-in page.
    function trackRefusals(page: Page): string[] {
      const refused: string[] = []
      page.on('response', (response) => {
        const location = response.headers()['location'] ?? ''
        if (response.status() === 401 || location.startsWith('/login')) {
          refused.push(`${response.status()} ${response.url()}`)
        }
      })
      return refused
    }

    it.each(['reports', 'issues'])(
      'refuses the %s collection dump to a visitor',
      async (collection) => {
        const response = await fetch(`${lockedUrl}/__nuxt_content/${collection}/sql_dump.txt`)
        expect(response.status).toBe(401)
      }
    )

    it('serves the collection dump to a signed-in admin', async () => {
      const response = await fetch(`${lockedUrl}/__nuxt_content/issues/sql_dump.txt`, {
        headers: { cookie: adminCookie }
      })
      expect(response.status).toBe(200)
      expect((await response.text()).length).toBeGreaterThan(0)
    })

    it('sends a visitor of the report list to the sign-in page', async () => {
      const response = await fetch(`${lockedUrl}/`, { redirect: 'manual' })
      expect(response.status).toBe(302)
      expect(response.headers.get('location')).toMatch(/^\/login/)
    })

    it('shows a shared report to a viewer without an admin session', async () => {
      const share = await createShare(
        lockedUrl,
        { reportSlug: REPORT_SLUG },
        { cookie: adminCookie }
      )
      const context = await browser.newContext()
      const page = await context.newPage()
      const refused = trackRefusals(page)

      await page.goto(`${lockedUrl}/share/${share.token}`)
      await page.waitForSelector('#executive-summary', { timeout: 30_000 })
      await page.waitForLoadState('networkidle')

      expect(await page.$('#scorecard')).toBeTruthy()
      expect(await page.$('#issues')).toBeTruthy()
      expect(refused).toEqual([])
      await context.close()
    })

    it('unlocks a password-protected share for a viewer without an admin session', async () => {
      const password = 'test-password-123'
      const share = await createShare(
        lockedUrl,
        { reportSlug: REPORT_SLUG, password },
        { cookie: adminCookie }
      )
      const context = await browser.newContext()
      const page = await context.newPage()
      const refused = trackRefusals(page)

      await page.goto(`${lockedUrl}/share/${share.token}`)
      await page.waitForSelector('input[type="password"]', { timeout: 30_000 })
      await page.fill('input[type="password"]', password)
      await page.click('button[type="submit"]')
      await page.waitForSelector('#executive-summary', { timeout: 30_000 })
      await page.waitForLoadState('networkidle')

      expect(await page.$('#issues')).toBeTruthy()
      expect(refused).toEqual([])
      await context.close()
    })

    it('shows the not-found page for an unknown share link, not the sign-in page', async () => {
      const context = await browser.newContext()
      const page = await context.newPage()

      const response = await page.goto(`${lockedUrl}/share/nonexistent123`)

      expect(response?.status()).toBe(404)
      expect(new URL(page.url()).pathname).toBe('/share/nonexistent123')
      await context.close()
    })
  })
})
