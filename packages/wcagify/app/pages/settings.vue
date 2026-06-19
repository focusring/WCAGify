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
  <div class="flex-1 py-12 sm:py-16 w-full">
    <article class="max-w-2xl mx-auto">
      <header class="mb-12">
        <div class="flex items-center justify-between mb-4">
          <h1 class="text-3xl sm:text-4xl font-medium">
            {{ t('settings.title') }}
          </h1>
          <UButton
            color="neutral"
            variant="subtle"
            icon="i-lucide-arrow-big-left"
            class="shrink-0 h-9"
            @click="router.back()"
          >
            <span class="sr-only sm:not-sr-only">{{ t('settings.back').toLowerCase() }}</span>
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
        <UFormField
          :label="t('settings.language')"
          name="language"
          orientation="horizontal"
          :ui="{ label: 'label-title', root: 'bg-elevated rounded-sm p-4 sm:p-6' }"
        >
          <ClientOnly>
            <ULocaleSelect
              :locales="locales as any"
              :model-value="locale"
              @update:model-value="onLocaleChange($event)"
              :ui="{
                base: 'cursor-pointer min-w-32 ring-neutral-500',
                item: 'cursor-pointer',
                trailingIcon: 'text-toned icon-animation'
              }"
            />
          </ClientOnly>
        </UFormField>

        <!-- Appearance -->
        <h2 class="text-sm! text-toned! tracking-wide mb-3">
          {{ t('settings.appearance') }}
        </h2>
        <div class="bg-elevated rounded-sm p-4 sm:p-6 space-y-6">
          <!-- Theme -->
          <UFormField
            :label="t('settings.theme')"
            name="theme-select"
            orientation="horizontal"
            :ui="{ label: 'label-title' }"
            class="items-center"
          >
            <UColorModeSelect
              :ui="{
                base: 'cursor-pointer max-w-48 ring-neutral-500',
                item: 'cursor-pointer',
                trailingIcon: 'text-toned icon-animation',
                leadingIcon: 'text-toned'
              }"
            />
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
  </div>
</template>
