import { ref, watch } from 'vue'

type ColorMode = 'system' | 'light' | 'dark'

const COLOR_MODES: readonly ColorMode[] = ['system', 'light', 'dark']

function isColorMode(value: unknown): value is ColorMode {
  return typeof value === 'string' && (COLOR_MODES as readonly string[]).includes(value)
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
  const modes: ColorMode[] = ['system', 'light', 'dark']
  const idx = modes.indexOf(preference.value)
  preference.value = modes[(idx + 1) % modes.length]!
}

export function useColorMode() {
  void initColorMode()
  return { preference, cycle }
}

export { initColorMode }
