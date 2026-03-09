import { useLocalStorage } from '@vueuse/core'

const ACCENT_COLORS = ['green', 'blue', 'red', 'orange', 'teal', 'indigo', 'violet'] as const
const NEUTRAL_COLORS = ['slate', 'gray', 'zinc', 'neutral', 'stone'] as const

type AccentColor = (typeof ACCENT_COLORS)[number]
type NeutralColor = (typeof NEUTRAL_COLORS)[number]

interface AppSettings {
  accentColor: AccentColor
  neutralColor: NeutralColor
}

const STORAGE_KEY = 'wcagify-settings'

const DEFAULT_SETTINGS: AppSettings = {
  accentColor: 'green',
  neutralColor: 'slate'
}

let settingsRef: ReturnType<typeof useLocalStorage<AppSettings>> | undefined = undefined

function useSettings() {
  if (!settingsRef) {
    settingsRef = useLocalStorage<AppSettings>(STORAGE_KEY, DEFAULT_SETTINGS, {
      mergeDefaults: true
    })
  }

  if (import.meta.client) {
    watch(
      () => settingsRef!.value.accentColor,
      (color) => {
        updateAppConfig({ ui: { colors: { primary: color } } })
      },
      { immediate: true }
    )

    watch(
      () => settingsRef!.value.neutralColor,
      (color) => {
        updateAppConfig({ ui: { colors: { neutral: color } } })
      },
      { immediate: true }
    )

  }

  return { settings: settingsRef }
}

export { ACCENT_COLORS, NEUTRAL_COLORS, useSettings }
export type { AccentColor, NeutralColor, AppSettings }
