<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from '../composables/useI18n'
import { useSettings } from '../composables/useSettings'
import logoSvg from '../assets/wcagify-icon.svg'
import ClearableSelect from './components/ClearableSelect.vue'
import ConnectionSettings from './components/ConnectionSettings.vue'
import ContrastChecker from './components/ContrastChecker.vue'
import ElementPicker from './components/ElementPicker.vue'
import ElementStates from './components/ElementStates.vue'
import IssueForm from './components/IssueForm.vue'
import SettingsPage from './components/SettingsPage.vue'

const picker = ref<InstanceType<typeof ElementPicker>>()
const { t } = useI18n()
const { reports, reportSlug, scanStatus } = useSettings()

const currentView = ref<'main' | 'settings'>('main')
const openPanel = ref<number | null>(null)

function togglePanel(index: number) {
  openPanel.value = openPanel.value === index ? null : index
}
</script>

<template>
  <UApp>
    <SettingsPage v-if="currentView === 'settings'" @back="currentView = 'main'" />

    <div v-show="currentView === 'main'" class="min-h-screen p-4 font-sans">
      <!-- Header -->
      <div class="flex items-center gap-2">
        <img :src="logoSvg" alt="" aria-hidden="true" class="size-7" />
        <h1 class="text-lg font-bold text-black dark:text-white">WCAGify</h1>

        <UButton
          @click="currentView = 'settings'"
          :aria-label="t('settings.title')"
          icon="i-lucide-settings"
          size="xl"
          color="neutral"
          variant="ghost"
          :ui="{
            base: 'cursor-pointer selectable-focus ml-auto',
            leadingIcon: 'size-5'
          }"
        />
      </div>

      <USeparator class="mt-3 mb-4" aria-hidden="true" />

      <div class="space-y-4">
        <ElementPicker v-if="reports.length > 0" ref="picker" class="flex-1" />

        <div v-else-if="scanStatus !== 'done'" class="w-full">
          <USkeleton class="h-10 w-full rounded-md mb-4" />
          <div class="w-full space-y-2.5">
            <USkeleton class="h-3.5 w-24 rounded-md" />
            <USkeleton class="h-9 w-full rounded-md" />
          </div>
        </div>

        <!-- Setup screen when no instance is connected -->
        <div v-else class="space-y-5 max-w-2xl mx-auto">
          <div class="flex flex-col items-center text-center pt-2">
            <img :src="logoSvg" alt="" aria-hidden="true" class="size-16 mb-3" />
            <h1 class="text-lg font-bold text-black dark:text-white mb-1">
              {{ t('setup.title') }}
            </h1>
            <p class="text-sm text-muted">
              {{ t('setup.description') }}
            </p>
          </div>

          <section class="bg-elevated rounded-sm p-4">
            <ConnectionSettings />
          </section>

          <div
            class="rounded-sm border border-dashed border-gray-300 dark:border-gray-700 p-4 space-y-2"
          >
            <h2 class="text-sm font-semibold text-black dark:text-white flex items-center gap-1.5">
              <UIcon name="i-lucide-info" class="size-4 text-muted" />
              {{ t('setup.helpTitle') }}
            </h2>
            <ol class="text-sm text-muted list-decimal list-inside space-y-1">
              <li>{{ t('setup.step1') }}</li>
              <li>{{ t('setup.step2') }}</li>
              <li>{{ t('setup.step3') }}</li>
            </ol>
            <a
              href="https://wcagify.com/guide/getting-started"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline selectable-focus mt-1"
            >
              {{ t('setup.docsLink') }}
              <UIcon name="i-lucide-external-link" class="size-3.5" />
            </a>
          </div>
        </div>

        <template v-if="reports.length > 0">
          <!-- Report Selection remove for now, need to implement when their are more reports -->
          <!-- <UFormField
            :label="t('connection.report')"
            :hint="`(${t('connection.required')})`"
            name="wcagify-report"
            :ui="{
              label: 'label-title',
              labelWrapper: 'flex items-center justify-start gap-1',
              hint: 'label-hint'
            }"
          >
            <ClearableSelect
              id="wcagify-report"
              v-model="reportSlug"
              :items="reports.map((r) => ({ label: r.title, value: r.slug }))"
              :placeholder="t('connection.selectReport')"
              required
            />
          </UFormField> -->

          <div>
            <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {{ t('contrast.testOptions') }}
            </label>

            <div class="grid grid-cols-2 gap-2">
              <UButton
                :label="t('contrast.title')"
                :color="openPanel === 0 ? 'primary' : 'neutral'"
                :variant="openPanel === 0 ? 'subtle' : 'outline'"
                icon="i-lucide-test-tube"
                :ui="{ leadingIcon: 'size-4' }"
                block
                @click="togglePanel(0)"
              />
              <UButton
                :label="t('elementState.title')"
                :color="openPanel === 1 ? 'primary' : 'neutral'"
                :variant="openPanel === 1 ? 'subtle' : 'outline'"
                icon="i-lucide-layers"
                :ui="{ leadingIcon: 'size-4' }"
                block
                @click="togglePanel(1)"
              />
              <UButton
                :label="t('zoomCheck.title')"
                :color="openPanel === 2 ? 'primary' : 'neutral'"
                :variant="openPanel === 2 ? 'subtle' : 'outline'"
                icon="i-lucide-zoom-in"
                :ui="{ leadingIcon: 'size-4' }"
                block
                @click="togglePanel(2)"
              />
              <UButton
                :label="t('test.title')"
                :color="openPanel === 3 ? 'primary' : 'neutral'"
                :variant="openPanel === 3 ? 'subtle' : 'outline'"
                icon="i-lucide-play"
                :ui="{ leadingIcon: 'size-4' }"
                block
                @click="togglePanel(3)"
              />
            </div>

            <UCollapsible :open="openPanel === 0" @update:open="(v) => (openPanel = v ? 0 : null)">
              <template #content>
                <div class="bg-muted p-2 rounded mt-2">
                  <ContrastChecker
                    :fg-color="picker?.foregroundColor"
                    :bg-color="picker?.backgroundColor"
                  />
                </div>
              </template>
            </UCollapsible>

            <UCollapsible :open="openPanel === 1" @update:open="(v) => (openPanel = v ? 1 : null)">
              <template #content>
                <div class="bg-muted p-2 rounded mt-2">
                  <ElementStates :tab-id="picker?.selectedTabId" :selector="picker?.selector" />
                </div>
              </template>
            </UCollapsible>

            <UCollapsible :open="openPanel === 2" @update:open="(v) => (openPanel = v ? 2 : null)">
              <template #content>
                <div class="bg-muted p-2 space-y-3 rounded mt-2">
                  <!-- Zoom Check content -->
                </div>
              </template>
            </UCollapsible>

            <UCollapsible :open="openPanel === 3" @update:open="(v) => (openPanel = v ? 3 : null)">
              <template #content>
                <div class="bg-muted p-2 space-y-3 rounded mt-2">
                  <!-- Test content -->
                </div>
              </template>
            </UCollapsible>
          </div>

          <IssueForm
            :reports="reports"
            :selector="picker?.selector ?? ''"
            :page-url="picker?.pageUrl ?? ''"
            :page-title="picker?.pageTitle ?? ''"
          />
        </template>

        <template v-else-if="scanStatus !== 'done'">
          <div class="space-y-3">
            <div v-for="n in 2" :key="n" class="w-full space-y-2.5">
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
