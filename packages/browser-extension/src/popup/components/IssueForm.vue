<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Report } from '../../types'
import { useSettings } from '../../composables/useSettings'
import { useI18n } from '../../composables/useI18n'
import RichTextEditor from './RichTextEditor.vue'
import ScCombobox from './ScCombobox.vue'
import ClearableSelect from './ClearableSelect.vue'

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
const severity = ref<'Low' | 'Medium' | 'High' | undefined>(undefined)
const type = ref<'Content' | 'Design' | 'Technical' | undefined>(undefined)
const sample = ref('')

const submitting = ref(false)
const submitStatus = ref<'idle' | 'success' | 'error'>('idle')
const submitMessage = ref('')

const selectedReport = computed(() => props.reports.find((r) => r.slug === reportSlug.value))

const samplePages = computed(() => selectedReport.value?.sample ?? [])
const sampleModel = computed({
  get: () => sample.value || undefined,
  set: (v: string | undefined) => {
    sample.value = v ?? ''
  }
})
const wcagVersion = computed(() => selectedReport.value?.wcagVersion ?? '2.2')
const targetLevel = computed(() => selectedReport.value?.targetLevel ?? 'AA')

watch(
  samplePages,
  (pages) => {
    if (sample.value && !pages.some((page) => page.id === sample.value)) {
      sample.value = ''
    }
  },
  { immediate: true }
)

watch(
  () => props.pageUrl,
  (url) => {
    if (!url) return
    const match = samplePages.value.find((page) => url.startsWith(page.url))
    if (match) sample.value = match.id
  },
  { immediate: true }
)

const canSubmit = computed(
  () =>
    reportSlug.value &&
    title.value.trim() &&
    sc.value.trim() &&
    sample.value &&
    description.value.trim() &&
    !submitting.value
)

const severityOptions = computed(() => [
  { value: 'Low' as const, label: t('form.low') },
  { value: 'Medium' as const, label: t('form.medium') },
  { value: 'High' as const, label: t('form.high') }
])

const typeOptions = computed(() => [
  { value: 'Content' as const, label: t('form.content') },
  { value: 'Design' as const, label: t('form.design') },
  { value: 'Technical' as const, label: t('form.technical') }
])

async function submit() {
  if (!canSubmit.value) return

  submitting.value = true
  submitStatus.value = 'idle'
  submitMessage.value = ''

  const bodyParts: string[] = []
  if (description.value.trim()) {
    // Convert absolute server URLs to relative paths for portability
    const baseUrl = wcagifyUrl.value.replace(/\/$/, '')
    const relativeDescription = description.value.trim().replaceAll(baseUrl, '')
    bodyParts.push(relativeDescription)
  }
  if (props.pageUrl) bodyParts.push(`#### Found on:\n[${props.pageUrl}](${props.pageUrl})\n`)
  if (props.selector) bodyParts.push(`#### Element:\n\`${props.selector}\``)

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
        type: type.value,
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
  } catch (error) {
    submitStatus.value = 'error'
    submitMessage.value = error instanceof Error ? error.message : t('form.failedToCreate')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <UForm :state="{}" class="space-y-3" @submit="submit">
    <UFormField
      :label="t('form.samplePage')"
      name="issue-sample"
      :ui="{
        label: 'label-title',
        labelWrapper: 'flex items-center justify-start gap-1',
        hint: 'label-hint'
      }"
    >
      <template #hint>
        <span aria-hidden="true">({{ t('form.required') }})</span>
      </template>
      <ClearableSelect
        id="issue-sample"
        v-model="sampleModel"
        :label="t('form.samplePage')"
        :items="samplePages.map((p) => ({ label: `${p.title} — ${p.url}`, value: p.id }))"
        :placeholder="t('form.selectPage')"
        :clear-label="t('form.clearPage')"
        required
      />
    </UFormField>

    <UFormField
      :label="t('form.issueTitle')"
      name="issue-title"
      :ui="{
        label: 'label-title',
        labelWrapper: 'flex items-center justify-start gap-1',
        hint: 'label-hint'
      }"
    >
      <template #hint>
        <span aria-hidden="true">({{ t('form.required') }})</span>
      </template>
      <UInput
        id="issue-title"
        v-model="title"
        type="text"
        maxlength="200"
        required
        aria-required="true"
        :placeholder="title ? undefined : t('form.issueTitlePlaceholder')"
        :ui="{
          trailing: 'pe-2',
          base: '[&::placeholder]:text-muted py-2 pe-8 text-sm hover:bg-accented/75 selectable-focus'
        }"
        variant="subtle"
        class="w-full"
      >
        <template v-if="title?.length" #trailing>
          <UButton
            color="primary"
            variant="ghost"
            size="xs"
            icon="i-lucide-x"
            :aria-label="t('form.clearTitle')"
            :ui="{
              base: 'selectable-focus cursor-pointer'
            }"
            @click="title = ''"
          />
        </template>
      </UInput>
    </UFormField>

    <UFormField
      :label="t('form.sc')"
      :aria-label="t('form.scLabel')"
      name="issue-sc"
      :ui="{
        label: 'label-title',
        labelWrapper: 'flex items-center justify-start gap-1',
        hint: 'label-hint'
      }"
    >
      <template #hint>
        <span aria-hidden="true">({{ t('form.required') }})</span>
      </template>
      <ScCombobox
        id="issue-sc"
        v-model="sc"
        :wcag-version="wcagVersion"
        :target-level="targetLevel"
        required
        :placeholder="t('form.scPlaceholder')"
      />
    </UFormField>

    <div class="flex sm:flex-row flex-col gap-3">
      <UFormField
        :label="t('form.severity')"
        name="issue-severity"
        :ui="{
          label: 'label-title after:content-none',
          labelWrapper: 'flex items-center justify-start gap-1',
          hint: 'label-hint'
        }"
        class="w-full"
      >
        <ClearableSelect
          id="issue-severity"
          v-model="severity"
          :label="t('form.severity')"
          :items="severityOptions"
          :placeholder="t('form.none')"
          :clear-label="t('form.clearSeverity')"
        />
      </UFormField>
      <UFormField
        :label="t('form.type')"
        name="issue-type"
        :ui="{
          label: 'label-title after:content-none',
          labelWrapper: 'flex items-center justify-start gap-1',
          hint: 'label-hint'
        }"
        class="w-full"
      >
        <ClearableSelect
          id="issue-type"
          v-model="type"
          :label="t('form.type')"
          :items="typeOptions"
          :placeholder="t('form.unknown')"
          :clear-label="t('form.clearType')"
        />
      </UFormField>
    </div>

    <UFormField
      :label="t('form.description')"
      name="issue-description"
      required
      :ui="{
        label: 'label-title after:content-none',
        labelWrapper: 'flex items-center justify-start gap-1',
        hint: 'label-hint'
      }"
    >
      <template #hint>
        <span aria-hidden="true">({{ t('form.required') }})</span>
      </template>
      <RichTextEditor
        v-model="description"
        :placeholder="t('form.descriptionPlaceholder')"
        :label="t('form.description')"
      />
    </UFormField>

    <UButton
      type="submit"
      :disabled="!canSubmit"
      :loading="submitting"
      :label="submitting ? t('form.submitting') : t('form.submit')"
      size="xl"
      icon="i-lucide-file-input"
      :ui="{ leadingIcon: 'size-5', base: 'cursor-pointer selectable-focus w-full justify-center' }"
    />

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
  </UForm>
</template>
