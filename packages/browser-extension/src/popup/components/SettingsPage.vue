<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
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
import logoSvg from '../../assets/wcagify-icon.svg'
import ConnectionSettings from './ConnectionSettings.vue'
import SettingsColorPicker from './SettingsColorPicker.vue'

const version = ref('')
onMounted(() => {
  try {
    version.value = chrome.runtime.getManifest().version
  } catch {}
})

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

function setAccentColor(val: string | undefined) {
  if (val && (ACCENT_COLORS as readonly string[]).includes(val))
    accentColor.value = val as AccentColor
  else accentColor.value = 'green'
}
function setNeutralColor(val: string | undefined) {
  if (val && (NEUTRAL_COLORS as readonly string[]).includes(val))
    neutralColor.value = val as NeutralColor
  else neutralColor.value = 'slate'
}
</script>

<template>
  <div class="min-h-screen p-4 font-sans">
    <!-- Header -->
    <div class="flex items-center gap-2">
      <h1 class="text-lg font-bold text-black dark:text-white">{{ t('settings.title') }}</h1>
      <UButton
        @click="emit('back')"
        :label="t('settings.back')"
        icon="i-lucide-arrow-left"
        size="xl"
        color="neutral"
        variant="subtle"
        :aria-label="t('settings.back')"
        :ui="{
          base: 'cursor-pointer font-medium selectable-focus',
          leadingIcon: 'size-5'
        }"
        class="ml-auto selectable-focus"
      />
    </div>

    <USeparator class="my-3" />

    <div class="lg:grid lg:grid-cols-2 lg:grid-rows-[auto_auto] lg:gap-x-4">
      <!-- General -->
      <h2 class="text-sm font-semibold text-muted tracking-wide mb-3 col-start-1 row-start-1">
        {{ t('settings.general') }}
      </h2>
      <section class="bg-elevated rounded-sm p-4 space-y-3 mb-4 lg:mb-0">
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
              item: 'selectable-focus',
              content: 'overflow-visible'
            }"
            variant="subtle"
            size="lg"
            class="w-auto min-w-36 cursor-pointer selectable-focus"
          />
        </UFormField>
      </section>

      <!-- Appearance -->
      <h2 class="text-sm font-semibold text-muted tracking-wide mb-3 col-start-2 row-start-1">
        {{ t('settings.appearance') }}
      </h2>
      <section class="bg-elevated rounded-sm space-y-5 p-4">
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
              base: 'cursor-pointer',
              leadingIcon: 'size-4'
            }"
            :leading-icon="colorModeIcon"
            :label="colorModeLabel"
            size="lg"
            color="neutral"
            variant="subtle"
            class="min-w-28 selectable-focus"
          />
        </UFormField>

        <div class="space-y-3">
          <span class="block text-sm font-medium" aria-hidden="true">
            {{ t('settings.accentColor') }} - {{ accentColor }}
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
          <span class="block text-sm font-medium" aria-hidden="true">
            {{ t('settings.backgroundShade') }} - {{ neutralColor }}
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
    </div>

    <!-- About -->
    <USeparator class="my-4" />

    <footer
      class="flex flex-col items-center gap-2 text-center text-xs text-muted pb-2 max-w-md mx-auto whitespace-nowrap"
    >
      <img :src="logoSvg" alt="Logo WCAGify" class="size-8" />
      <div class="space-y-1.5">
        <p>
          <a
            href="https://www.wcagify.com"
            target="_blank"
            rel="noopener noreferrer"
            class="font-medium text-primary hover:underline selectable-focus"
            >WCAGify</a
          >
          {{ t('settings.license') }}
          <a
            href="https://wcagify.com/legal/terms-and-conditions"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:underline selectable-focus"
            >{{ t('settings.terms') }}</a
          >
          ·
          <a
            href="https://wcagify.com/legal/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:underline selectable-focus"
            >{{ t('settings.privacy') }}</a
          >
          ·
          <a
            href="https://wcagify.com/legal/security-policy"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:underline selectable-focus"
            >{{ t('settings.security') }}</a
          >
        </p>
        <p>
          {{ t('settings.madeBy') }}
          <a
            href="https://www.focusring.io"
            target="_blank"
            rel="noopener noreferrer"
            class="font-medium text-primary hover:underline selectable-focus"
            >focusring.io</a
          >
          {{ t('settings.inRegion') }}
        </p>
        <p v-if="version">{{ t('settings.version') }} {{ version }}</p>
      </div>
    </footer>
  </div>
</template>
