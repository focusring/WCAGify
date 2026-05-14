<script setup lang="ts">
import { ACCENT_COLORS, NEUTRAL_COLORS } from '../composables/useSettings'
import type { AccentColor, NeutralColor } from '../composables/useSettings'

const { t, locale, locales, setLocale: setNuxtLocale } = useI18n()
const router = useRouter()
const { settings } = useSettings()

const ACCENT_HEX: Record<AccentColor, string> = {
  green: '#22c55e',
  blue: '#3b82f6',
  red: '#ef4444',
  orange: '#f97316',
  teal: '#14b8a6',
  indigo: '#6366f1',
  violet: '#8b5cf6'
}

const NEUTRAL_HEX: Record<NeutralColor, string> = {
  slate: '#64748b',
  gray: '#6b7280',
  zinc: '#71717a',
  neutral: '#737373',
  stone: '#78716c'
}

const accentColorSwatches = ACCENT_COLORS.map((name) => ({
  name,
  value: ACCENT_HEX[name]
}))

const neutralColorSwatches = NEUTRAL_COLORS.map((name) => ({
  name,
  value: NEUTRAL_HEX[name]
}))

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
          <h1 class="text-3xl sm:text-4xl font-medium">
            {{ t('settings.title') }}
          </h1>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-arrow-left"
            class="-mx-1.5 shrink-0 cursor-pointer"
            @click="router.back()"
          >
            <span class="sr-only sm:not-sr-only">{{ t('settings.back') }}</span>
          </UButton>
        </div>
        <p class="text-lg text-toned">
          {{ t('settings.tagline') }}
        </p>
      </header>

      <div class="space-y-8">
        <!-- Language -->
        <h2 class="text-sm! text-toned! tracking-wide mb-3">
          {{ t('settings.generalSection') }}
        </h2>
        <div class="bg-elevated border border-default rounded-sm p-4 sm:p-6">
          <UFormField
            :label="t('settings.language')"
            name="language"
            orientation="horizontal"
            :ui="{ label: 'label-title' }"
          >
            <ClientOnly>
              <ULocaleSelect
                :locales="locales as any"
                :model-value="locale"
                @update:model-value="onLocaleChange($event)"
                :ui="{
                  base: 'cursor-pointer min-w-32',
                  item: 'cursor-pointer'
                }"
              />
            </ClientOnly>
          </UFormField>
        </div>

        <!-- Appearance -->
        <h2 class="text-sm! text-toned! tracking-wide mb-3">
          {{ t('settings.appearance') }}
        </h2>
        <div class="bg-elevated border border-default rounded-sm p-4 sm:p-6 space-y-6">
          <!-- Theme -->
          <UFormField
            :label="t('settings.theme')"
            name="theme-select"
            orientation="horizontal"
            :ui="{ label: 'label-title' }"
            class="items-center"
          >
            <UColorModeSelect class="max-w-48" />
          </UFormField>

          <!-- Accent Color -->
          <UFormField
            :label="t('settings.accentColor') + ` - ${settings.accentColor}`"
            name="accent-color"
            :ui="{ label: 'label-title' }"
            class="flex flex-row items-center justify-between"
          >
            <SettingsColorPicker
              :colors="accentColorSwatches"
              :model-value="settings.accentColor"
              :label="t('settings.accentColor') + ` - ${settings.accentColor}`"
              name="accent-color"
              @update:model-value="settings.accentColor = $event as AccentColor"
            />
          </UFormField>

          <!-- Background Shade -->
          <UFormField
            :label="t('settings.backgroundShade')"
            name="background-shade"
            :ui="{ label: 'label-title' }"
            class="flex flex-row items-center justify-between"
          >
            <SettingsColorPicker
              :colors="neutralColorSwatches"
              :model-value="settings.neutralColor"
              :label="t('settings.backgroundShade')"
              name="background-shade"
              @update:model-value="settings.neutralColor = $event as NeutralColor"
            />
          </UFormField>
        </div>
      </div>
    </article>
  </main>
</template>
