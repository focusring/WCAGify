#!/usr/bin/env node
/*
 * WCAG-EM Step 3.2: pick the random sample set from the inventory of views.
 *
 *   node random-sample.mjs --pool views.txt --exclude structured.txt [--count N] [--seed N]
 *
 * --pool     every view found in the scope, one URL per line (the whole inventory,
 *            so the selection "spans the entire scope of the digital product")
 * --exclude  the structured sample set (Step 3.1), one URL per line; never picked again
 * --count    how many to pick; defaults to 10% of the excluded set, rounded up
 * --seed     replay a previous selection; a fresh seed is drawn and printed otherwise
 *
 * Prints the picked URLs, then a "Method:" line to record in the report.
 */
import { readFileSync } from 'node:fs'
import { parseArgs } from 'node:util'

const { values } = parseArgs({
  options: {
    pool: { type: 'string' },
    exclude: { type: 'string' },
    count: { type: 'string' },
    seed: { type: 'string' }
  }
})

if (!values.pool || !values.exclude) {
  console.error(
    'Usage: random-sample.mjs --pool <views.txt> --exclude <structured.txt> [--count N] [--seed N]'
  )
  process.exit(1)
}

function normalize(url) {
  const trimmed = url.trim().replace(/#.*$/, '')
  return trimmed.length > 1 ? trimmed.replace(/\/$/, '') : trimmed
}

function readList(path) {
  const lines = readFileSync(path, 'utf8')
    .split('\n')
    .map(normalize)
    .filter((line) => line && !line.startsWith('#'))
  return [...new Set(lines)]
}

const TWO_POW_32 = 4_294_967_296
const MULBERRY_INCREMENT = 1_831_565_813 // 0x6D2B79F5

// Mulberry32: small seeded generator, so a recorded seed replays the same picks.
function seededRandom(seed) {
  let state = seed >>> 0
  return () => {
    state = (state + MULBERRY_INCREMENT) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / TWO_POW_32
  }
}

const pool = readList(values.pool)
const excluded = new Set(readList(values.exclude))
const candidates = pool.filter((url) => !excluded.has(url))
const count = values.count ? Number(values.count) : Math.ceil(excluded.size / 10)
const seed = values.seed ? Number(values.seed) : Math.floor(Math.random() * TWO_POW_32)

if (!Number.isInteger(count) || count < 0 || !Number.isInteger(seed)) {
  console.error('--count and --seed must be whole numbers')
  process.exit(1)
}

const random = seededRandom(seed)
const shuffled = [...candidates]
for (let i = shuffled.length - 1; i > 0; i -= 1) {
  const j = Math.floor(random() * (i + 1))
  ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
}
const picked = shuffled.slice(0, count)

for (const url of picked) console.log(url)
console.log('')
console.log(
  `Method: ${picked.length} of ${candidates.length} candidate views (inventory of ${pool.length} minus ${excluded.size} structured samples), seeded shuffle (mulberry32, seed ${seed}) by wcag-em-sample/scripts/random-sample.mjs`
)
if (picked.length < count) {
  console.log(
    `Note: only ${picked.length} candidate view(s) remained outside the structured sample set; WCAG-EM 3.2 counts the step as completed when there are no new views to be found.`
  )
}
