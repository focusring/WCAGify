import en from './en'
import nl from './nl'

type DeepStringify<T> = {
  [K in keyof T]: T[K] extends Record<string, unknown> ? DeepStringify<T[K]> : string
}

type Messages = DeepStringify<typeof en>
type Locale = 'en' | 'nl'

const messages: Record<Locale, Messages> = { en, nl }
const supportedLocales = Object.keys(messages) as Locale[]

const localeLabels: Record<Locale, string> = {
  en: 'English',
  nl: 'Nederlands'
}

export { messages, supportedLocales, localeLabels }
export type { Messages, Locale }
