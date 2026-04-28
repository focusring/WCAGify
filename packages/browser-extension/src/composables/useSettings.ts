import { ref, watch } from 'vue'
import { z } from 'zod'
import type { Report } from '../types'
import { supportedLocales } from '../i18n'
import type { Locale } from '../i18n'
import { useInstanceDiscovery } from './useInstanceDiscovery'
import type { InstanceSettings } from './useInstanceDiscovery'
import { useI18n } from './useI18n'

const ACCENT_COLORS = ['green', 'blue', 'red', 'orange', 'teal', 'indigo', 'violet'] as const
const NEUTRAL_COLORS = ['slate', 'gray', 'zinc', 'neutral', 'stone'] as const

type AccentColor = (typeof ACCENT_COLORS)[number]
type NeutralColor = (typeof NEUTRAL_COLORS)[number]

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

const { scan, scanStatus, instances } = useInstanceDiscovery()

function applyInstanceSettings(settings: InstanceSettings | undefined) {
  if (!settings) return
  const { locale } = useI18n()
  if (settings.accentColor && (ACCENT_COLORS as readonly string[]).includes(settings.accentColor)) {
    accentColor.value = settings.accentColor as AccentColor
  }
  if (
    settings.neutralColor &&
    (NEUTRAL_COLORS as readonly string[]).includes(settings.neutralColor)
  ) {
    neutralColor.value = settings.neutralColor as NeutralColor
  }
  if (settings.locale && (supportedLocales as readonly string[]).includes(settings.locale)) {
    locale.value = settings.locale as Locale
  }
}

// Auto-connect when scan finds exactly one instance
watch(scanStatus, (val) => {
  if (val !== 'done') return
  if (instances.value.length === 1) {
    const instance = instances.value[0]!
    wcagifyUrl.value = instance.url
    reports.value = instance.reports
    applyInstanceSettings(instance.settings)
    if (reportSlug.value && !reports.value.some((r) => r.slug === reportSlug.value)) {
      reportSlug.value = ''
    }
  }
})

let ready = false
let loadPromise: Promise<void> | undefined = undefined

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
  scan()
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

function useSettings() {
  load()
  return {
    wcagifyUrl,
    reportSlug,
    reports,
    accentColor,
    neutralColor,
    scanStatus,
    applyInstanceSettings
  }
}

export { ACCENT_COLORS, NEUTRAL_COLORS, useSettings }
export type { AccentColor, NeutralColor }
