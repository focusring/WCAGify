<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
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
  return null
})

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
          base: 'cursor-pointer px-3 py-2 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary focus-visible:rounded-sm'
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
          <UFormField
            v-else-if="mode === 'select'"
            :label="t('connection.selectInstance')"
            :hint="`(${t('connection.required')})`"
            name="wcagify-instance"
            :ui="{
              label: 'label-title',
              labelWrapper: 'flex items-center justify-start gap-1',
              hint: 'label-hint'
            }"
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
              size="lg"
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
          </UFormField>

          <!-- Manual input -->
          <div v-else>
            <UForm :state="{}" @submit="fetchReports">
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
                    aria-required="true"
                    :aria-invalid="status === 'error' ? true : undefined"
                    :aria-describedby="status === 'error' ? 'wcagify-url-error' : undefined"
                    :color="status === 'error' ? 'error' : 'success'"
                    :highlight="status === 'error'"
                    size="lg"
                    :ui="{
                      trailing: 'pe-1.5',
                      base: '[&::placeholder]:text-muted text-sm hover:bg-accented/75'
                    }"
                    class="w-full"
                  />

                  <UButton
                    type="submit"
                    color="success"
                    size="lg"
                    :label="t('connection.connect')"
                    :ui="{ base: 'cursor-pointer' }"
                  />

                  <UButton
                    @click="rescan"
                    color="neutral"
                    variant="outline"
                    size="lg"
                    icon="i-lucide-refresh-cw"
                    :aria-label="t('connection.rescan')"
                    :ui="{
                      base: 'cursor-pointer focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary focus-visible:rounded-sm'
                    }"
                  />
                </div>
              </UFormField>
            </UForm>
          </div>

          <UAlert
            v-if="statusAlert"
            id="wcagify-url-error"
            :color="statusAlert.color"
            :variant="statusAlert.variant"
            :icon="statusAlert.icon"
            :description="statusAlert.description"
            :ui="{ root: 'px-2.5 py-2', icon: 'shrink-0 size-4 my-auto' }"
          />
        </div>
      </template>
    </UCollapsible>

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
      <USelect
        id="wcagify-report"
        v-model="reportSlug"
        :items="reports.map((r) => ({ label: r.title, value: r.slug }))"
        :placeholder="t('connection.selectReport')"
        :ui="{
          placeholder: 'text-muted',
          trailingIcon:
            'text-muted group-data-[state=open]:rotate-180 transition-transform duration-200',
          item: 'cursor-pointer data-highlighted:not-data-disabled:before:bg-elevated data-highlighted:not-data-disabled:before:ring-2 data-highlighted:not-data-disabled:before:ring-inset data-highlighted:not-data-disabled:before:ring-primary'
        }"
        required
        aria-required="true"
        class="w-full cursor-pointer"
        size="lg"
        variant="subtle"
      />
    </UFormField>
  </div>
</template>
