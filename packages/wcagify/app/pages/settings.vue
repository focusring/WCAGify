<script setup lang="ts">
import { ACCENT_COLORS, NEUTRAL_COLORS } from '../composables/useSettings'
import type { AccentColor, NeutralColor } from '../composables/useSettings'

const { t, locale, locales, setLocale: setNuxtLocale } = useI18n()
const router = useRouter()
const { settings } = useSettings()
const colorMode = useColorMode()

const ACCENT_HEX: Record<string, string> = {
  green: '#22c55e',
  blue: '#3b82f6',
  red: '#ef4444',
  orange: '#f97316',
  teal: '#14b8a6',
  indigo: '#6366f1',
  violet: '#8b5cf6'
}

const NEUTRAL_HEX: Record<string, string> = {
  slate: '#64748b',
  gray: '#6b7280',
  zinc: '#71717a',
  neutral: '#737373',
  stone: '#78716c'
}

const accentColorSwatches = ACCENT_COLORS.map((name: string) => ({
  name,
  value: ACCENT_HEX[name] ?? '#000000'
}))

const neutralColorSwatches = NEUTRAL_COLORS.map((name: string) => ({
  name,
  value: NEUTRAL_HEX[name] ?? '#000000'
}))

const themeOptions = computed(() => [
  { label: t('settings.themeSystem'), value: 'system' },
  { label: t('settings.themeLight'), value: 'light' },
  { label: t('settings.themeDark'), value: 'dark' }
])

const localeOptions = computed(() =>
  locales.value.map((loc) => ({
    label: loc.name || loc.code,
    value: loc.code
  }))
)

async function onLocaleChange(code: string) {
  await setNuxtLocale(code as 'en' | 'nl')
}


useSeoMeta({
  title: () => `${t('settings.title')} — WCAGify`
})
</script>

<template>
  <main class="flex-1 py-12 sm:py-16 w-full">
    <article class="max-w-2xl mx-auto">
      <header class="mb-12">
        <div class="flex items-baseline justify-between gap-4 mb-4">
          <h1 class="font-mono text-3xl sm:text-4xl font-medium">
            {{ t('settings.title') }}
          </h1>
          <button
            type="button"
            class="cursor-pointer inline-flex items-center gap-2 p-1.5 -mx-1.5 font-mono text-sm text-muted hover:text-default transition-colors duration-200 rounded shrink-0"
            @click="router.back()"
          >
            <UIcon name="i-lucide-arrow-left" class="size-4" aria-hidden="true" />
            <span class="sr-only sm:not-sr-only">{{ t('settings.back') }}</span>
          </button>
        </div>
        <p class="text-muted text-lg">
          {{ t('settings.tagline') }}
        </p>
      </header>

      <div class="space-y-8">
        <!-- Appearance -->
        <section>
          <h2 class="text-xs text-muted uppercase tracking-wider mb-4">
            {{ t('settings.appearance') }}
          </h2>
          <div class="bg-elevated border border-default rounded-lg p-4 sm:p-6 space-y-6">
            <div class="space-y-2">
              <label for="theme-select" class="block text-sm font-medium">
                {{ t('settings.theme') }}
              </label>
              <USelect
                id="theme-select"
                v-model="colorMode.preference"
                :items="themeOptions"
                value-key="value"
                class="max-w-48"
              />
            </div>

            <div class="space-y-3">
              <span class="block text-sm font-medium">
                {{ t('settings.accentColor') }}
              </span>
              <SettingsColorPicker
                :colors="accentColorSwatches"
                :model-value="settings.accentColor"
                :label="t('settings.accentColor')"
                name="accent-color"
                @update:model-value="settings.accentColor = ($event ?? 'green') as AccentColor"
              />
            </div>

            <div class="space-y-3">
              <span class="block text-sm font-medium">
                {{ t('settings.backgroundShade') }}
              </span>
              <SettingsColorPicker
                :colors="neutralColorSwatches"
                :model-value="settings.neutralColor"
                :label="t('settings.backgroundShade')"
                name="background-shade"
                @update:model-value="settings.neutralColor = ($event ?? 'slate') as NeutralColor"
              />
            </div>
          </div>
        </section>

        <!-- Language -->
        <section>
          <h2 class="text-xs text-muted uppercase tracking-wider mb-4">
            {{ t('settings.languageSection') }}
          </h2>
          <div class="bg-elevated border border-default rounded-lg p-4 sm:p-6">
            <div class="space-y-2">
              <label for="language-select" class="block text-sm font-medium">
                {{ t('settings.language') }}
              </label>
              <ClientOnly>
                <USelect
                  id="language-select"
                  :model-value="locale"
                  :items="localeOptions"
                  value-key="value"
                  class="max-w-48"
                  @update:model-value="onLocaleChange($event)"
                />
              </ClientOnly>
            </div>
          </div>
        </section>


      </div>
    </article>
  </main>
</template>
