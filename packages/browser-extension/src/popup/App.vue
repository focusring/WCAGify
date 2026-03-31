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
const localeItems = computed(() => locales.map(([value, label]) => ({ value, label })))

function onReportsLoaded(data: Report[]) {
  reports.value = data
}
</script>

<template>
  <UApp>
    <div class="min-h-screen p-4 bg-white dark:bg-gray-900 font-sans">
      <div class="flex items-center gap-2">
        <img src="../assets/wcagify-48.png" alt="WCAGify logo" class="size-6" />
        <h1 class="text-lg font-bold text-black dark:text-white">WCAGify</h1>
        <div class="ml-auto flex items-center gap-2">
          <USelect
            v-model="locale"
            :items="localeItems"
            :aria-label="t('language')"
            :ui="{
              trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200',
              item: 'data-highlighted:not-data-disabled:before:bg-elevated data-highlighted:not-data-disabled:before:ring-2 data-highlighted:not-data-disabled:before:ring-inset data-highlighted:not-data-disabled:before:ring-primary'
            }"
            variant="subtle"
            size="sm"
            class="w-auto min-w-24 cursor-pointer"
          />
          <UButton
            @click="cycle"
            :title="`${t('colorMode.dark')}/${t('colorMode.light')}/${t('colorMode.system')}: ${colorModeLabel}`"
            :aria-label="`${t('colorMode.dark')}/${t('colorMode.light')}/${t('colorMode.system')}: ${colorModeLabel}`"
            :ui="{
              base: 'cursor-pointer focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary focus-visible:rounded-sm'
            }"
            :icon="colorModeIcon"
            size="sm"
            color="neutral"
            variant="subtle"
          />
        </div>
      </div>

      <USeparator class="my-4" />

      <div class="space-y-4">
        <ConnectionSettings @reports-loaded="onReportsLoaded" />

        <USeparator />

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
