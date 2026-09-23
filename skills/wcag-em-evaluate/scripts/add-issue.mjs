#!/usr/bin/env node
/*
 * Writes one issue of a WCAGify report from an evaluator draft, placing its images the way the
 * app's own upload flow does.
 *
 *   node add-issue.mjs --report content/reports/<slug> --from .notes/audit/drafts/<name>.md
 *   node add-issue.mjs --report content/reports/<slug> --from <draft.md> --dry-run
 *
 * The draft is markdown with frontmatter:
 *
 *   ---
 *   title: Focus style missing on interactive elements
 *   sc: 2.4.7
 *   sample: page-1
 *   severity: Medium            # Low | Medium | High (optional)
 *   type: Design                # Content | Technical | Design (optional)
 *   difficulty: Low             # Low | Medium | High (optional)
 *   images:                     # optional; paths relative to the draft file
 *     - file: ../evidence/page-1-focus.png
 *       alt: The main navigation with the third link focused and no visible focus indicator.
 *     - file: ../evidence/page-1-focus.webm
 *       alt: Tabbing through the navigation, no link shows a focus indicator.
 *   ---
 *   <problem description, one to three short paragraphs>
 *
 *   #### Recommendation
 *
 *   <the fix>
 *
 * What it does, matching packages/wcagify/server/api/issues/index.post.ts and upload.post.ts:
 * - validates the frontmatter against the report's own @focusring/wcagify `issueSchema`;
 * - names every image `<issue-slug>-<sc digits>-<8 hex>.<ext>` and stores it in
 *   `<project>/uploads/<report-slug>/`, where the app serves it at
 *   `/api/uploads/<report-slug>/<file>`;
 * - converts PNG/JPEG to WebP with sharp when the package's sharp is resolvable (the upload flow
 *   does the same), keeps GIF as GIF, and turns a .webm/.mp4 clip into a GIF with ffmpeg
 *   (≤ 800 px wide, 10 fps, palette-optimised), so a recorded interaction stays a moving image;
 * - writes `<report-dir>/<issue-slug>.md` (a numbered suffix on collision) with the images first,
 *   then the draft body.
 * Prints the paths written. Exit code 1 on any validation failure, nothing written then.
 */
import { execFileSync } from 'node:child_process'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { basename, dirname, extname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

const { values } = parseArgs({
  options: {
    report: { type: 'string' },
    from: { type: 'string' },
    'dry-run': { type: 'boolean' }
  }
})
if (!values.report || !values.from) {
  console.error('Usage: add-issue.mjs --report <report-dir> --from <draft.md> [--dry-run]')
  process.exit(1)
}

const reportDir = statSync(values.report).isDirectory()
  ? resolve(values.report)
  : dirname(resolve(values.report))
const reportSlug = basename(reportDir)
const projectRoot = resolve(reportDir, '..', '..', '..')
const draftPath = resolve(values.from)
const failures = []

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(reportSlug))
  failures.push(`report directory name "${reportSlug}" is not a slug`)
if (!existsSync(join(reportDir, 'index.md'))) failures.push(`${reportDir} has no index.md`)
if (
  basename(dirname(reportDir)) !== 'reports' ||
  basename(dirname(dirname(reportDir))) !== 'content'
)
  failures.push(`${reportDir} is not under <project>/content/reports/`)

function findPackage(from) {
  let dir = from
  for (;;) {
    const candidate = join(dir, 'node_modules', '@focusring', 'wcagify')
    if (existsSync(join(candidate, 'package.json'))) return realpathSync(candidate)
    const parent = dirname(dir)
    if (parent === dir) return undefined
    dir = parent
  }
}
const packageDir = findPackage(reportDir)
if (!packageDir) {
  console.error(
    `No @focusring/wcagify install found above ${reportDir}; run the package manager install first.`
  )
  process.exit(1)
}
const entry = join(packageDir, 'dist', 'index.js')
if (!existsSync(entry)) {
  console.error(`${entry} is missing; build it first (pnpm --filter @focusring/wcagify build).`)
  process.exit(1)
}
const pkg = await import(pathToFileURL(entry).href)
const { issueSchema, toSlug, buildIssueFrontmatter } = pkg
// Older package versions do not export the image naming helper; the format is the same.
function fallbackImageName(titleSlug, sc, extension) {
  const hash = globalThis.crypto.randomUUID().slice(0, 8)
  return `${titleSlug}-${sc.replace(/[^0-9.]+/g, '').replace(/\./g, '-')}-${hash}.${extension}`
}
const buildIssueImageName = pkg.buildIssueImageName ?? fallbackImageName
const requireFromPackage = createRequire(join(packageDir, 'package.json'))
const yaml = await import(pathToFileURL(requireFromPackage.resolve('yaml')).href)
const parseYaml = yaml.parse ?? yaml.default.parse
let sharp = undefined
try {
  const sharpModule = await import(pathToFileURL(requireFromPackage.resolve('sharp')).href)
  sharp = sharpModule.default
} catch {
  sharp = undefined
}

const draft = readFileSync(draftPath, 'utf8')
const match = draft.match(/^---\r?\n(?<yaml>[\s\S]*?)\r?\n---(?:\r?\n|$)/)
if (!match) {
  console.error(`${draftPath}: no frontmatter block`)
  process.exit(1)
}
const front = parseYaml(match.groups.yaml) ?? {}
const body = draft.slice(match[0].length).trim()
const { title, images = [], ...rest } = front

if (!title || !String(title).trim()) failures.push('frontmatter: title is required')
const parsed = issueSchema.safeParse(rest)
if (!parsed.success)
  for (const issue of parsed.error.issues)
    failures.push(`frontmatter ${issue.path.join('.') || '(root)'}: ${issue.message}`)

// The sample must exist in the report.
const indexYaml =
  readFileSync(join(reportDir, 'index.md'), 'utf8').match(/^---\r?\n(?<yaml>[\s\S]*?)\r?\n---/)
    ?.groups.yaml ?? ''
const sampleIds = [...indexYaml.matchAll(/^\s*id:\s*['"]?(?<id>[^'"\n]+)['"]?\s*$/gm)].map((m) =>
  m.groups.id.trim()
)
if (rest.sample && !sampleIds.includes(String(rest.sample)))
  failures.push(`sample "${rest.sample}" is not an id in ${reportSlug}/index.md`)

// Body rules of the skill: problem first, one recommendation heading, no evaluator material.
const recommendationHeadings = body.match(/^#{1,6}\s+Recommendation\s*$/gim) ?? []
if (recommendationHeadings.length !== 1)
  failures.push(
    `body must contain exactly one "#### Recommendation" heading (found ${recommendationHeadings.length})`
  )
else if (!/^####\s+Recommendation\s*$/m.test(body))
  failures.push('the recommendation heading must be level 4: "#### Recommendation"')
else if (body.trim().startsWith('#### Recommendation'))
  failures.push('describe the problem before "#### Recommendation"')
if (
  /\b\d{1,3}\s?%\s*(?:certain|certainty|confidence|zeker)/i.test(body) ||
  /\bcertainty\b/i.test(body)
)
  failures.push('body carries a certainty statement; certainty stays in .notes/')
if (/!\[[^\]]*\]\(/.test(body))
  failures.push(
    'put images in the frontmatter `images` list, not in the body; the script places them'
  )

// Images: existence, type, alt text.
const allowed = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.webm', '.mp4'])
const imageList = Array.isArray(images) ? images : []
for (const [i, image] of imageList.entries()) {
  const label = `images[${i}]`
  if (!image || typeof image !== 'object' || !image.file) {
    failures.push(`${label}: needs { file, alt }`)
    continue
  }
  const path = resolve(dirname(draftPath), image.file)
  if (!existsSync(path)) failures.push(`${label}: ${path} does not exist`)
  if (!allowed.has(extname(path).toLowerCase()))
    failures.push(`${label}: ${extname(path)} is not png/jpg/gif/webp/webm/mp4`)
  if (!image.alt || !String(image.alt).trim())
    failures.push(`${label}: alt text is required (describe what the image shows)`)
  else if (String(image.alt).trim().length < 15)
    failures.push(`${label}: alt text is too short to describe the evidence`)
}

if (failures.length) {
  for (const f of failures) console.error(`FAIL: ${f}`)
  process.exit(1)
}

const slug = toSlug(String(title))
if (!slug) {
  console.error('FAIL: title produces an empty slug')
  process.exit(1)
}
let filename = `${slug}.md`
let counter = 1
while (existsSync(join(reportDir, filename))) {
  counter += 1
  if (counter > 100) {
    console.error('FAIL: too many issues with this title')
    process.exit(1)
  }
  filename = `${slug}-${counter}.md`
}
const issueSlug = filename.replace(/\.md$/, '')
const uploadsDir = join(projectRoot, 'uploads', reportSlug)

function ffmpeg(args) {
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    stdio: ['ignore', 'ignore', 'inherit']
  })
}
async function placeImage(image) {
  const source = resolve(dirname(draftPath), image.file)
  const ext = extname(source).toLowerCase()
  const ops = []
  let extension = undefined
  let write = undefined
  if (ext === '.webm' || ext === '.mp4') {
    extension = 'gif'
    write = (target) => {
      const work = mkdtempSync(join(tmpdir(), 'wcagify-gif-'))
      const palette = join(work, 'palette.png')
      try {
        ffmpeg([
          '-i',
          source,
          '-vf',
          'fps=10,scale=800:-1:flags=lanczos,palettegen=stats_mode=diff',
          palette
        ])
        ffmpeg([
          '-i',
          source,
          '-i',
          palette,
          '-lavfi',
          'fps=10,scale=800:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle',
          '-loop',
          '0',
          target
        ])
      } finally {
        rmSync(work, { recursive: true, force: true })
      }
      ops.push('converted to GIF with ffmpeg (10 fps, ≤ 800 px wide)')
    }
  } else if ((ext === '.png' || ext === '.jpg' || ext === '.jpeg') && sharp) {
    extension = 'webp'
    write = async (target) => {
      await sharp(source).webp({ quality: 80 }).toFile(target)
      ops.push('converted to WebP (quality 80), as the upload flow does')
    }
  } else {
    extension = ext.slice(1) === 'jpeg' ? 'jpg' : ext.slice(1)
    write = (target) => {
      copyFileSync(source, target)
      ops.push(ext === '.gif' ? 'copied as GIF (animation kept)' : 'copied unchanged')
    }
  }
  const name = buildIssueImageName(issueSlug, String(rest.sc), extension)
  const target = join(uploadsDir, name)
  if (values['dry-run']) {
    if (extension === 'gif' && ext !== '.gif') ops.push('would convert to GIF with ffmpeg')
    else if (extension === 'webp' && ext !== '.webp') ops.push('would convert to WebP')
    else ops.push('would copy unchanged')
  } else {
    mkdirSync(uploadsDir, { recursive: true })
    await write(target)
    const { size } = statSync(target)
    if (size > 2 * 1024 * 1024)
      ops.push(
        `warning: ${Math.round(size / 1024)} kB is above the 2 MB the upload flow accepts; shorten the clip or crop the screenshot`
      )
  }
  return {
    url: `/api/uploads/${reportSlug}/${name}`,
    alt: String(image.alt).trim().replace(/\]/g, ')'),
    target,
    ops
  }
}

const placed = []
for (const image of imageList) placed.push(await placeImage(image))

const frontmatter = buildIssueFrontmatter({
  title: String(title).trim(),
  sc: String(rest.sc),
  severity: rest.severity,
  type: rest.type,
  difficulty: rest.difficulty,
  sample: String(rest.sample)
})
const imageLines = placed.map((p) => `![${p.alt}](${p.url})`).join('\n\n')
const content = `${frontmatter}\n\n${imageLines ? `${imageLines}\n\n` : ''}${body}\n`
const issuePath = join(reportDir, filename)
if (values['dry-run']) {
  console.log(`would write ${issuePath}`)
  for (const p of placed) console.log(`would place ${p.target} (${p.ops.join('; ') || 'copy'})`)
  console.log('---')
  console.log(content)
  process.exit(0)
}
writeFileSync(issuePath, content, { flag: 'wx' })
console.log(`wrote ${issuePath}`)
for (const p of placed) console.log(`placed ${p.target}\n  ${p.ops.join('; ')}`)
console.log(`anchor in the report: #issue-reports-${reportSlug}-${issueSlug}`)
