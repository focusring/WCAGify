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
const { reports, scanStatus } = useSettings()

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
    <SettingsPage v-if="currentView === 'settings'" @back="currentView = 'main'" />

    <div v-show="currentView === 'main'" class="min-h-screen p-4 font-sans">
      <div class="space-y-4">
        <div class="flex gap-3">
          <ElementPicker v-if="reports.length > 0" ref="picker" class="flex-1" />
          <USkeleton v-else-if="scanStatus !== 'done'" class="flex-1 h-10 rounded-md" />

          <UButton
            @click="currentView = 'settings'"
            :aria-label="t('settings.title')"
            :title="t('settings.title')"
            :label="t('settings.title')"
            icon="i-lucide-settings"
            size="xl"
            color="primary"
            variant="subtle"
            :ui="{
              base: 'cursor-pointer focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary focus-visible:rounded-sm',
              leadingIcon: 'size-5'
            }"
          />
        </div>

        <template v-if="reports.length > 0">
          <USeparator class="my-4" />

          <IssueForm
            :reports="reports"
            :selector="picker?.selector ?? ''"
            :page-url="picker?.pageUrl ?? ''"
            :page-title="picker?.pageTitle ?? ''"
          />
        </template>

        <template v-else-if="scanStatus !== 'done'">
          <USeparator class="my-4" />

          <div class="space-y-3">
            <div v-for="n in 3" :key="n" class="w-full space-y-2.5">
              <USkeleton class="h-3.5 w-24 rounded-md" />
              <USkeleton class="h-9 w-full rounded-md" />
            </div>
            <div class="flex gap-3 w-full">
              <div v-for="n in 2" :key="n" class="w-full space-y-2.5">
                <USkeleton class="h-3.5 w-24 rounded-md" />
                <USkeleton class="h-9 w-full rounded-md" />
              </div>
            </div>
            <div class="w-full space-y-2.5">
              <USkeleton class="h-3.5 w-24 rounded-md" />
              <USkeleton class="h-41.75 w-full rounded-md" />
            </div>
            <USkeleton class="h-10 w-full rounded-md" />
          </div>
        </template>
      </div>
    </div>
  </UApp>
</template>
