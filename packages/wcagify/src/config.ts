import type { NuxtConfig } from '@nuxt/schema'

export function defineWcagifyConfig(userConfig: NuxtConfig = {}): NuxtConfig {
  const { extends: configExtends, ...rest } = userConfig
  const userExtends = Array.isArray(configExtends)
    ? configExtends
    : configExtends
      ? [configExtends]
      : []

  return {
    ...rest,
    // eslint-disable-next-line no-nested-ternary
    extends: ['@focusring/wcagify/layer', ...userExtends] as NuxtConfig['extends'],
    compatibilityDate: userConfig.compatibilityDate ?? '2025-01-15'
  }
}
