import { ref, computed, watch } from 'vue'
import { messages, type Locale, type Messages } from '../i18n'

const locale = ref<Locale>('en')

let ready = false
let loadPromise: Promise<void> | null = null

async function doLoad() {
  const result = await chrome.storage.local.get(['locale'])
  if (result.locale && (result.locale as string) in messages) locale.value = result.locale as Locale
  ready = true
}

function load() {
  if (!loadPromise) loadPromise = doLoad()
  return loadPromise
}

watch(locale, (val) => {
  if (ready) chrome.storage.local.set({ locale: val })
})

type NestedKeyOf<T, Prefix extends string = ''> =
  T extends Record<string, unknown>
    ? {
        [K in keyof T & string]: T[K] extends Record<string, unknown>
          ? NestedKeyOf<T[K], `${Prefix}${K}.`>
          : `${Prefix}${K}`
      }[keyof T & string]
    : never

type TranslationKey = NestedKeyOf<Messages>

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.')
  let current: unknown = obj
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return path
    current = (current as Record<string, unknown>)[key]
  }
  return typeof current === 'string' ? current : path
}

export function useI18n() {
  const ready = load()

  const t = (key: TranslationKey): string => {
    return getNestedValue(messages[locale.value] as unknown as Record<string, unknown>, key)
  }

  const currentMessages = computed(() => messages[locale.value])

  return { locale, t, messages: currentMessages, ready }
}
