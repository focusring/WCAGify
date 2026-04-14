<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Report } from '../../types'
import { useSettings } from '../../composables/useSettings'
import { useI18n } from '../../composables/useI18n'
import { useInstanceDiscovery } from '../../composables/useInstanceDiscovery'
import ClearableSelect from './ClearableSelect.vue'

const { wcagifyUrl, reportSlug, reports, applyInstanceSettings } = useSettings()
const { t } = useI18n()
const { instances, scanStatus, scan } = useInstanceDiscovery()
const status = ref<'idle' | 'loading' | 'connected' | 'error'>('idle')
const errorMessage = ref('')
const mode = ref<'scanning' | 'select' | 'manual'>('scanning')
const autoConnected = ref(false)
const manuallyConnected = ref(false)
const urlCleared = ref(false)

watch(wcagifyUrl, (val) => {
  if (val) urlCleared.value = false
})

watch(
  scanStatus,
  (val) => {
    if (val !== 'done') return

    if (instances.value.length === 0) {
      mode.value = 'manual'
    } else if (instances.value.length === 1) {
      mode.value = 'manual'
      autoConnected.value = true
      // wcagifyUrl and reports are already set by useSettings auto-connect;
      // update status so the connected UI shows correctly
      status.value = 'connected'
    } else {
      mode.value = 'select'
      // Pre-select saved URL if it matches a discovered instance
      const match = instances.value.find((i) => i.url === wcagifyUrl.value)
      if (match) {
        connectInstance(match.url)
      }
    }
  },
  { immediate: true }
)

function syncSelectedReport() {
  if (reportSlug.value && !reports.value.some((r) => r.slug === reportSlug.value)) {
    reportSlug.value = ''
  }
}

function connectInstance(url: string) {
  autoConnected.value = false
  wcagifyUrl.value = url
  const instance = instances.value.find((i) => i.url === url)
  if (instance) {
    reports.value = instance.reports
    applyInstanceSettings(instance.settings)
    syncSelectedReport()
    status.value = 'connected'
  }
}

function switchToManual() {
  mode.value = 'manual'
}

function rescan() {
  autoConnected.value = false
  manuallyConnected.value = false
  mode.value = 'scanning'
  status.value = 'idle'
  errorMessage.value = ''
  reports.value = []
  scan()
}

const statusAlert = computed(() => {
  if (manuallyConnected.value && status.value === 'connected') {
    return {
      color: 'success' as const,
      icon: 'i-lucide-check',
      description: t('connection.connectionSuccess')
    }
  }
  if (autoConnected.value && status.value === 'connected') {
    return {
      color: 'info' as const,
      icon: 'i-lucide-circle-check',
      description: t('connection.autoConnected')
    }
  }
  if (status.value === 'error') {
    return {
      color: 'error' as const,
      icon: 'i-lucide-x',
      description: errorMessage.value,
      id: 'wcagify-url-error'
    }
  }
  return undefined
})

async function fetchReports() {
  autoConnected.value = false
  manuallyConnected.value = false
  status.value = 'loading'
  errorMessage.value = ''

  try {
    const url = wcagifyUrl.value.replace(/\/$/, '')
    const res = await fetch(`${url}/api/reports`)

    if (!res.ok) {
      throw new Error(t('connection.connectionHttpError'))
    }

    const data: Report[] = await res.json()
    reports.value = data
    syncSelectedReport()
    status.value = 'connected'
    manuallyConnected.value = true

    // Inherit settings from the connected instance
    try {
      const settingsRes = await fetch(`${url}/api/settings`)
      if (settingsRes.ok) applyInstanceSettings(await settingsRes.json())
    } catch {
      // settings endpoint may not exist on older instances
    }
  } catch (error) {
    status.value = 'error'
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      errorMessage.value = t('connection.connectionRefused')
    } else if (error instanceof Error) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = t('connection.connectionFailed')
    }
    reports.value = []
    syncSelectedReport()
  }
}
</script>

<template>
  <div class="space-y-3">
    <!-- Connected state (always visible on top) -->
    <div v-if="status === 'connected'" class="flex sm:flex-row flex-col items-center gap-2 text-sm">
      <div class="flex gap-2">
        <UChip color="success" standalone inset />
        <span class="text-success">{{ t('connection.connected') }}</span>
        &mdash;
      </div>
      <span class="text-muted">{{ wcagifyUrl }}</span>
    </div>
    <div v-if="status === 'idle' || status === 'error'" class="flex gap-2 text-sm">
      <div class="flex gap-2">
        <UChip color="error" standalone inset />
        <span class="text-error">{{ t('connection.disconnected') }}</span>
        &mdash;
      </div>
      <span class="text-muted">{{ wcagifyUrl }}</span>
    </div>

    <!-- Scanning state -->
    <div v-if="mode === 'scanning'" class="text-sm text-muted">
      {{ t('connection.scanning') }}
    </div>

    <!-- Multiple instances found: dropdown -->
    <div v-else-if="mode === 'select'">
      <label for="wcagify-instance" class="block text-sm font-medium text-muted mb-1"
        >{{ t('connection.selectInstance') }} <small>({{ t('connection.required') }})</small></label
      >
      <USelect
        id="wcagify-instance"
        :model-value="wcagifyUrl"
        :items="instances.map((i) => ({ label: i.label, value: i.url }))"
        @update:model-value="connectInstance"
        required
        :ui="{
          placeholder: 'text-muted',
          item: 'selectable-focus'
        }"
        aria-required="true"
        class="w-full cursor-pointer"
      />
      <UButton
        variant="link"
        :label="t('connection.enterManually')"
        color="success"
        size="sm"
        @click="switchToManual"
        :ui="{ base: 'cursor-pointer px-0 mt-1' }"
      />
    </div>

    <!-- Manual input -->
    <div v-else-if="mode === 'manual'">
      <form @submit.prevent="fetchReports">
        <UFormField
          :label="t('connection.url')"
          :hint="`(${t('connection.required')})`"
          name="wcagify-url"
          :ui="{
            label: 'label-title',
            labelWrapper: 'flex items-center justify-start gap-1',
            hint: 'label-hint'
          }"
        >
          <div class="flex gap-2">
            <UInput
              id="wcagify-url"
              v-model="wcagifyUrl"
              type="url"
              placeholder="http://localhost:3000"
              required
              size="lg"
              aria-required="true"
              :aria-invalid="status === 'error' ? true : undefined"
              :aria-describedby="status === 'error' ? 'wcagify-url-error' : undefined"
              :color="status === 'error' ? 'error' : 'success'"
              :highlight="status === 'error'"
              :ui="{ base: 'selectable-focus' }"
              class="flex-1"
            >
              <template v-if="wcagifyUrl?.length" #trailing>
                <UButton
                  color="primary"
                  variant="ghost"
                  size="xs"
                  icon="i-lucide-x"
                  :aria-label="t('form.clear')"
                  :ui="{
                    base: 'selectable-focus cursor-pointer'
                  }"
                  @click="
                    wcagifyUrl = ''
                    urlCleared = true
                  "
                />
              </template>
            </UInput>

            <UButton
              type="submit"
              color="primary"
              size="lg"
              :label="t('connection.connect')"
              :ui="{ base: 'cursor-pointer selectable-focus' }"
            />

            <UButton
              @click="rescan"
              color="neutral"
              variant="outline"
              icon="i-lucide-refresh-cw"
              size="lg"
              :aria-label="t('connection.rescan')"
              :ui="{
                base: 'shrink-0 cursor-pointer selectable-focus flex-none'
              }"
            />
          </div>
        </UFormField>
      </form>
    </div>

    <UAlert
      v-if="mode !== 'scanning' && status === 'loading'"
      color="neutral"
      variant="subtle"
      icon="i-lucide-loader-circle"
      :description="t('connection.connecting')"
      :ui="{ icon: 'animate-spin' }"
      class="px-3 py-2 items-center"
    />

    <UAlert
      v-if="urlCleared"
      color="warning"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      :description="t('connection.urlClearedWarning')"
      class="px-3 py-2 items-center"
    />

    <UAlert
      v-if="statusAlert"
      v-bind="statusAlert"
      variant="subtle"
      class="px-3 py-2 items-center"
    />

    <UFormField
      v-if="status === 'connected' && reports.length > 0"
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
        :ui="{ base: 'bg-default' }"
        required
      />
    </UFormField>
  </div>
</template>
