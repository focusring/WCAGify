import { ref, watch } from 'vue'
import { z } from 'zod'
import type { Report } from '../types'

export const ACCENT_COLORS = ['green', 'blue', 'red', 'orange', 'teal', 'indigo', 'violet'] as const
export const NEUTRAL_COLORS = ['slate', 'gray', 'zinc', 'neutral', 'stone'] as const

export type AccentColor = (typeof ACCENT_COLORS)[number]
export type NeutralColor = (typeof NEUTRAL_COLORS)[number]

const settingsSchema = z.object({
  wcagifyUrl: z.string().url('wcagifyUrl must be a valid URL').optional(),
  reportSlug: z.string().optional(),
  accentColor: z.enum(ACCENT_COLORS).optional(),
  neutralColor: z.enum(NEUTRAL_COLORS).optional()
})

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]

function applyAccentColor(color: AccentColor) {
  const root = document.documentElement
  for (const shade of SHADES) {
    root.style.setProperty(`--ui-color-primary-${shade}`, `var(--color-${color}-${shade})`)
  }
}

function applyNeutralColor(color: NeutralColor) {
  const root = document.documentElement
  for (const shade of SHADES) {
    root.style.setProperty(`--ui-color-neutral-${shade}`, `var(--color-${color}-${shade})`)
  }
}

const wcagifyUrl = ref('http://localhost:3000')
const reportSlug = ref('')
const reports = ref<Report[]>([])
const accentColor = ref<AccentColor>('green')
const neutralColor = ref<NeutralColor>('slate')

let ready = false
let loadPromise: Promise<void> | null = null

async function doLoad() {
  const parsed = settingsSchema.safeParse(
    await chrome.storage.local.get(['wcagifyUrl', 'reportSlug', 'accentColor', 'neutralColor'])
  )
  if (parsed.success) {
    const {
      wcagifyUrl: url,
      reportSlug: slug,
      accentColor: color,
      neutralColor: neutral
    } = parsed.data
    if (url && /^https?:\/\//.test(url)) wcagifyUrl.value = url
    if (slug) reportSlug.value = slug
    if (color) accentColor.value = color
    if (neutral) neutralColor.value = neutral
  }
  applyAccentColor(accentColor.value)
  applyNeutralColor(neutralColor.value)
  ready = true
}

function load() {
  if (!loadPromise) loadPromise = doLoad()
  return loadPromise
}

watch(wcagifyUrl, (val) => {
  if (ready && /^https?:\/\//.test(val)) chrome.storage.local.set({ wcagifyUrl: val })
})
watch(reportSlug, (val) => {
  if (ready) chrome.storage.local.set({ reportSlug: val })
})
watch(accentColor, (val) => {
  if (ready) {
    chrome.storage.local.set({ accentColor: val })
    applyAccentColor(val)
  }
})
watch(neutralColor, (val) => {
  if (ready) {
    chrome.storage.local.set({ neutralColor: val })
    applyNeutralColor(val)
  }
})

export function useSettings() {
  load()
  return { wcagifyUrl, reportSlug, reports, accentColor, neutralColor }
}
