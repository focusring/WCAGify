export function defineWcagifyConfig<T extends Record<string, unknown>>(
  userConfig: T = {} as T
): T & { extends: string[]; compatibilityDate: string } {
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
    compatibilityDate:
      ((userConfig as Record<string, unknown>).compatibilityDate as string) ?? '2025-01-15'
  } as T & { extends: string[]; compatibilityDate: string }
}
