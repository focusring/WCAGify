type DateString =
  | ''
  | 'latest'
  | `${number}${number}${number}${number}-${'0' | '1'}${number}-${'0' | '1' | '2' | '3'}${number}`

const DEFAULT_COMPAT_DATE: DateString = '2025-01-15'

export function defineWcagifyConfig<T extends Record<string, unknown>>(
  userConfig: T = {} as T
): T & { extends: string[]; compatibilityDate: DateString } {
  const configExtends = (userConfig as Record<string, unknown>).extends
  let userExtends: unknown[] = []
  if (Array.isArray(configExtends)) {
    userExtends = configExtends
  } else if (configExtends) {
    userExtends = [configExtends]
  }

  return {
    ...userConfig,
    extends: ['@focusring/wcagify/layer', ...userExtends],
    compatibilityDate: (userConfig.compatibilityDate as DateString) ?? DEFAULT_COMPAT_DATE
  } as T & { extends: string[]; compatibilityDate: DateString }
}
