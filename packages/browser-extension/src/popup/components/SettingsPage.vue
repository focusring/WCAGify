<script setup lang="ts">
import { computed } from 'vue'
import { useColorMode } from '../../composables/useColorMode'
import { useI18n } from '../../composables/useI18n'
import {
  ACCENT_COLORS,
  NEUTRAL_COLORS,
  useSettings,
  type AccentColor,
  type NeutralColor
} from '../../composables/useSettings'
import { localeLabels, type Locale } from '../../i18n'
import ConnectionSettings from './ConnectionSettings.vue'
import SettingsColorPicker from './SettingsColorPicker.vue'

const emit = defineEmits<{ back: [] }>()

const { preference, cycle } = useColorMode()
const { t, locale } = useI18n()
const { accentColor, neutralColor } = useSettings()

const colorModeIcon = computed(() => {
  if (preference.value === 'dark') return 'i-lucide-moon'
  if (preference.value === 'light') return 'i-lucide-sun'
  return 'i-lucide-monitor'
})

const colorModeLabel = computed(() => {
  if (preference.value === 'dark') return t('colorMode.dark')
  if (preference.value === 'light') return t('colorMode.light')
  return t('colorMode.system')
})

const locales = Object.entries(localeLabels) as [Locale, string][]
const localeItems = computed(() => locales.map(([value, label]) => ({ value, label })))

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

const accentColorSwatches = ACCENT_COLORS.map((name) => ({
  name,
  value: ACCENT_HEX[name] ?? '#000000'
}))
const neutralColorSwatches = NEUTRAL_COLORS.map((name) => ({
  name,
  value: NEUTRAL_HEX[name] ?? '#000000'
}))

function setAccentColor(val: string | undefined) {
  accentColor.value = (val ?? 'green') as AccentColor
}
function setNeutralColor(val: string | undefined) {
  neutralColor.value = (val ?? 'slate') as NeutralColor
}
</script>

<template>
  <div class="min-h-screen p-4 bg-white dark:bg-gray-900 font-sans">
    <!-- Header -->
    <div class="flex items-center gap-2">
      <UIcon name="i-lucide-settings" class="shrink-0 size-6 text-black dark:text-white" />
      <h1 class="text-lg font-bold text-black dark:text-white">{{ t('settings.title') }}</h1>
      <UButton
        @click="emit('back')"
        :label="t('settings.back')"
        icon="i-lucide-arrow-left"
        size="lg"
        color="neutral"
        variant="subtle"
        :aria-label="t('settings.back')"
        :ui="{
          base: 'cursor-pointer font-medium focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary focus-visible:rounded-sm',
          leadingIcon: 'size-4'
        }"
        class="ml-auto"
      />
    </div>

    <USeparator class="my-3" />

    <!-- General -->
    <h2 class="text-sm font-semibold text-muted tracking-wide mb-3">
      {{ t('settings.general') }}
    </h2>
    <section class="bg-elevated rounded-sm p-4 space-y-3 mb-4">
      <ConnectionSettings />

      <!-- Language -->
      <UFormField
        :label="t('settings.languageLabel')"
        :ui="{ label: 'text-sm font-semibold tracking-wide text-gray-700 dark:text-gray-300' }"
        class="flex flex-row items-center justify-between gap-4"
      >
        <USelect
          v-model="locale"
          :items="localeItems"
          :aria-label="t('language')"
          :ui="{
            trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200',
            item: 'data-highlighted:not-data-disabled:before:bg-elevated data-highlighted:not-data-disabled:before:ring-2 data-highlighted:not-data-disabled:before:ring-inset data-highlighted:not-data-disabled:before:ring-primary'
          }"
          variant="subtle"
          size="lg"
          class="w-auto min-w-28 cursor-pointer"
        />
      </UFormField>

      <div class="space-y-3">
        <span class="block text-sm font-medium">
          {{ t('settings.accentColor') }}
        </span>
        <SettingsColorPicker
          :colors="accentColorSwatches"
          :model-value="accentColor"
          :label="t('settings.accentColor')"
          name="accent-color"
          @update:model-value="setAccentColor($event)"
        />
      </div>

      <div class="space-y-3">
        <span class="block text-sm font-medium">
          {{ t('settings.backgroundShade') }}
        </span>
        <SettingsColorPicker
          :colors="neutralColorSwatches"
          :model-value="neutralColor"
          :label="t('settings.backgroundShade')"
          name="background-shade"
          @update:model-value="setNeutralColor($event)"
        />
      </div>
    </section>

    <!-- Appearance -->
    <h2 class="text-sm font-semibold text-muted tracking-wide mb-3">
      {{ t('settings.appearance') }}
    </h2>
    <section class="bg-elevated rounded-sm space-y-3 p-4">
      <!-- Theme -->
      <UFormField
        :label="t('settings.colorMode')"
        :ui="{ label: 'text-sm font-semibold tracking-wide text-gray-700 dark:text-gray-300' }"
        class="flex flex-row items-center justify-between gap-4"
      >
        <UButton
          @click="cycle"
          :aria-label="`${t('colorMode.dark')}/${t('colorMode.light')}/${t('colorMode.system')}: ${colorModeLabel}`"
          :ui="{
            base: 'cursor-pointer focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary focus-visible:rounded-sm',
            leadingIcon: 'size-4'
          }"
          :leading-icon="colorModeIcon"
          :label="colorModeLabel"
          size="lg"
          color="neutral"
          variant="subtle"
          class="min-w-28"
        />
      </UFormField>
    </section>
  </div>
</template>
