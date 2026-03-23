<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import type { Report } from '../../types'
import { useSettings } from '../../composables/useSettings'
import { useI18n } from '../../composables/useI18n'
import { useInstanceDiscovery } from '../../composables/useInstanceDiscovery'

const { wcagifyUrl, reportSlug } = useSettings()
const { t } = useI18n()
const { instances, scanStatus, scan, abort } = useInstanceDiscovery()

const reports = ref<Report[]>([])
const status = ref<'idle' | 'loading' | 'connected' | 'error'>('idle')
const errorMessage = ref('')
const mode = ref<'scanning' | 'select' | 'manual'>('scanning')
const autoConnected = ref(false)

const emit = defineEmits<{
  reportsLoaded: [reports: Report[]]
}>()

onMounted(() => {
  scan()
})

onUnmounted(() => {
  abort()
})

watch(scanStatus, (val) => {
  if (val !== 'done') return

  if (instances.value.length === 0) {
    mode.value = 'manual'
  } else if (instances.value.length === 1) {
    mode.value = 'manual'
    autoConnected.value = true
    const instance = instances.value[0]!
    wcagifyUrl.value = instance.url
    reports.value = instance.reports
    status.value = 'connected'
    emit('reportsLoaded', instance.reports)
  } else {
    mode.value = 'select'
    // Pre-select saved URL if it matches a discovered instance
    const match = instances.value.find((i) => i.url === wcagifyUrl.value)
    if (match) {
      connectInstance(match.url)
    }
  }
})

function connectInstance(url: string) {
  wcagifyUrl.value = url
  const instance = instances.value.find((i) => i.url === url)
  if (instance) {
    reports.value = instance.reports
    status.value = 'connected'
    emit('reportsLoaded', instance.reports)
  }
}

function switchToManual() {
  mode.value = 'manual'
}

function rescan() {
  mode.value = 'scanning'
  status.value = 'idle'
  errorMessage.value = ''
  reports.value = []
  scan()
}

async function fetchReports() {
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
    status.value = 'connected'
    emit('reportsLoaded', data)
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
  }
}
</script>

<template>
  <div class="space-y-3">
    <details :open="status !== 'connected' || undefined" class="group">
      <summary
        class="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 list-none [&::-webkit-details-marker]:hidden"
      >
        <UIcon
          name="i-lucide-chevron-right"
          class="size-4 transition-transform group-open:rotate-90"
        />
        <template v-if="status === 'connected'">
          <span class="inline-block h-2 w-2 rounded-full bg-green-500"></span>
          <span class="text-green-700 dark:text-green-400">{{ t('connection.connected') }}</span>
          <span class="text-gray-600 dark:text-gray-400">&mdash; {{ wcagifyUrl }}</span>
        </template>
        <template v-else-if="mode === 'scanning'">
          {{ t('connection.scanning') }}
        </template>
        <template v-else>
          {{ t('connection.url') }}
        </template>
      </summary>

      <div class="mt-3 space-y-3">
        <!-- Scanning state -->
        <div v-if="mode === 'scanning'" class="text-sm text-gray-500 dark:text-gray-400">
          {{ t('connection.scanning') }}
        </div>

        <!-- Multiple instances found: dropdown -->
        <div v-else-if="mode === 'select'">
          <label
            for="wcagify-instance"
            class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1"
            >{{ t('connection.selectInstance') }}
            <small>({{ t('connection.required') }})</small></label
          >
          <select
            id="wcagify-instance"
            :value="wcagifyUrl"
            @change="connectInstance(($event.target as HTMLSelectElement).value)"
            required
            aria-required="true"
            class="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-base text-gray-900 dark:text-gray-100 focus:border-green-600 dark:focus:border-green-400 focus:outline-none"
          >
            <option v-for="instance in instances" :key="instance.url" :value="instance.url">
              {{ instance.label }}
            </option>
          </select>
          <button
            type="button"
            @click="switchToManual"
            class="mt-1 text-sm text-green-700 cursor-pointer dark:text-green-400 hover:underline"
          >
            {{ t('connection.enterManually') }}
          </button>
        </div>

        <!-- Manual input -->
        <div v-else>
          <form @submit.prevent="fetchReports">
            <label
              for="wcagify-url"
              class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1"
              >{{ t('connection.url') }} <small>({{ t('connection.required') }})</small></label
            >
            <div class="flex gap-2">
              <input
                id="wcagify-url"
                v-model="wcagifyUrl"
                type="url"
                placeholder="http://localhost:3000"
                required
                aria-required="true"
                :aria-invalid="status === 'error' ? true : undefined"
                :aria-describedby="status === 'error' ? 'wcagify-url-error' : undefined"
                :class="[
                  'flex-1 rounded border bg-white dark:bg-gray-800 px-2 py-1.5 text-base text-gray-900 dark:text-gray-100 focus:outline-none',
                  status === 'error'
                    ? 'border-red-500 dark:border-red-400 focus:border-red-600 dark:focus:border-red-400'
                    : 'border-gray-300 dark:border-gray-600 focus:border-green-600 dark:focus:border-green-400'
                ]"
              />
              <button
                type="submit"
                class="rounded bg-green-700 dark:bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-800 dark:hover:bg-green-700"
              >
                {{ t('connection.connect') }}
              </button>
              <button
                type="button"
                @click="rescan"
                :aria-label="t('connection.rescan')"
                class="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <UIcon name="i-lucide-refresh-cw" class="size-4" />
              </button>
            </div>
          </form>
          <div
            v-if="autoConnected && status === 'connected'"
            class="mt-1.5 flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400"
          >
            <UIcon name="i-lucide-info" class="size-4 shrink-0" />
            {{ t('connection.autoConnected') }}
          </div>
        </div>

        <div
          v-if="mode !== 'scanning' && status === 'loading'"
          class="text-sm text-gray-500 dark:text-gray-400"
        >
          {{ t('connection.connecting') }}
        </div>

        <div
          v-if="status === 'error'"
          id="wcagify-url-error"
          role="alert"
          class="rounded bg-red-50 dark:bg-red-900/30 p-2 text-sm text-red-700 dark:text-red-400"
        >
          {{ errorMessage }}
        </div>
      </div>
    </details>

    <div v-if="status === 'connected' && reports.length > 0">
      <label
        for="wcagify-report"
        class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1"
        >{{ t('connection.report') }} <small>({{ t('connection.required') }})</small></label
      >
      <select
        id="wcagify-report"
        v-model="reportSlug"
        required
        aria-required="true"
        class="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-base text-gray-900 dark:text-gray-100 focus:border-green-600 dark:focus:border-green-400 focus:outline-none"
      >
        <option value="" disabled>{{ t('connection.selectReport') }}</option>
        <option v-for="report in reports" :key="report.slug" :value="report.slug">
          {{ report.title }}
        </option>
      </select>
    </div>
  </div>
</template>
