<script setup lang="ts">
import { ref } from 'vue'
import type { Report } from '../../types'
import { useSettings } from '../../composables/useSettings'
import { useI18n } from '../../composables/useI18n'

const { wcagifyUrl, reportSlug } = useSettings()
const { t } = useI18n()

const reports = ref<Report[]>([])
const status = ref<'idle' | 'loading' | 'connected' | 'error'>('idle')
const errorMessage = ref('')

const emit = defineEmits<{
  reportsLoaded: [reports: Report[]]
}>()

async function fetchReports() {
  status.value = 'loading'
  errorMessage.value = ''

  try {
    const url = wcagifyUrl.value.replace(/\/$/, '')
    const res = await fetch(`${url}/api/reports`)

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const data: Report[] = await res.json()
    reports.value = data
    status.value = 'connected'
    emit('reportsLoaded', data)
  } catch (e) {
    status.value = 'error'
    errorMessage.value = e instanceof Error ? e.message : t('connection.connectionFailed')
    reports.value = []
  }
}
</script>

<template>
  <div class="space-y-3">
    <div>
      <label
        for="wcagify-url"
        class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1"
        >{{ t('connection.url') }}</label
      >
      <div class="flex gap-2">
        <input
          id="wcagify-url"
          v-model="wcagifyUrl"
          type="url"
          placeholder="http://localhost:3000"
          class="flex-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-base text-gray-900 dark:text-gray-100 focus:border-green-600 dark:focus:border-green-400 focus:outline-none"
        />
        <button
          @click="fetchReports"
          class="rounded bg-green-700 dark:bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-800 dark:hover:bg-green-700"
        >
          {{ t('connection.connect') }}
        </button>
      </div>
    </div>

    <div v-if="status === 'loading'" class="text-sm text-gray-500 dark:text-gray-400">
      {{ t('connection.connecting') }}
    </div>

    <div
      v-if="status === 'error'"
      class="rounded bg-red-50 dark:bg-red-900/30 p-2 text-sm text-red-700 dark:text-red-400"
    >
      {{ errorMessage }}
    </div>

    <div v-if="status === 'connected' && reports.length > 0">
      <label
        for="wcagify-report"
        class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1"
        >{{ t('connection.report') }}</label
      >
      <select
        id="wcagify-report"
        v-model="reportSlug"
        class="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-base text-gray-900 dark:text-gray-100 focus:border-green-600 dark:focus:border-green-400 focus:outline-none"
      >
        <option value="" disabled>{{ t('connection.selectReport') }}</option>
        <option v-for="report in reports" :key="report.slug" :value="report.slug">
          {{ report.title }}
        </option>
      </select>
    </div>

    <div
      v-if="status === 'connected'"
      class="flex items-center gap-1.5 text-sm text-green-700 dark:text-green-400"
    >
      <span class="inline-block h-2 w-2 rounded-full bg-green-500"></span>
      {{ t('connection.connected') }}
    </div>
  </div>
</template>
