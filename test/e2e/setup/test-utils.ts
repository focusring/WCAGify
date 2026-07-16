import { execSync, spawn, type ChildProcess } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = join(__dirname, '../../..')
// Locally the scaffold dir must live OUTSIDE the workspace: editor tooling
// (e.g. Tailwind IntelliSense) indexes workspace folders and loads native
// bindings (.node DLLs) from the scaffolded node_modules, holding file locks
// that make cleanup fail with EPERM on Windows. On CI it stays at <repo>/.tmp
// because the failure-artifact upload in e2e-tests.yml references that path.
//
// realpathSync.native resolves Windows 8.3 short names (%TEMP% can expand to
// C:\Users\BRYANO~1\...): the `~` gets URL-encoded to %7E when Nuxt Content's
// production SQLite adapter round-trips the path through a file:// URL, and
// every content query then fails with EPERM on the bogus %7E path.
const TMP_BASE = process.env.CI
  ? join(ROOT_DIR, '.tmp')
  : join(realpathSync.native(tmpdir()), 'wcagify-e2e')

// Each run scaffolds into its own subdirectory: leftover project dirs from a
// crashed run can be hard-locked on Windows (EBUSY even for rename) until the
// orphaned holder finally exits, so reusing fixed directory names would fail
// suites at cleanup before they start. The id is minted once in the vitest
// main process (which loads this module for global setup) and inherited by
// the forked workers through the environment; cleanupTmpDir sweeps old run
// dirs from the base once their locks are gone.
process.env.WCAGIFY_E2E_RUN_ID ??= Date.now().toString(36)
const TMP_DIR = join(TMP_BASE, `run-${process.env.WCAGIFY_E2E_RUN_ID}`)
const CLI_BINARY = join(ROOT_DIR, 'packages/create-wcagify/dist/cli.js')

export function getTmpDir(): string {
  return TMP_DIR
}

export function runCli(
  args: string,
  cwd: string,
  options?: { timeout?: number }
): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execSync(`node "${CLI_BINARY}" ${args}`, {
      cwd,
      encoding: 'utf-8',
      timeout: options?.timeout ?? 30_000,
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

export function scaffoldProject(name: string): string {
  const projectPath = join(TMP_DIR, name)

  cleanupProject(name)

  mkdirSync(TMP_DIR, { recursive: true })

  try {
    execSync(`node "${CLI_BINARY}" create ${name} --no-git --no-install`, {
      cwd: TMP_DIR,
      stdio: 'pipe',
      shell: true,
      env: { ...process.env, NO_COLOR: '1' }
    })
  } catch (error) {
    const execError = error as { stdout?: string; stderr?: string; message?: string }
    throw new Error(
      `Failed to scaffold project: ${execError.message}\nstdout: ${execError.stdout}\nstderr: ${execError.stderr}`
    )
  }

  if (!existsSync(join(projectPath, 'package.json'))) {
    throw new Error(`Scaffolding did not create expected files at ${projectPath}`)
  }

  return projectPath
}

// Kill node processes whose command line references the tmp dir (or a single
// project inside it, when `scope` is given). Orphans come from two places on
// Windows: dev servers are spawned detached, so an interrupted run leaves
// them alive indefinitely; and a timed-out execSync kills only its direct
// child (cmd/npx), orphaning the underlying node process — an orphaned
// `nuxt build` keeps running for minutes, holds Nuxt's build lock, and
// steals CPU from every subsequent suite. Matching on the command line keeps
// this targeted — a blanket node.exe taskkill would take down unrelated
// processes (including the test runner itself).
function killOrphanedTmpProcesses(scope?: string): void {
  if (process.platform !== 'win32') return

  const marker = scope ?? basename(TMP_BASE)
  try {
    execSync(
      `powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -like '*${marker}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"`,
      { stdio: 'ignore' }
    )
  } catch {
    // ignore — best-effort cleanup
  }
  // Give Windows a moment to release file handles after killing processes
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500)
}

export function cleanupTmpDir(): void {
  if (!existsSync(TMP_BASE)) return

  killOrphanedTmpProcesses()

  try {
    rmSync(TMP_BASE, { recursive: true, force: true, maxRetries: 5, retryDelay: 1000 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn(`Warning: could not fully clean up ${TMP_BASE}: ${message}`)
    console.warn('Leftovers do not affect this run; it scaffolds into a fresh run directory.')
  }
}

export function cleanupProject(name: string): void {
  const projectPath = join(TMP_DIR, name)
  if (!existsSync(projectPath)) return

  try {
    rmSync(projectPath, { recursive: true, force: true, maxRetries: 5, retryDelay: 1000 })
  } catch {
    // The tree can be locked by a lingering handle (AV scan, surviving dev
    // server). Try to move it aside; if even that fails, leave it — project
    // dirs are unique per run, so a stuck leftover cannot collide with a
    // later run, and cleanupTmpDir sweeps it once the lock is gone.
    try {
      const husk = `${projectPath}-stale-${Date.now()}`
      renameSync(projectPath, husk)
      rmSync(husk, { recursive: true, force: true, maxRetries: 1, retryDelay: 500 })
    } catch {
      console.warn(`Warning: could not remove ${projectPath}; leaving it behind.`)
    }
  }
}

export function packWcagify(): string {
  const wcagifyDir = join(ROOT_DIR, 'packages/wcagify')

  // Reuse existing tarball if already packed (avoids races when files run in parallel)
  const existing = existsSync(wcagifyDir)
    ? readdirSync(wcagifyDir).find((f) => f.endsWith('.tgz'))
    : undefined
  if (existing) return join(wcagifyDir, existing)

  const output = execSync('pnpm pack --pack-destination .', {
    cwd: wcagifyDir,
    encoding: 'utf-8',
    timeout: 30_000
  }).trim()
  const tarball = join(wcagifyDir, output.split('\n').pop()!)
  if (!existsSync(tarball)) {
    throw new Error(`pnpm pack did not create expected tarball: ${tarball}`)
  }
  return tarball
}

export function patchPackageJsonForLocalWcagify(projectPath: string, tarballPath: string): void {
  const pkgPath = join(projectPath, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
  pkg.dependencies['@focusring/wcagify'] = `file:${tarballPath}`
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf-8')
}

export function installDependencies(projectPath: string): void {
  // These are throwaway projects created just for tests, so we relax pnpm's
  // supply-chain policies that would otherwise add noise or flakiness:
  //
  // - --trust-policy-ignore-after 1 ignores trust downgrades for packages
  //   published more than 1 minute ago. Several transitive deps (chokidar,
  //   semver, …) lost provenance attestation in a patch release, which would
  //   otherwise trigger ERR_PNPM_TRUST_DOWNGRADE.
  // - --config.minimumReleaseAge=0 disables pnpm v11's default 24h minimum
  //   release-age gate. The scaffold resolves deps fresh (no lockfile), so a
  //   just-published transitive version would otherwise fail with
  //   ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION.
  //
  // No --ignore-workspace: under pnpm v11 that flag also discards the project's
  // own pnpm-workspace.yaml — including its allowBuilds list — so the native
  // build scripts (esbuild, sharp, …) would be skipped and fail under CI with
  // ERR_PNPM_IGNORED_BUILDS. The scaffold ships its own pnpm-workspace.yaml,
  // which shadows this monorepo's workspace and keeps the install isolated.
  // Several suites install concurrently against the shared pnpm store and the
  // same packed tarball. pnpm has been observed exiting 0 within seconds while
  // leaving node_modules unlinked (a few .pnpm entries, no top-level packages,
  // no lockfile, postinstall never ran). Verify the outcome and retry once.
  for (let attempt = 1; ; attempt++) {
    try {
      execSync(
        'pnpm install --no-frozen-lockfile --trust-policy-ignore-after 1 --config.minimumReleaseAge=0',
        {
          cwd: projectPath,
          stdio: 'pipe',
          // Suites run in parallel locally, so several ~1300-package installs
          // compete for disk; 120s was reliably exceeded on Windows.
          timeout: 300_000,
          env: { ...process.env, NO_COLOR: '1', CI: '1' }
        }
      )
    } catch (error) {
      // On timeout, execSync only kills the direct child — reap the orphaned
      // install/prepare processes of this project so they don't keep running
      // and poison the remaining suites.
      killOrphanedTmpProcesses(basename(projectPath))
      const execError = error as { stdout?: string; stderr?: string; message?: string }
      throw new Error(
        `pnpm install failed:\nstdout: ${execError.stdout}\nstderr: ${execError.stderr}`
      )
    }

    if (existsSync(join(projectPath, 'node_modules', 'nuxt'))) return

    if (attempt >= 2) {
      throw new Error(
        `pnpm install exited 0 but node_modules/nuxt is missing in ${projectPath} (phantom install)`
      )
    }
  }
}

async function waitForServer(url: string, timeoutMs: number): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {}
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error(`Server at ${url} did not respond within ${timeoutMs}ms`)
}

export async function startDevServer(
  projectPath: string,
  port = 3099
): Promise<{
  process: ChildProcess
  url: string
}> {
  const url = `http://localhost:${port}`
  const child = spawn('npx', ['nuxt', 'dev', '--port', String(port)], {
    cwd: projectPath,
    stdio: 'ignore',
    shell: true,
    detached: true,
    env: { ...process.env, NO_COLOR: '1', BROWSER: 'none' }
  })

  child.on('error', (err) => {
    throw new Error(`Dev server process error: ${err.message}`)
  })

  try {
    await waitForServer(url, 120_000)
  } catch (error) {
    // The server is spawned detached; without this it would outlive the
    // failed suite and hold locks on the project directory.
    stopDevServer(child)
    throw error
  }
  return { process: child, url }
}

// Nitro's standalone build traces the `libsql` JS but not its optional
// platform-native binding (@libsql/<platform>, e.g. @libsql/darwin-arm64 locally
// or @libsql/linux-x64-gnu in CI). Without it the share API crashes at runtime
// with "Cannot find module '@libsql/...'". Copy the installed binding (pnpm keeps
// it under node_modules/.pnpm) into the output so the preview server can serve
// share routes. No-op if the build already includes it or none is installed.
function copyLibsqlNativeBinding(projectPath: string): void {
  const pnpmDir = join(projectPath, 'node_modules/.pnpm')
  const outDir = join(projectPath, '.output/server/node_modules/@libsql')
  if (!existsSync(pnpmDir)) return

  const isPlatformBinding = /darwin|linux|win32|android/
  for (const entry of readdirSync(pnpmDir)) {
    if (!entry.startsWith('@libsql+')) continue
    const scopeDir = join(pnpmDir, entry, 'node_modules/@libsql')
    if (!existsSync(scopeDir)) continue
    for (const pkg of readdirSync(scopeDir)) {
      if (!isPlatformBinding.test(pkg)) continue
      const dest = join(outDir, pkg)
      if (existsSync(dest)) continue
      mkdirSync(outDir, { recursive: true })
      cpSync(join(scopeDir, pkg), dest, { recursive: true })
    }
  }
}

export async function startPreviewServer(
  projectPath: string,
  port = 3100
): Promise<{
  process: ChildProcess
  url: string
}> {
  // The PDF pipeline depends on production-built CSS: WeasyPrint raises
  // NotImplementedError on the dev server's unminified Tailwind/Nuxt UI CSS
  // (oklch(), @property, cascade layers, …). So report-PDF e2e tests must run
  // against a production build + the Nitro node server, not `nuxt dev`.
  // Retried once: build-time provider fetches (e.g. @nuxt/fonts hitting
  // fonts.bunny.net) can fail transiently while parallel suites saturate
  // the network, killing an otherwise healthy build.
  for (let attempt = 1; ; attempt++) {
    try {
      execSync('npx nuxt build', {
        cwd: projectPath,
        stdio: 'pipe',
        shell: true,
        // A solo production build takes ~9.5 min on a local Windows machine
        // (measured), and pdf/share build concurrently with the other suites,
        // so this needs a lot of headroom. A genuinely hung build still fails,
        // just later; healthy runs are unaffected.
        timeout: 1_500_000,
        // 'pipe' buffers the (verbose) build output so it can be surfaced on
        // failure; raise maxBuffer well above the 1 MB default to avoid ENOBUFS.
        maxBuffer: 64 * 1024 * 1024,
        env: { ...process.env, NO_COLOR: '1' }
      })
      break
    } catch (error) {
      // See installDependencies: reap the orphaned build so it doesn't keep
      // holding Nuxt's build lock and stealing CPU from the other suites.
      killOrphanedTmpProcesses(basename(projectPath))
      if (attempt >= 2) {
        const execError = error as { stdout?: string; stderr?: string; message?: string }
        throw new Error(
          `nuxt build failed:\nstdout: ${execError.stdout}\nstderr: ${execError.stderr}`
        )
      }
    }
  }

  copyLibsqlNativeBinding(projectPath)

  const url = `http://localhost:${port}`
  // Absolute script path: with a relative path the process command line is
  // just "node .output/server/index.mjs", which killOrphanedTmpProcesses
  // cannot match — a leaked preview server then squats on its port and holds
  // the project directory locked across runs.
  const child = spawn('node', [`"${join(projectPath, '.output/server/index.mjs')}"`], {
    cwd: projectPath,
    stdio: 'ignore',
    shell: true,
    detached: true,
    env: { ...process.env, NO_COLOR: '1', PORT: String(port) }
  })

  child.on('error', (err) => {
    throw new Error(`Preview server process error: ${err.message}`)
  })

  try {
    await waitForServer(url, 120_000)
  } catch (error) {
    // The server is spawned detached; without this it would outlive the
    // failed suite and hold locks on the project directory.
    stopDevServer(child)
    throw error
  }
  return { process: child, url }
}

export function stopDevServer(child: ChildProcess): void {
  if (child.pid) {
    try {
      if (process.platform === 'win32') {
        // On Windows, negative-PID group kill doesn't work and SIGTERM leaves
        // child processes running (holding file locks). Use taskkill /t to
        // forcefully terminate the entire process tree.
        execSync(`taskkill /pid ${child.pid} /f /t`, { stdio: 'ignore' })
      } else {
        process.kill(-child.pid, 'SIGTERM')
      }
    } catch {
      child.kill('SIGTERM')
    }
  }
}
