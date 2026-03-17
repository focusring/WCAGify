const ACCENT_COLORS = ['green', 'blue', 'red', 'orange', 'teal', 'indigo', 'violet'] as const
const NEUTRAL_COLORS = ['slate', 'gray', 'zinc', 'neutral', 'stone'] as const

type AccentColor = (typeof ACCENT_COLORS)[number]
type NeutralColor = (typeof NEUTRAL_COLORS)[number]

interface AppSettings {
  accentColor: AccentColor
  neutralColor: NeutralColor
}

const COOKIE_KEY = 'wcagify-settings'
const LEGACY_STORAGE_KEY = 'wcagify-settings'

const DEFAULT_SETTINGS: AppSettings = {
  accentColor: 'green',
  neutralColor: 'slate'
}

function useSettings() {
  const cookie = useCookie<AppSettings>(COOKIE_KEY, {
    default: () => ({ ...DEFAULT_SETTINGS }),
    watch: true,
    maxAge: 60 * 60 * 24 * 365
  })

  // Migrate from localStorage to cookie on first client load
  if (
    import.meta.client &&
    cookie.value.accentColor === DEFAULT_SETTINGS.accentColor &&
    cookie.value.neutralColor === DEFAULT_SETTINGS.neutralColor
  ) {
    try {
      const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppSettings>
        if (parsed.accentColor && ACCENT_COLORS.includes(parsed.accentColor as AccentColor)) {
          cookie.value.accentColor = parsed.accentColor as AccentColor
        }
        if (parsed.neutralColor && NEUTRAL_COLORS.includes(parsed.neutralColor as NeutralColor)) {
          cookie.value.neutralColor = parsed.neutralColor as NeutralColor
        }
        localStorage.removeItem(LEGACY_STORAGE_KEY)
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  watch(
    () => cookie.value.accentColor,
    (color) => {
      updateAppConfig({ ui: { colors: { primary: color } } })
    },
    { immediate: true }
  )

  watch(
    () => cookie.value.neutralColor,
    (color) => {
      updateAppConfig({ ui: { colors: { neutral: color } } })
    },
    { immediate: true }
  )

  return { settings: cookie }
}

export { ACCENT_COLORS, NEUTRAL_COLORS, useSettings }
export type { AccentColor, NeutralColor, AppSettings }
