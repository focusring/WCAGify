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
const isOpen = ref(status.value !== 'connected')

watch(status, (val) => {
  isOpen.value = val !== 'connected'
})

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
    syncSelectedReport()
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

function syncSelectedReport() {
  if (reportSlug.value && !reports.value.some((r) => r.slug === reportSlug.value)) {
    reportSlug.value = ''
  }
}

function connectInstance(url: string) {
  wcagifyUrl.value = url
  const instance = instances.value.find((i) => i.url === url)
  if (instance) {
    reports.value = instance.reports
    syncSelectedReport()
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
    syncSelectedReport()
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
    syncSelectedReport()
  }
}
</script>

<template>
  <div class="space-y-3">
    <UCollapsible :open="isOpen" @update:open="isOpen = $event">
      <UButton
        class="group"
        variant="ghost"
        color="neutral"
        trailing-icon="i-lucide-chevron-down"
        block
        :ui="{
          trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200',
          base: 'cursor-pointer px-3 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary focus-visible:rounded-sm'
        }"
      >
        <template v-if="status === 'connected'">
          <UChip standalone inset />
          <span class="text-green-700 dark:text-green-400">{{ t('connection.connected') }}</span>
          <span class="text-gray-600 dark:text-gray-300">&mdash; {{ wcagifyUrl }}</span>
        </template>
        <template v-else-if="mode === 'scanning'">
          {{ t('connection.scanning') }}
        </template>
        <template v-else>
          {{ t('connection.url') }}
        </template>
      </UButton>

      <template #content>
        <div class="mt-3 space-y-3">
          <!-- Scanning state -->
          <div v-if="mode === 'scanning'" class="text-sm text-gray-500 dark:text-gray-400 px-2.5">
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
            <USelect
              id="wcagify-instance"
              :model-value="wcagifyUrl"
              :items="instances.map((i) => ({ label: i.label, value: i.url }))"
              @update:model-value="connectInstance"
              required
              :ui="{
                placeholder: 'text-muted',
                item: 'data-highlighted:not-data-disabled:before:bg-elevated data-highlighted:not-data-disabled:before:ring-2 data-highlighted:not-data-disabled:before:ring-inset data-highlighted:not-data-disabled:before:ring-primary'
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
          <div v-else>
            <form @submit.prevent="fetchReports">
              <label
                for="wcagify-url"
                class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1"
                >{{ t('connection.url') }} <small>({{ t('connection.required') }})</small></label
              >
              <div class="flex gap-2">
                <UInput
                  id="wcagify-url"
                  v-model="wcagifyUrl"
                  type="url"
                  placeholder="http://localhost:3000"
                  required
                  aria-required="true"
                  :aria-invalid="status === 'error' ? true : undefined"
                  :aria-describedby="status === 'error' ? 'wcagify-url-error' : undefined"
                  :color="status === 'error' ? 'error' : 'success'"
                  :highlight="status === 'error'"
                  class="flex-1"
                />

                <UButton
                  type="submit"
                  color="success"
                  :label="t('connection.connect')"
                  :ui="{ base: 'cursor-pointer' }"
                />

                <UButton
                  @click="rescan"
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-refresh-cw"
                  :aria-label="t('connection.rescan')"
                  :ui="{
                    base: 'cursor-pointer focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary focus-visible:rounded-sm'
                  }"
                />
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

          <UAlert
            v-if="status === 'error'"
            id="wcagify-url-error"
            color="error"
            variant="subtle"
            :description="errorMessage"
          />
        </div>
      </template>
    </UCollapsible>

    <div v-if="status === 'connected' && reports.length > 0" class="">
      <label
        for="wcagify-report"
        class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1"
        >{{ t('connection.report') }} <small>({{ t('connection.required') }})</small></label
      >
      <USelect
        id="wcagify-report"
        v-model="reportSlug"
        :items="reports.map((r) => ({ label: r.title, value: r.slug }))"
        :placeholder="t('connection.selectReport')"
        :ui="{
          placeholder: 'text-muted',
          trailingIcon: 'text-muted',
          item: 'data-highlighted:not-data-disabled:before:bg-elevated data-highlighted:not-data-disabled:before:ring-2 data-highlighted:not-data-disabled:before:ring-inset data-highlighted:not-data-disabled:before:ring-primary'
        }"
        required
        aria-required="true"
        class="w-full cursor-pointer"
        size="lg"
        variant="subtle"
      />
    </div>
  </div>
</template>
