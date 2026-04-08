import { ref, watch, onMounted } from 'vue'

type ColorMode = 'system' | 'light' | 'dark'

const preference = ref<ColorMode>('system')
let initialized = false

function getSystemDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function apply(pref: ColorMode) {
  const isDark = pref === 'dark' || (pref === 'system' && getSystemDark())
  document.documentElement.classList.toggle('dark', isDark)
}

export function useColorMode() {
  if (!initialized) {
    initialized = true

    chrome.storage.local.get(['colorMode']).then((result) => {
      if (result.colorMode) preference.value = result.colorMode as ColorMode
      apply(preference.value)
    })

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (preference.value === 'system') apply('system')
    })

    watch(preference, (val) => {
      chrome.storage.local.set({ colorMode: val })
    })
  }

  onMounted(() => apply(preference.value))

  function cycle() {
    const modes: ColorMode[] = ['system', 'light', 'dark']
    const idx = modes.indexOf(preference.value)
    preference.value = modes[(idx + 1) % modes.length]!
    apply(preference.value)
  }

  return { preference, cycle }
}
