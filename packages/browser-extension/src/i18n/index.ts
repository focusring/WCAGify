import en from './en'
import nl from './nl'

type DeepStringify<T> = {
  [K in keyof T]: T[K] extends Record<string, unknown> ? DeepStringify<T[K]> : string
}

export type Messages = DeepStringify<typeof en>
export type Locale = 'en' | 'nl'

export const messages: Record<Locale, Messages> = { en, nl }

export const localeLabels: Record<Locale, string> = {
  en: 'English',
  nl: 'Nederlands'
}
