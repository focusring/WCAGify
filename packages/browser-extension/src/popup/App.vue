<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Report } from '../types'
import { useColorMode } from '../composables/useColorMode'
import { useI18n } from '../composables/useI18n'
import { localeLabels, type Locale } from '../i18n'
import ConnectionSettings from './components/ConnectionSettings.vue'
import ElementPicker from './components/ElementPicker.vue'
import IssueForm from './components/IssueForm.vue'

const reports = ref<Report[]>([])
const picker = ref<InstanceType<typeof ElementPicker>>()
const { preference, cycle } = useColorMode()
const { t, locale } = useI18n()

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

function onReportsLoaded(data: Report[]) {
  reports.value = data
}
</script>

<template>
  <UApp>
    <div class="min-h-screen p-4 bg-white dark:bg-gray-900 font-sans">
      <div class="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
        <img src="../assets/wcagify-48.png" alt="WCAGify logo" width="24" height="24" />
        <h1 class="text-lg font-bold text-black dark:text-white">WCAGify</h1>
        <div class="ml-auto flex items-center gap-1">
          <select
            v-model="locale"
            :title="t('language')"
            class="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-1.5 py-1 text-sm text-gray-700 dark:text-gray-300 focus:border-green-600 dark:focus:border-green-400 focus:outline-none"
          >
            <option v-for="[code, label] in locales" :key="code" :value="code">
              {{ label }}
            </option>
          </select>
          <button
            @click="cycle"
            :title="`${t('colorMode.dark')}/${t('colorMode.light')}/${t('colorMode.system')}: ${colorModeLabel}`"
            class="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <UIcon :name="colorModeIcon" class="size-4" />
          </button>
        </div>
      </div>

      <div class="space-y-4">
        <ConnectionSettings @reports-loaded="onReportsLoaded" />

        <div
          v-if="reports.length > 0"
          class="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4"
        >
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
