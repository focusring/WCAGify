import { type ChildProcess } from 'node:child_process'
import { cpSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium, type Browser, type Page } from 'playwright'

import {
  buildProject,
  cleanupProject,
  getTmpDir,
  installDependencies,
  packWcagifyReporter,
  startBuiltServer,
  stopDevServer
} from './setup/test-utils.js'

// Guards the boundary of @focusring/wcagify-reporter: an app that extends only
// its layer, as the focusring customer portal does, must get the report
// components and nothing that serves data. The fixture installs the packed
// tarball with the latest matching Nuxt, Nuxt UI and i18n, so a release of
// either side that adds a server route to the layer fails here.
// See docs/contributing/report-package.md, "Step 4".

const __dirname = dirname(fileURLToPath(import.meta.url))
const FIXTURE_DIR = join(__dirname, 'fixtures/reporter-layer')
const PROJECT_NAME = 'reporter-layer'
const REPORT_TITLE = 'WCAG audit Fixture Website'
const ISSUE_TITLE = 'The search button has no accessible name'
const TIP_TITLE = 'Underline the links in the footer'

// The only server handlers an app gets from the layer: Nitro's static files,
// Nuxt's error and island renderers, @nuxtjs/i18n's messages, Nuxt Icon's
// icon collections (through Nuxt UI) and the page renderer. Review any change
// to this list before accepting it: a new entry is a new public route in every
// app that renders reports.
const EXPECTED_HANDLERS = [
  'middleware (static files)',
  '/__nuxt_error',
  '/__nuxt_island/**',
  '/_i18n/:hash/:locale/messages.json',
  '/api/_nuxt_icon/:collection',
  '/**'
].toSorted()

// Server-side dependencies of the full WCAGify app that must stay out.
const FORBIDDEN_SERVER_PACKAGES = ['@nuxt/content', '@libsql/client', 'sharp', 'pdf-lib', 'jsonld']

function filesUnder(dir: string, extension: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: 'utf-8' })
    .filter((file) => file.endsWith(extension))
    .map((file) => join(dir, file))
}

// Nitro writes its route table into the server bundle as
// `const handlers = [{ route: '/…', handler: _x, lazy, middleware, method }, …]`.
function nitroHandlers(serverDir: string): string[] {
  const bundles = filesUnder(serverDir, '.mjs')
    .map((file) => readFileSync(file, 'utf-8'))
    .filter((code) => code.includes('const handlers = ['))
  expect(bundles).toHaveLength(1)

  const table = bundles[0]!.slice(bundles[0]!.indexOf('const handlers = ['))
  const list = table.slice(0, table.indexOf('\n];'))
  const entries = [
    ...list.matchAll(
      /\{ route: '([^']*)', handler: \w+, lazy: (?:true|false), middleware: (true|false), method: ([^ }]+) \}/g
    )
  ]
  expect(entries.length).toBe(list.split('\n').length - 1)

  return entries.map(([, route, middleware, method]) => {
    const name = middleware === 'true' && route === '' ? 'middleware (static files)' : route!
    return method === 'undefined' ? name : `${method!.replaceAll('"', '').toUpperCase()} ${name}`
  })
}

// Packages in the server output: Nitro's traced node_modules, and the sources
// of the server sourcemaps for the code it bundled.
function serverPackages(serverDir: string): Set<string> {
  const packages = new Set<string>()
  const packageName = /node_modules\/((?:@[^/]+\/)?[^/.][^/]*)\//g

  const modulesDir = join(serverDir, 'node_modules')
  if (existsSync(modulesDir)) {
    for (const entry of readdirSync(modulesDir)) {
      if (!entry.startsWith('@')) {
        packages.add(entry)
        continue
      }
      for (const scoped of readdirSync(join(modulesDir, entry))) packages.add(`${entry}/${scoped}`)
    }
  }

  for (const map of filesUnder(serverDir, '.map')) {
    const { sources = [] } = JSON.parse(readFileSync(map, 'utf-8')) as { sources?: string[] }
    for (const source of sources) {
      const names = [...source.matchAll(packageName)].map(([, name]) => name!)
      if (names.length > 0) packages.add(names.at(-1)!)
    }
  }

  return packages
}

function count(text: string, pattern: RegExp): number {
  return [...text.matchAll(pattern)].length
}

async function waitForHydration(page: Page): Promise<void> {
  await page.waitForFunction(
    () =>
      Boolean(
        (document.querySelector('#__nuxt') as (Element & { __vue_app__?: unknown }) | null)
          ?.__vue_app__
      ),
    undefined,
    { timeout: 30_000 }
  )
}

describe('Report layer on its own', () => {
  let projectPath: string
  let outputDir: string
  let serverProcess: ChildProcess
  let baseUrl: string
  let browser: Browser

  beforeAll(async () => {
    cleanupProject(PROJECT_NAME)
    projectPath = join(getTmpDir(), PROJECT_NAME)
    cpSync(FIXTURE_DIR, projectPath, {
      recursive: true,
      filter: (source) => !['node_modules', '.nuxt', '.output'].includes(basename(source))
    })

    const pkgPath = join(projectPath, 'package.json')
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    pkg.dependencies['@focusring/wcagify-reporter'] = `file:${packWcagifyReporter()}`
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf-8')

    installDependencies(projectPath)
    buildProject(projectPath)
    outputDir = join(projectPath, '.output')

    const server = await startBuiltServer(projectPath, 3108)
    serverProcess = server.process
    baseUrl = server.url

    browser = await chromium.launch()
    // Timeout: install (up to 300s) + production build (up to 1500s, possibly
    // retried) + server start.
  }, 1_800_000)

  afterAll(async () => {
    await browser?.close()
    if (serverProcess) stopDevServer(serverProcess)
  })

  describe('build output', () => {
    it('has exactly the expected server handlers', () => {
      const handlers = nitroHandlers(join(outputDir, 'server'))

      expect(handlers.toSorted()).toEqual(EXPECTED_HANDLERS)
      expect(handlers.some((route) => route.includes('__nuxt_content'))).toBe(false)
      expect(handlers.some((route) => route.includes('/api/_mdc/'))).toBe(false)
    })

    it('leaves the full app’s server packages out', () => {
      const packages = serverPackages(join(outputDir, 'server'))

      // The scan sees bundled code, or an empty result would pass vacuously.
      expect(packages).toContain('@focusring/wcagify-reporter')
      expect(packages).toContain('vue')
      for (const name of FORBIDDEN_SERVER_PACKAGES) {
        expect(packages, `${name} is in the server output`).not.toContain(name)
      }
    })

    it('loads Tailwind’s base styles once', () => {
      const css = filesUnder(join(outputDir, 'public/_nuxt'), '.css')
        .map((file) => readFileSync(file, 'utf-8'))
        .join('\n')

      expect(count(css, /@layer theme\s*\{/g)).toBe(1)
      expect(count(css, /@layer base\s*\{/g)).toBe(1)
      // Preflight's `html` rule.
      expect(count(css, /-webkit-text-size-adjust:\s*100%/g)).toBe(1)
    })

    it('keeps zod out of the client bundle', () => {
      // The schemas are validated on the server only; the components import
      // the package root for scoring, which must not pull in the schemas.
      const clientChunks = filesUnder(join(outputDir, 'public/_nuxt'), '.js')
      expect(clientChunks.length).toBeGreaterThan(0)

      const withZod = clientChunks.filter((file) => readFileSync(file, 'utf-8').includes('_zod'))
      expect(withZod.map((file) => basename(file))).toEqual([])
    })
  })

  describe('server', () => {
    it.each([
      '/__nuxt_content/reports/sql_dump.txt',
      '/api/_mdc/highlight',
      '/api/reports',
      '/api/shares'
    ])('answers 404 for %s', async (path) => {
      const response = await fetch(`${baseUrl}${path}`)
      expect(response.status).toBe(404)
    })
  })

  describe('the rendered report', () => {
    let page: Page
    const problems: string[] = []

    beforeAll(async () => {
      page = await browser.newPage()
      const isEvidence = (url: string) => new URL(url).pathname.startsWith('/api/uploads/')
      page.on('pageerror', (error) => problems.push(`page error: ${error.message}`))
      page.on('console', (message) => {
        if (message.type() !== 'error') return
        // The issue's image points at WCAGify's upload route, which this app
        // does not have.
        if (isEvidence(message.location().url) && message.text().includes('404')) return
        problems.push(`console error: ${message.text()}`)
      })
      page.on('response', (response) => {
        if (response.status() >= 400 && !isEvidence(response.url())) {
          problems.push(`${response.status()} ${response.url()}`)
        }
      })

      await page.goto(baseUrl)
      await waitForHydration(page)
    })

    afterAll(async () => {
      await page?.close()
    })

    it('renders the report with its translations', async () => {
      await expect
        .poll(() => page.getByRole('heading', { level: 1 }).textContent())
        .toContain(REPORT_TITLE)
      expect(await page.getByRole('heading', { name: 'Executive summary' }).count()).toBe(1)
      expect(await page.textContent('#executive-summary')).toContain(
        'The homepage of Fixture Website has one issue.'
      )
      expect(await page.textContent('#tips')).toContain(TIP_TITLE)
    })

    it('opens an issue with its image and highlighted code', async () => {
      const trigger = page.getByRole('button', { name: ISSUE_TITLE })
      await trigger.click()
      await expect.poll(() => trigger.getAttribute('aria-expanded')).toBe('true')

      const issue = page.locator('article', { has: trigger })
      const code = issue.locator('pre.shiki')
      await code.waitFor({ state: 'visible', timeout: 15_000 })

      expect(await code.locator('.line').count()).toBe(1)
      // The token colour comes from the style element in the issue body.
      expect(
        await code
          .locator('span.srI7n')
          .first()
          .evaluate((element) => getComputedStyle(element).color)
      ).toBe('rgb(26, 127, 55)')
      expect(await issue.getByRole('button', { name: /copy/i }).count()).toBeGreaterThan(0)
      expect(
        await issue
          .locator('img[src="/api/uploads/fixture/search-button-4-1-2-0a1b2c3d.png"]')
          .count()
      ).toBeGreaterThan(0)
    })

    it('logs no errors apart from the missing image', async () => {
      await page.waitForLoadState('networkidle')
      expect(problems).toEqual([])
    })
  })
})
