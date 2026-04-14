import { execSync, spawn, type ChildProcess } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = join(__dirname, '../../..')
const TMP_DIR = join(ROOT_DIR, '.tmp')
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

  if (existsSync(projectPath)) {
    rmSync(projectPath, { recursive: true, force: true })
  }

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

export function cleanupTmpDir(): void {
  if (!existsSync(TMP_DIR)) return

  // On Windows, lingering dev-server (node/nuxt) processes can hold file locks
  // on .tmp, causing EPERM. Kill any node processes still rooted in .tmp first.
  if (process.platform === 'win32') {
    try {
      execSync(`taskkill /f /fi "IMAGENAME eq node.exe" /fi "STATUS eq RUNNING" >nul 2>&1`, {
        stdio: 'ignore',
        shell: true
      })
    } catch {
      // ignore — taskkill exits non-zero when no matching processes are found
    }
    // Give Windows a moment to release file handles after killing processes
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500)
  }

  try {
    rmSync(TMP_DIR, { recursive: true, force: true, maxRetries: 5, retryDelay: 1000 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn(`Warning: could not fully clean up ${TMP_DIR}: ${message}`)
    console.warn('You may need to delete it manually or restart the terminal.')
  }
}

export function cleanupProject(name: string): void {
  const projectPath = join(TMP_DIR, name)
  if (existsSync(projectPath)) {
    rmSync(projectPath, { recursive: true, force: true })
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
  // Disable pnpm trust-downgrade checks for test projects.
  // Several transitive deps (chokidar, semver, …) lost provenance attestation
  // in a patch release, triggering ERR_PNPM_TRUST_DOWNGRADE.
  // --trust-policy-ignore-after 1 ignores downgrades for packages published
  // more than 1 minute ago, which covers all currently known problem packages.
  // This is safe because these are throwaway projects created just for tests.
  try {
    execSync('pnpm install --no-frozen-lockfile --ignore-workspace --trust-policy-ignore-after 1', {
      cwd: projectPath,
      stdio: 'pipe',
      timeout: 120_000,
      env: { ...process.env, NO_COLOR: '1', CI: '1' }
    })
  } catch (error) {
    const execError = error as { stdout?: string; stderr?: string; message?: string }
    throw new Error(
      `pnpm install failed:\nstdout: ${execError.stdout}\nstderr: ${execError.stderr}`
    )
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

  await waitForServer(url, 120_000)
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
