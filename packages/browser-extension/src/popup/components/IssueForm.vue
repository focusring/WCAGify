<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Report } from '../../types'
import { useSettings } from '../../composables/useSettings'
import { useI18n } from '../../composables/useI18n'
import RichTextEditor from './RichTextEditor.vue'

const props = defineProps<{
  reports: Report[]
  selector: string
  pageUrl: string
  pageTitle: string
}>()

const { wcagifyUrl, reportSlug } = useSettings()
const { t } = useI18n()

const title = ref('')
const description = ref('')
const sc = ref('')
const severity = ref<'Low' | 'Medium' | 'High'>('Medium')
const difficulty = ref<'Low' | 'Medium' | 'High'>('Medium')
const sample = ref('')

const submitting = ref(false)
const submitStatus = ref<'idle' | 'success' | 'error'>('idle')
const submitMessage = ref('')

const selectedReport = computed(() => props.reports.find((r) => r.slug === reportSlug.value))

const samplePages = computed(() => selectedReport.value?.sample ?? [])

const canSubmit = computed(
  () =>
    reportSlug.value && title.value.trim() && sc.value.trim() && sample.value && !submitting.value
)

const severityOptions = computed(() => [
  { value: 'Low' as const, label: t('form.low') },
  { value: 'Medium' as const, label: t('form.medium') },
  { value: 'High' as const, label: t('form.high') }
])

const difficultyOptions = computed(() => [
  { value: 'Low' as const, label: t('form.low') },
  { value: 'Medium' as const, label: t('form.medium') },
  { value: 'High' as const, label: t('form.high') }
])

async function submit() {
  if (!canSubmit.value) return

  submitting.value = true
  submitStatus.value = 'idle'
  submitMessage.value = ''

  const bodyParts: string[] = []
  if (props.pageUrl) bodyParts.push(`**Found on:** [${props.pageUrl}](${props.pageUrl})`)
  if (props.selector) bodyParts.push(`**Element:** \`${props.selector}\``)
  if (description.value.trim()) {
    // Convert absolute server URLs to relative paths for portability
    const baseUrl = wcagifyUrl.value.replace(/\/$/, '')
    const relativeDescription = description.value.trim().replaceAll(baseUrl, '')
    bodyParts.push('', relativeDescription)
  }

  try {
    const url = wcagifyUrl.value.replace(/\/$/, '')
    const res = await fetch(`${url}/api/issues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        report: reportSlug.value,
        title: title.value.trim(),
        sc: sc.value.trim(),
        severity: severity.value,
        difficulty: difficulty.value,
        sample: sample.value,
        description: bodyParts.join('\n')
      })
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.message || `HTTP ${res.status}`)
    }

    submitStatus.value = 'success'
    submitMessage.value = t('form.issueCreated')
    title.value = ''
    description.value = ''
    sc.value = ''
  } catch (e) {
    submitStatus.value = 'error'
    submitMessage.value = e instanceof Error ? e.message : t('form.failedToCreate')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form @submit.prevent="submit" class="space-y-3">
    <div>
      <label
        for="issue-title"
        class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1"
        >{{ t('form.issueTitle') }}</label
      >
      <input
        id="issue-title"
        v-model="title"
        type="text"
        maxlength="200"
        :placeholder="t('form.issueTitlePlaceholder')"
        class="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-base text-gray-900 dark:text-gray-100 focus:border-green-600 dark:focus:border-green-400 focus:outline-none"
      />
    </div>

    <div class="grid grid-cols-3 gap-2">
      <div>
        <label
          for="issue-sc"
          class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1"
          >{{ t('form.sc') }}</label
        >
        <input
          id="issue-sc"
          v-model="sc"
          type="text"
          maxlength="10"
          placeholder="2.1.1"
          class="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-base text-gray-900 dark:text-gray-100 focus:border-green-600 dark:focus:border-green-400 focus:outline-none"
        />
      </div>
      <div>
        <label
          for="issue-severity"
          class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1"
          >{{ t('form.severity') }}</label
        >
        <select
          id="issue-severity"
          v-model="severity"
          class="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-base text-gray-900 dark:text-gray-100 focus:border-green-600 dark:focus:border-green-400 focus:outline-none"
        >
          <option v-for="opt in severityOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
      <div>
        <label
          for="issue-difficulty"
          class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1"
          >{{ t('form.difficulty') }}</label
        >
        <select
          id="issue-difficulty"
          v-model="difficulty"
          class="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-base text-gray-900 dark:text-gray-100 focus:border-green-600 dark:focus:border-green-400 focus:outline-none"
        >
          <option v-for="opt in difficultyOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
    </div>

    <div>
      <label
        for="issue-sample"
        class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1"
        >{{ t('form.samplePage') }}</label
      >
      <select
        id="issue-sample"
        v-model="sample"
        class="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-base text-gray-900 dark:text-gray-100 focus:border-green-600 dark:focus:border-green-400 focus:outline-none"
      >
        <option value="" disabled>{{ t('form.selectPage') }}</option>
        <option v-for="page in samplePages" :key="page.id" :value="page.id">
          {{ page.title }}
        </option>
      </select>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{{
        t('form.description')
      }}</label>
      <RichTextEditor v-model="description" :placeholder="t('form.descriptionPlaceholder')" />
    </div>

    <button
      type="submit"
      :disabled="!canSubmit"
      class="w-full rounded bg-green-700 dark:bg-green-600 px-3 py-2 text-base font-medium text-white hover:bg-green-800 dark:hover:bg-green-700 disabled:opacity-50"
    >
      {{ submitting ? t('form.submitting') : t('form.submit') }}
    </button>

    <div
      v-if="submitStatus === 'success'"
      class="rounded bg-green-50 dark:bg-green-900/30 p-2 text-sm text-green-700 dark:text-green-400"
    >
      {{ submitMessage }}
    </div>
    <div
      v-if="submitStatus === 'error'"
      class="rounded bg-red-50 dark:bg-red-900/30 p-2 text-sm text-red-700 dark:text-red-400"
    >
      {{ submitMessage }}
    </div>
  </form>
</template>
