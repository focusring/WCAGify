<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Report } from '../../types'
import { useSettings } from '../../composables/useSettings'
import { useI18n } from '../../composables/useI18n'
import { useInstanceDiscovery } from '../../composables/useInstanceDiscovery'
import ClearableSelect from './ClearableSelect.vue'

const { wcagifyUrl, reportSlug, reports } = useSettings()
const { t } = useI18n()
const { instances, scanStatus, scan } = useInstanceDiscovery()
const status = ref<'idle' | 'loading' | 'connected' | 'error'>('idle')
const errorMessage = ref('')
const mode = ref<'scanning' | 'select' | 'manual'>('scanning')
const autoConnected = ref(false)

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
    syncSelectedReport()
    status.value = 'connected'
  }
}

function switchToManual() {
  mode.value = 'manual'
}

function rescan() {
  autoConnected.value = false
  mode.value = 'scanning'
  status.value = 'idle'
  errorMessage.value = ''
  reports.value = []
  scan()
}

const statusAlert = computed(() => {
  if (autoConnected.value && status.value === 'connected') {
    return {
      color: 'info' as const,
      variant: 'subtle' as const,
      icon: 'i-lucide-info',
      description: t('connection.autoConnected')
    }
  }
  if (mode.value !== 'scanning' && status.value === 'loading') {
    return {
      color: 'neutral' as const,
      variant: 'soft' as const,
      icon: undefined,
      description: t('connection.connecting')
    }
  }
  if (status.value === 'error') {
    return {
      color: 'error' as const,
      variant: 'subtle' as const,
      icon: undefined,
      description: errorMessage.value
    }
  }
  return undefined
})

async function fetchReports() {
  autoConnected.value = false
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
    <div v-if="status === 'connected'" class="flex items-center gap-2 text-sm">
      <UChip color="success" standalone inset />
      <span class="text-success">{{ t('connection.connected') }}</span>
      <span class="text-muted">&mdash; {{ wcagifyUrl }}</span>
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
        class="mt-1"
        @click="switchToManual"
        :ui="{ base: 'cursor-pointer px-0' }"
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
              size="xl"
              aria-required="true"
              :aria-invalid="status === 'error' ? true : undefined"
              :aria-describedby="status === 'error' ? 'wcagify-url-error' : undefined"
              :color="status === 'error' ? 'error' : 'success'"
              :highlight="status === 'error'"
              :ui="{ base: 'py-1.5 selectable-focus' }"
              class="flex-1"
            />

            <UButton
              type="submit"
              color="primary"
              :label="t('connection.connect')"
              :ui="{ base: 'cursor-pointer selectable-focus' }"
            />

            <UButton
              @click="rescan"
              color="neutral"
              variant="outline"
              icon="i-lucide-refresh-cw"
              :aria-label="t('connection.rescan')"
              :ui="{
                base: 'cursor-pointer selectable-focus'
              }"
            />
          </div>
        </UFormField>
      </form>
      <div
        v-if="autoConnected && status === 'connected'"
        class="mt-1.5 flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400"
      >
        <UIcon name="i-lucide-info" class="size-4 shrink-0" />
        {{ t('connection.autoConnected') }}
      </div>
    </div>

    <div v-if="mode !== 'scanning' && status === 'loading'" class="text-sm text-muted">
      {{ t('connection.connecting') }}
    </div>

    <UAlert
      v-if="status === 'error'"
      id="wcagify-url-error"
      color="error"
      variant="subtle"
      :description="errorMessage"
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
        required
      />
    </UFormField>
  </div>
</template>
