import { ref, watch } from 'vue'

type ColorMode = 'system' | 'light' | 'dark'

const COLOR_MODES: ColorMode[] = ['system', 'light', 'dark']

function isColorMode(value: unknown): value is ColorMode {
  return COLOR_MODES.includes(value as ColorMode)
}

const preference = ref<ColorMode>('system')
let initPromise: Promise<void> | undefined

function getSystemDark(): boolean {
  return globalThis.matchMedia('(prefers-color-scheme: dark)').matches
}

function apply(pref: ColorMode = preference.value) {
  const isDark = pref === 'dark' || (pref === 'system' && getSystemDark())
  document.documentElement.classList.toggle('dark', isDark)
}

function initColorMode(): Promise<void> {
  if (!initPromise) {
    initPromise = chrome.storage.local.get(['colorMode']).then((result) => {
      if (isColorMode(result.colorMode)) preference.value = result.colorMode
      apply()

      globalThis.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (preference.value === 'system') apply()
      })

      watch(preference, (val) => {
        chrome.storage.local.set({ colorMode: val })
        apply(val)
      })
    })
  }
  return initPromise
}

function cycle() {
  const idx = COLOR_MODES.indexOf(preference.value)
  preference.value = COLOR_MODES[(idx + 1) % COLOR_MODES.length]!
}

export function useColorMode() {
  void initColorMode()
  return { preference, cycle }
}

export { initColorMode }
