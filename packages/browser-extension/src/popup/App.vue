<script setup lang="ts">
import { ref, computed } from 'vue'
import { useColorMode } from '../composables/useColorMode'
import { useI18n } from '../composables/useI18n'
import { useSettings } from '../composables/useSettings'
import { localeLabels, type Locale } from '../i18n'
import ElementPicker from './components/ElementPicker.vue'
import IssueForm from './components/IssueForm.vue'
import SettingsPage from './components/SettingsPage.vue'

const picker = ref<InstanceType<typeof ElementPicker>>()
const { preference, cycle } = useColorMode()
const { t, locale } = useI18n()
const { reports } = useSettings()

const currentView = ref<'main' | 'settings'>('main')

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
</script>

<template>
  <UApp>
    <SettingsPage v-show="currentView === 'settings'" @back="currentView = 'main'" />

    <div v-show="currentView === 'main'" class="min-h-screen p-4 font-sans">
      <div class="flex items-center gap-2">
        <img src="../assets/wcagify-48.png" alt="WCAGify logo" class="size-6" />
        <h1 class="text-lg font-bold text-black dark:text-white">WCAGify</h1>
        <UButton
          @click="currentView = 'settings'"
          :aria-label="t('settings.title')"
          :title="t('settings.title')"
          :label="t('settings.title')"
          icon="i-lucide-settings"
          size="sm"
          color="neutral"
          variant="subtle"
          :ui="{
            base: 'cursor-pointer focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary focus-visible:rounded-sm'
          }"
          class="ml-auto"
        />
      </div>

      <USeparator class="my-4" />

      <div class="space-y-4">
        <div v-if="reports.length > 0" class="space-y-4">
          <ElementPicker ref="picker" />

          <IssueForm
            :reports="reports"
            :selector="picker?.selector ?? ''"
            :page-url="picker?.pageUrl ?? ''"
            :page-title="picker?.pageTitle ?? ''"
          />
        </div>
      </div>
    </div>
  </UApp>
</template>
