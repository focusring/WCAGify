import { existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { cancel, confirm, intro, isCancel, log, outro, spinner, text } from '@clack/prompts'
import ejs from 'ejs'
import pc from 'picocolors'

import { fetchLatestWcagifyVersion } from './version.js'

interface SafeSpinner {
  start: (msg?: string) => void
  stop: (msg?: string) => void
  message: (msg?: string) => void
}

function createSafeSpinner(): SafeSpinner {
  const isTTY = process.stdout.isTTY && process.stdin.isTTY

  if (isTTY) {
    const s = spinner()
    return {
      start: (msg?: string) => s.start(msg),
      stop: (msg?: string) => s.stop(msg),
      message: (msg?: string) => s.message(msg)
    }
  }

  return {
    start: () => {},
    stop: () => {},
    message: () => {}
  }
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const templatesDir = join(__dirname, '..', 'templates')

interface CreateOptions {
  name?: string
  git?: boolean
  install?: boolean
}

interface TemplateData {
  projectName: string
  wcagifyVersion: string
  date: string
}

const createdPaths: string[] = []

function trackPath(path: string): void {
  createdPaths.push(path)
}

function cleanup(): void {
  for (const path of createdPaths.toReversed()) {
    try {
      if (existsSync(path)) {
        rmSync(path, { recursive: true, force: true })
      }
    } catch {}
  }
}

function getOutputFileName(templateFileName: string): string {
  const name = templateFileName.replace('.ejs', '')
  if (name === 'gitignore') return '.gitignore'
  if (name === 'dockerignore') return '.dockerignore'
  if (name === 'npmrc') return '.npmrc'
  if (name === 'env.example') return '.env.example'
  return name
}

async function renderTemplate(templatePath: string, data: TemplateData): Promise<string> {
  return ejs.renderFile(templatePath, data)
}

async function renderTemplatesRecursively(
  sourceDir: string,
  targetDir: string,
  data: TemplateData
): Promise<void> {
  const entries = readdirSync(sourceDir)

  for (const entry of entries) {
    const sourcePath = join(sourceDir, entry)
    const stat = statSync(sourcePath)

    if (stat.isDirectory()) {
      const subTargetDir = join(targetDir, entry)
      mkdirSync(subTargetDir, { recursive: true })
      await renderTemplatesRecursively(sourcePath, subTargetDir, data)
    } else if (entry.endsWith('.ejs')) {
      const outputFileName = getOutputFileName(entry)
      const outputPath = join(targetDir, outputFileName)
      const content = await renderTemplate(sourcePath, data)
      writeFileSync(outputPath, content, 'utf8')
    }
  }
}

function runCommand(command: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit'
    })

    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Command "${command} ${args.join(' ')}" exited with code ${code}`))
      }
    })
  })
}

function validateProjectName(value: string | undefined): string | undefined {
  if (!value?.trim()) return 'Project name is required'
  if (!/^[a-z0-9-]+$/.test(value)) return 'Must be lowercase alphanumeric with hyphens only'
  if (value.startsWith('-') || value.endsWith('-')) return 'Cannot start or end with a hyphen'
  return undefined
}

async function create(options: CreateOptions = {}): Promise<void> {
  const s = createSafeSpinner()

  try {
    let projectName = ''
    let initGit = true
    let runInstall = true

    if (options.name !== undefined) {
      projectName = options.name
      initGit = options.git ?? true
      runInstall = options.install ?? true

      const validationError = validateProjectName(projectName)
      if (validationError) {
        log.error(validationError)
        process.exit(1)
      }
    } else {
      intro(pc.cyan('Create a new WCAGify project'))

      const projectNameResult = await text({
        message: 'What is your project name?',
        placeholder: 'my-audit',
        validate: validateProjectName
      })

      if (isCancel(projectNameResult)) {
        cancel('Operation cancelled')
        process.exit(0)
      }

      projectName = projectNameResult

      const initGitResult = await confirm({
        message: 'Initialize a git repository?',
        initialValue: true
      })

      if (isCancel(initGitResult)) {
        cancel('Operation cancelled')
        process.exit(0)
      }

      initGit = initGitResult

      const runInstallResult = await confirm({
        message: 'Run pnpm install after scaffolding?',
        initialValue: true
      })

      if (isCancel(runInstallResult)) {
        cancel('Operation cancelled')
        process.exit(0)
      }

      runInstall = runInstallResult
    }

    const targetDir = join(process.cwd(), projectName)

    if (existsSync(targetDir)) {
      log.error(`Directory "${projectName}" already exists`)
      process.exit(1)
    }

    mkdirSync(targetDir, { recursive: true })
    trackPath(targetDir)

    s.start('Creating project...')

    const latestWcagify = await fetchLatestWcagifyVersion()
    const wcagifyVersion = `^${latestWcagify}`

    const templateData: TemplateData = {
      projectName,
      wcagifyVersion,
      date: new Date().toISOString().split('T')[0]
    }

    const templateDir = join(templatesDir, 'default')
    if (!existsSync(templateDir)) {
      throw new Error('Template "default" not found')
    }

    await renderTemplatesRecursively(templateDir, targetDir, templateData)

    s.stop('Project created')

    if (initGit) {
      s.start('Initializing git repository...')
      try {
        await runCommand('git', ['init'], targetDir)
        s.stop('Git repository initialized')
      } catch {
        s.stop('Failed to initialize git repository')
        log.warn('Git initialization failed. You can run "git init" manually.')
      }
    }

    if (runInstall) {
      s.start('Installing dependencies (this may take a while)...')
      try {
        await runCommand('pnpm', ['install'], targetDir)
        s.stop('Dependencies installed')
      } catch {
        s.stop('Failed to install dependencies')
        log.warn('Dependency installation failed. You can run "pnpm install" manually.')
      }
    }

    createdPaths.length = 0

    outro(pc.green('Project created successfully!'))

    console.log('')
    console.log(pc.cyan('Next steps:'))
    console.log(`  ${pc.dim('$')} cd ${projectName}`)
    if (!runInstall) {
      console.log(`  ${pc.dim('$')} pnpm install`)
    }
    console.log(`  ${pc.dim('$')} pnpm dev`)
    console.log('')
  } catch (error) {
    s.stop('Failed')

    if (createdPaths.length > 0) {
      log.warn('Cleaning up partial files...')
      cleanup()
      log.info('Cleanup complete')
    }

    const message = error instanceof Error ? error.message : 'Unknown error occurred'
    log.error(message)
    process.exit(1)
  }
}

export {
  create,
  validateProjectName,
  getOutputFileName,
  createSafeSpinner,
  trackPath,
  cleanup,
  renderTemplate,
  renderTemplatesRecursively,
  runCommand
}
export type { CreateOptions, TemplateData, SafeSpinner }
