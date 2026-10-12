<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Report } from '../../types'
import { useSettings } from '../../composables/useSettings'
import { useI18n } from '../../composables/useI18n'
import RichTextEditor from './RichTextEditor.vue'
import ScCombobox from './ScCombobox.vue'
import ClearableSelect from './ClearableSelect.vue'
import FieldHintPopover from './FieldHintPopover.vue'

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

const sampleTouched = ref(false)
const titleTouched = ref(false)
const scTouched = ref(false)

function clearTitle() {
  title.value = ''
  titleTouched.value = true
}

const selectedReport = computed(() => props.reports.find((r) => r.slug === reportSlug.value))

const samplePages = computed(() => selectedReport.value?.sample ?? [])
const sampleModel = computed({
  get: () => sample.value || undefined,
  set: (v: string | undefined) => {
    sampleTouched.value = true
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
  { value: 'Low' as const, label: t('form.severity.low') },
  { value: 'Medium' as const, label: t('form.severity.medium') },
  { value: 'High' as const, label: t('form.severity.high') }
])

const typeOptions = computed(() => [
  { value: 'Content' as const, label: t('form.type.content') },
  { value: 'Design' as const, label: t('form.type.design') },
  { value: 'Technical' as const, label: t('form.type.technical') }
])

async function submit() {
  sampleTouched.value = true
  titleTouched.value = true
  scTouched.value = true
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
    submitMessage.value = t('form.submitIssue.issueSuccess')
    title.value = ''
    description.value = ''
    sc.value = ''
    titleTouched.value = false
    scTouched.value = false
  } catch (error) {
    submitStatus.value = 'error'
    submitMessage.value = error instanceof Error ? error.message : t('form.submitIssue.issueFailed')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form class="space-y-3" @submit.prevent="submit">
    <UFormField
      :label="t('form.samplePage.label')"
      name="issue-sample"
      :error="sampleTouched && !sample ? t('form.samplePage.error') : undefined"
      :ui="{
        label: 'label-title',
        labelWrapper: 'flex items-center justify-start gap-1',
        hint: 'label-hint flex items-center'
      }"
    >
      <template #hint>
        <span aria-hidden="true">({{ t('form.required') }})</span>
        <FieldHintPopover
          :label="t('form.samplePage.label')"
          :description="t('form.samplePage.description')"
        />
      </template>

      <span id="issue-sample-desc" class="sr-only">
        {{ t('form.samplePage.description') }}
      </span>

      <ClearableSelect
        id="issue-sample"
        :aria-describedby="'issue-sample-desc'"
        v-model="sampleModel"
        :label="t('form.samplePage.label')"
        :items="samplePages.map((p) => ({ label: `${p.title} — ${p.url}`, value: p.id }))"
        :placeholder="t('form.samplePage.placeholder')"
        :clear-label="t('form.samplePage.clear')"
        required
      />
    </UFormField>

    <UFormField
      :label="t('form.issueTitle.label')"
      name="issue-title"
      :error="titleTouched && !title.trim() ? t('form.issueTitle.error') : undefined"
      :ui="{
        label: 'label-title',
        labelWrapper: 'flex items-center justify-start gap-1',
        hint: 'label-hint flex items-center'
      }"
    >
      <template #hint>
        <span aria-hidden="true">({{ t('form.required') }})</span>
        <FieldHintPopover
          :label="t('form.issueTitle.label')"
          :description="t('form.issueTitle.description')"
        />
      </template>

      <span id="issue-title-desc" class="sr-only">
        {{ t('form.issueTitle.description') }}
      </span>

      <div class="relative w-full">
        <UInput
          id="issue-title"
          v-model="title"
          type="text"
          maxlength="200"
          required
          aria-required="true"
          :aria-describedby="'issue-title-desc'"
          :placeholder="title ? undefined : t('form.issueTitle.placeholder')"
          :ui="{
            base: 'py-2'
          }"
          variant="subtle"
        />
        <UButton
          v-if="title"
          variant="ghost"
          size="xs"
          icon="i-lucide-x"
          :aria-label="t('form.issueTitle.clear')"
          :ui="{
            base: 'absolute end-2 top-1/2 -translate-y-1/2'
          }"
          @pointerdown.stop
          @click.stop="clearTitle"
          @keydown.enter.stop="clearTitle"
          @keydown.space.prevent.stop="clearTitle"
        />
      </div>
    </UFormField>

    <UFormField
      :label="t('form.sc.label')"
      :aria-label="t('form.sc.ariaLabel')"
      name="issue-sc"
      :error="scTouched && !sc.trim() ? t('form.sc.error') : undefined"
      :ui="{
        label: 'label-title',
        labelWrapper: 'flex items-center justify-start gap-1',
        hint: 'label-hint flex items-center'
      }"
    >
      <template #hint>
        <span aria-hidden="true">({{ t('form.required') }})</span>
        <FieldHintPopover :label="t('form.sc.label')" :description="t('form.sc.description')" />
      </template>

      <span id="issue-sc-desc" class="sr-only">
        {{ t('form.sc.description') }}
      </span>

      <ScCombobox
        id="issue-sc"
        v-model="sc"
        :wcag-version="wcagVersion"
        :target-level="targetLevel"
        required
        :placeholder="t('form.sc.placeholder')"
        :aria-describedby="'issue-sc-desc'"
        @update:model-value="scTouched = true"
      />
    </UFormField>

    <div class="flex sm:flex-row flex-col gap-3">
      <UFormField
        :label="t('form.severity.label')"
        name="issue-severity"
        :ui="{
          label: 'label-title after:content-none',
          labelWrapper: 'flex items-center justify-start gap-1',
          hint: 'label-hint flex items-center'
        }"
        class="w-full"
      >
        <template #hint>
          <FieldHintPopover
            :label="t('form.severity.label')"
            :description="t('form.severity.description')"
          />
        </template>

        <span id="issue-severity-desc" class="sr-only">
          {{ t('form.severity.description') }}
        </span>

        <ClearableSelect
          id="issue-severity"
          :aria-describedby="'issue-severity-desc'"
          v-model="severity"
          :label="t('form.severity.label')"
          :items="severityOptions"
          :placeholder="t('form.severity.none')"
          :clear-label="`${t('form.severity.label')} ${t('form.clear')}`"
        />
      </UFormField>

      <UFormField
        :label="t('form.type.label')"
        name="issue-type"
        :ui="{
          label: 'label-title after:content-none',
          labelWrapper: 'flex items-center justify-start gap-1',
          hint: 'label-hint flex items-center'
        }"
        class="w-full"
      >
        <template #hint>
          <FieldHintPopover
            :label="t('form.type.label')"
            :description="t('form.type.description')"
          />
        </template>

        <span id="issue-type-desc" class="sr-only">
          {{ t('form.type.description') }}
        </span>

        <ClearableSelect
          id="issue-type"
          :aria-describedby="'issue-type-desc'"
          v-model="type"
          :label="t('form.type.label')"
          :items="typeOptions"
          :placeholder="t('form.type.unknown')"
          :clear-label="`${t('form.type.label')} ${t('form.clear')}`"
        />
      </UFormField>
    </div>

    <UFormField
      :label="t('form.description.label')"
      name="issue-description"
      required
      :ui="{
        label: 'label-title after:content-none',
        labelWrapper: 'flex items-center justify-start gap-1',
        hint: 'label-hint flex items-center'
      }"
    >
      <template #hint>
        <span aria-hidden="true">({{ t('form.required') }})</span>
        <FieldHintPopover
          :label="t('form.description.label')"
          :description="t('form.description.description')"
        />
      </template>

      <span id="issue-description-desc" class="sr-only">
        {{ t('form.description.description') }}
      </span>

      <RichTextEditor
        v-model="description"
        :placeholder="t('form.description.placeholder')"
        :label="t('form.description.label')"
        :aria-describedby="'issue-description-desc'"
      />
    </UFormField>

    <UButton
      type="submit"
      :disabled="!canSubmit"
      :loading="submitting"
      :label="submitting ? t('form.submitIssue.loading') : t('form.submitIssue.label')"
      size="xl"
      icon="i-lucide-file-input"
      :ui="{ leadingIcon: 'size-5', base: 'w-full justify-center' }"
    />
    <UAlert
      v-if="submitStatus === 'success'"
      color="success"
      variant="subtle"
      icon="i-lucide-circle-check"
      :description="submitMessage"
    />
    <UAlert
      v-if="submitStatus === 'error'"
      color="error"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      :description="submitMessage"
    />
  </form>
</template>
