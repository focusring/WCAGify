<script setup lang="ts">
import type { SelectMenuProps } from '@nuxt/ui'
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

const LOCALE_FLAGS: Record<string, string> = {
  en: '🇺🇸',
  nl: '🇳🇱'
}

const accentColorSwatches = computed(() =>
  ACCENT_COLORS.map((name) => ({
    name,
    value: ACCENT_HEX[name],
    label: t(`settings.colors.${name}`)
  }))
)

const neutralColorSwatches = computed(() =>
  NEUTRAL_COLORS.map((name) => ({
    name,
    value: NEUTRAL_HEX[name],
    label: t(`settings.colors.${name}`)
  }))
)

const accentColorLabel = computed(
  () => `${t('settings.accentColor')} - ${t(`settings.colors.${settings.value.accentColor}`)}`
)

interface LocaleItem {
  code?: string
  name: string
  flag?: string
  type?: 'label'
  class?: string
}

const localeOptions = computed<LocaleItem[]>(() =>
  locales.value.map((item) => ({
    code: item.code,
    name: item.name ?? item.code,
    flag: LOCALE_FLAGS[item.code]
  }))
)

/**
 * Reka's ComboboxGroup always emits aria-labelledby; a visually hidden label
 * item makes it point at a real element instead of an empty id.
 */
const localeItems = computed<LocaleItem[]>(() => [
  { type: 'label', name: t('settings.language'), class: 'sr-only' },
  ...localeOptions.value
])

const currentLocaleName = computed(
  () => localeOptions.value.find((item) => item.code === locale.value)?.name ?? locale.value
)

/*
 * Nuxt UI forwards `content` as attrs to Reka's listbox, which is how the open option list
 * gets its accessible name; the prop type does not list aria attributes, hence the cast.
 */
const languageListContent = {
  'aria-labelledby': 'language-label'
} as unknown as SelectMenuProps['content']
const themeListContent = {
  'aria-labelledby': 'theme-label'
} as unknown as SelectMenuProps['content']

async function onLocaleChange(code: string | undefined) {
  if (!code) return
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
          name="language"
          orientation="horizontal"
          :ui="{ label: 'label-title', root: 'bg-elevated rounded-sm p-4 sm:p-6' }"
        >
          <template #label>
            <span id="language-label">{{ t('settings.language') }}</span>
          </template>
          <ClientOnly>
            <USelectMenu
              id="language"
              :items="localeItems"
              value-key="code"
              label-key="name"
              :search-input="false"
              :model-value="locale"
              :aria-label="undefined"
              aria-labelledby="language-label language"
              :content="languageListContent"
              :ui="{
                base: 'cursor-pointer min-w-32 ring-neutral-500',
                item: 'cursor-pointer',
                trailingIcon: 'text-toned icon-animation'
              }"
              @update:model-value="onLocaleChange($event)"
            >
              <template #leading>
                <span class="size-5 text-center" aria-hidden="true">{{
                  LOCALE_FLAGS[locale]
                }}</span>
              </template>
              <template #default>
                <span :lang="locale" class="truncate">{{ currentLocaleName }}</span>
              </template>
              <template #item-leading="{ item }">
                <span class="size-5 text-center" aria-hidden="true">{{ item.flag }}</span>
              </template>
              <template #item-label="{ item }">
                <span :lang="item.code">{{ item.name }}</span>
              </template>
            </USelectMenu>
          </ClientOnly>
        </UFormField>

        <!-- Appearance -->
        <h2 class="text-sm! text-toned! tracking-wide mb-3">
          {{ t('settings.appearance') }}
        </h2>
        <div class="bg-elevated rounded-sm p-4 sm:p-6 space-y-6">
          <!-- Theme -->
          <UFormField
            name="theme-select"
            orientation="horizontal"
            :ui="{ label: 'label-title' }"
            class="items-center"
          >
            <template #label>
              <span id="theme-label">{{ t('settings.theme') }}</span>
            </template>
            <UColorModeSelect
              id="theme-select"
              :aria-label="undefined"
              aria-labelledby="theme-label theme-select"
              :content="themeListContent"
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
            :label="accentColorLabel"
            name="accent-color"
            :ui="{ label: 'label-title', container: 'min-w-0' }"
            class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <SettingsColorPicker
              :colors="accentColorSwatches"
              :model-value="settings.accentColor"
              :label="accentColorLabel"
              name="accent-color"
              @update:model-value="settings.accentColor = $event as AccentColor"
            />
          </UFormField>

          <!-- Background Shade -->
          <UFormField
            :label="t('settings.backgroundShade')"
            name="background-shade"
            :ui="{ label: 'label-title', container: 'min-w-0' }"
            class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
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
