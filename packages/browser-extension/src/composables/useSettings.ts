import { ref, watch } from 'vue'
import type { Report } from '../types'

export const ACCENT_COLORS = ['green', 'blue', 'red', 'orange', 'teal', 'indigo', 'violet'] as const
export const NEUTRAL_COLORS = ['slate', 'gray', 'zinc', 'neutral', 'stone'] as const

export type AccentColor = (typeof ACCENT_COLORS)[number]
export type NeutralColor = (typeof NEUTRAL_COLORS)[number]

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
  const result = await chrome.storage.local.get([
    'wcagifyUrl',
    'reportSlug',
    'accentColor',
    'neutralColor'
  ])
  if (result.wcagifyUrl) wcagifyUrl.value = result.wcagifyUrl as string
  if (result.reportSlug) reportSlug.value = result.reportSlug as string
  if (result.accentColor && ACCENT_COLORS.includes(result.accentColor as AccentColor))
    accentColor.value = result.accentColor as AccentColor
  if (result.neutralColor && NEUTRAL_COLORS.includes(result.neutralColor as NeutralColor))
    neutralColor.value = result.neutralColor as NeutralColor
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
