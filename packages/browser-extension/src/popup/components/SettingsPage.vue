<script setup lang="ts">
import { computed, ref, onMounted, nextTick, useTemplateRef } from 'vue'
import { useColorMode } from '../../composables/useColorMode'
import { useI18n } from '../../composables/useI18n'
import { ACCENT_COLORS, NEUTRAL_COLORS, useSettings } from '../../composables/useSettings'
import type { AccentColor, NeutralColor } from '../../composables/useSettings'
import { localeLabels } from '../../i18n'
import type { Locale } from '../../i18n'
import logoSvg from '../../assets/wcagify-icon.svg'
import ConnectionSettings from './ConnectionSettings.vue'
import SettingsColorPicker from './SettingsColorPicker.vue'

const focusSentinel = useTemplateRef<HTMLElement>('focusSentinel')

const version = ref('')
onMounted(async () => {
  try {
    version.value = chrome.runtime.getManifest().version
  } catch {}
  await nextTick()
  focusSentinel.value?.focus()
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
  accentColor.value =
    val && (ACCENT_COLORS as readonly string[]).includes(val) ? (val as AccentColor) : 'green'
}
function setNeutralColor(val: string | undefined) {
  neutralColor.value =
    val && (NEUTRAL_COLORS as readonly string[]).includes(val) ? (val as NeutralColor) : 'slate'
}
</script>

<template>
  <div class="min-h-screen p-4 font-sans">
    <span ref="focusSentinel" tabindex="-1" aria-hidden="true" class="sr-only" />
    <!-- Header -->
    <div class="flex items-center">
      <UIcon name="i-lucide-settings" class="size-9 pr-2 text-black dark:text-white" />
      <h1 class="text-lg font-bold text-black dark:text-white">{{ t('settings.title') }}</h1>

      <UButton
        @click="emit('back')"
        :aria-label="t('settings.back')"
        icon="i-lucide-arrow-big-left"
        size="lg"
        color="neutral"
        variant="subtle"
        :ui="{
          base: 'cursor-pointer selectable-focus ml-auto',
          leadingIcon: 'size-5'
        }"
      />
    </div>

    <USeparator class="my-3" aria-hidden="true" />

    <div class="max-w-2xl mx-auto">
      <!-- General -->
      <h2 class="text-sm font-semibold text-muted tracking-wide mb-3">
        {{ t('settings.general') }}
      </h2>
      <section class="bg-elevated rounded-sm p-4 space-y-3 mb-4">
        <ConnectionSettings />

        <!-- Language -->
        <UFormField
          :label="t('settings.languageLabel')"
          :ui="{ label: 'label-title' }"
          class="flex flex-row items-center justify-between"
        >
          <USelect
            v-model="locale"
            :items="localeItems"
            :aria-label="t('language')"
            :ui="{
              trailingIcon: 'icon-animation text-muted',
              item: 'selectable-focus',
              content: 'overflow-visible',
              base: 'bg-default min-w-32 cursor-pointer selectable-focus'
            }"
            variant="subtle"
            size="lg"
          />
        </UFormField>
      </section>

      <!-- Appearance -->
      <h2 class="text-sm font-semibold text-muted tracking-wide mb-3">
        {{ t('settings.appearance') }}
      </h2>
      <section class="bg-elevated rounded-sm space-y-3 p-4">
        <!-- Theme -->
        <UFormField
          :label="t('settings.colorMode')"
          :ui="{ label: 'text-sm label-title' }"
          class="flex flex-row items-center justify-between gap-4"
        >
          <UButton
            @click="cycle"
            :aria-label="`${t('colorMode.dark')}/${t('colorMode.light')}/${t('colorMode.system')}: ${colorModeLabel}`"
            :ui="{
              base: 'bg-default cursor-pointer min-w-24 selectable-focus',
              leadingIcon: 'size-4'
            }"
            :leading-icon="colorModeIcon"
            :label="colorModeLabel"
            size="lg"
            color="neutral"
            variant="subtle"
          />
        </UFormField>

        <div class="flex sm:flex-row flex-col gap-3 justify-between sm:items-center">
          <span class="block text-sm label-title" aria-hidden="true">
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

        <div class="flex sm:flex-row flex-col gap-3 justify-between sm:items-center">
          <span class="block text-sm label-title" aria-hidden="true">
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
    <USeparator class="my-4" aria-hidden="true" />

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
