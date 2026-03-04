import type { NuxtConfig } from '@nuxt/schema'

export function defineWcagifyConfig(userConfig: NuxtConfig = {}): NuxtConfig {
  let userExtends: string[] = []
  if (userConfig.extends) {
    userExtends = Array.isArray(userConfig.extends)
      ? userConfig.extends
      : [userConfig.extends]
  }

  return {
    ...userConfig,
    extends: ['wcagify/layer', ...userExtends],
    compatibilityDate: userConfig.compatibilityDate ?? '2025-01-15'
  }
}
