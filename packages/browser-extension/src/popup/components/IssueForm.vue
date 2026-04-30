<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
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

const sampleTouched = ref(false)
const titleTouched = ref(false)
const scTouched = ref(false)

function clearTitle() {
  title.value = ''
  titleTouched.value = true
}

function useDescToggle(getDesc: () => string) {
  const open = ref(false)
  const liveText = ref('')
  function toggle() {
    open.value = !open.value
    liveText.value = open.value ? `${t('form.descExpanded')} ${getDesc()}` : t('form.descCollapsed')
  }
  return { open, liveText, toggle }
}

const info = reactive({
  sample: useDescToggle(() => t('form.samplePage.description')),
  title: useDescToggle(() => t('form.issueTitle.description')),
  sc: useDescToggle(() => t('form.sc.description')),
  severity: useDescToggle(() => t('form.severity.description')),
  type: useDescToggle(() => t('form.type.description')),
  body: useDescToggle(() => t('form.description.description'))
})

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
  <UForm :state="{}" class="space-y-3" @submit="submit">
    <UFormField
      :label="t('form.samplePage.label')"
      name="issue-sample"
      :error="sampleTouched && !sample ? t('form.samplePage.error') : undefined"
      :ui="{
        label: 'label-title',
        labelWrapper: 'flex items-center justify-start gap-1',
        base: 'relative'
      }"
    >
      <template #hint>
        <span class="label-hint" aria-hidden="true">({{ t('form.required') }})</span>
      </template>

      <span id="issue-sample-desc" class="sr-only">
        {{ t('form.samplePage.description') }}
      </span>

      <div class="relative">
        <div aria-live="polite" aria-atomic="true" class="sr-only">
          {{ info.sample.liveText }}
        </div>

        <Transition name="collapsible">
          <div v-show="info.sample.open" id="issue-sample-more-desc" class="grid">
            <p class="label-hint overflow-hidden min-h-0 mb-1">
              {{ t('form.samplePage.description') }}
            </p>
          </div>
        </Transition>

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

        <UButton
          :aria-label="`${info.sample.open ? t('form.descBtnClose') : t('form.descBtnOpen')} ${t('form.samplePage.label')}`"
          :aria-expanded="info.sample.open"
          aria-controls="issue-sample-more-desc"
          icon="i-lucide-info"
          size="xs"
          variant="ghost"
          color="neutral"
          :ui="{ base: 'selectable-focus cursor-pointer absolute -top-7.5 right-0' }"
          @click="info.sample.toggle"
        />
      </div>
    </UFormField>

    <UFormField
      :label="t('form.issueTitle.label')"
      name="issue-title"
      :error="titleTouched && !title.trim() ? t('form.issueTitle.error') : undefined"
      :ui="{
        label: 'label-title',
        labelWrapper: 'flex items-center justify-start gap-1',
        hint: 'label-hint'
      }"
    >
      <template #hint>
        <span aria-hidden="true">({{ t('form.required') }})</span>
      </template>

      <span id="issue-title-desc" class="sr-only">
        {{ t('form.issueTitle.description') }}
      </span>

      <div class="relative">
        <div aria-live="polite" aria-atomic="true" class="sr-only">
          {{ info.title.liveText }}
        </div>

        <Transition name="collapsible">
          <div v-show="info.title.open" id="issue-title-more-desc" class="grid">
            <p class="label-hint overflow-hidden min-h-0 mb-1">
              {{ t('form.issueTitle.description') }}
            </p>
          </div>
        </Transition>

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
              base: '[&::placeholder]:text-muted py-2 pe-8 text-sm hover:bg-accented/75 selectable-focus'
            }"
            variant="subtle"
            class="w-full"
          />
          <UButton
            v-if="title"
            color="primary"
            variant="ghost"
            size="xs"
            icon="i-lucide-x"
            :aria-label="t('form.issueTitle.clear')"
            :ui="{
              base: 'selectable-focus cursor-pointer absolute end-2 top-1/2 -translate-y-1/2'
            }"
            @pointerdown.stop
            @click.stop="clearTitle"
            @keydown.enter.stop="clearTitle"
            @keydown.space.prevent.stop="clearTitle"
          />
        </div>

        <UButton
          :aria-label="`${info.title.open ? t('form.descBtnClose') : t('form.descBtnOpen')} ${t('form.issueTitle.label')}`"
          :aria-expanded="info.title.open"
          aria-controls="issue-title-more-desc"
          icon="i-lucide-info"
          size="xs"
          variant="ghost"
          color="neutral"
          :ui="{ base: 'selectable-focus cursor-pointer absolute -top-7.5 right-0' }"
          @click="info.title.toggle"
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
        hint: 'label-hint'
      }"
    >
      <template #hint>
        <span aria-hidden="true">({{ t('form.required') }})</span>
      </template>

      <span id="issue-sc-desc" class="sr-only">
        {{ t('form.sc.description') }}
      </span>

      <div class="relative">
        <div aria-live="polite" aria-atomic="true" class="sr-only">
          {{ info.sc.liveText }}
        </div>

        <Transition name="collapsible">
          <div v-show="info.sc.open" id="issue-sc-more-desc" class="grid">
            <p class="label-hint overflow-hidden min-h-0 mb-1">
              {{ t('form.sc.description') }}
            </p>
          </div>
        </Transition>

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

        <UButton
          :aria-label="`${info.sc.open ? t('form.descBtnClose') : t('form.descBtnOpen')} ${t('form.sc.label')}`"
          :aria-expanded="info.sc.open"
          aria-controls="issue-sc-more-desc"
          icon="i-lucide-info"
          size="xs"
          variant="ghost"
          color="neutral"
          :ui="{ base: 'selectable-focus cursor-pointer absolute -top-7.5 right-0' }"
          @click="info.sc.toggle"
        />
      </div>
    </UFormField>

    <div class="flex sm:flex-row flex-col gap-3">
      <UFormField
        :label="t('form.severity.label')"
        name="issue-severity"
        :ui="{
          label: 'label-title after:content-none',
          labelWrapper: 'flex items-center justify-start gap-1',
          hint: 'label-hint'
        }"
        class="w-full"
      >
        <span id="issue-severity-desc" class="sr-only">
          {{ t('form.severity.description') }}
        </span>

        <div class="relative">
          <div aria-live="polite" aria-atomic="true" class="sr-only">
            {{ info.severity.liveText }}
          </div>

          <Transition name="collapsible">
            <div v-show="info.severity.open" id="issue-severity-more-desc" class="grid">
              <p class="label-hint overflow-hidden min-h-0 mb-1">
                {{ t('form.severity.description') }}
              </p>
            </div>
          </Transition>

          <ClearableSelect
            id="issue-severity"
            :aria-describedby="'issue-severity-desc'"
            v-model="severity"
            :label="t('form.severity.label')"
            :items="severityOptions"
            :placeholder="t('form.severity.none')"
            :clear-label="`${t('form.severity.label')} ${t('form.clear')}`"
          />

          <UButton
            :aria-label="`${info.severity.open ? t('form.descBtnClose') : t('form.descBtnOpen')} ${t('form.severity.label')}`"
            :aria-expanded="info.severity.open"
            aria-controls="issue-severity-more-desc"
            icon="i-lucide-info"
            size="xs"
            variant="ghost"
            color="neutral"
            :ui="{ base: 'selectable-focus cursor-pointer absolute -top-7.5 right-0' }"
            @click="info.severity.toggle"
          />
        </div>
      </UFormField>
      <UFormField
        :label="t('form.type.label')"
        name="issue-type"
        :ui="{
          label: 'label-title after:content-none',
          labelWrapper: 'flex items-center justify-start gap-1',
          hint: 'label-hint'
        }"
        class="w-full"
      >
        <span id="issue-type-desc" class="sr-only">
          {{ t('form.type.description') }}
        </span>

        <div class="relative">
          <div aria-live="polite" aria-atomic="true" class="sr-only">
            {{ info.type.liveText }}
          </div>

          <Transition name="collapsible">
            <div v-show="info.type.open" id="issue-type-more-desc" class="grid">
              <p class="label-hint overflow-hidden min-h-0 mb-1">
                {{ t('form.type.description') }}
              </p>
            </div>
          </Transition>

          <ClearableSelect
            id="issue-type"
            :aria-describedby="'issue-type-desc'"
            v-model="type"
            :label="t('form.type.label')"
            :items="typeOptions"
            :placeholder="t('form.type.unknown')"
            :clear-label="`${t('form.type.label')} ${t('form.clear')}`"
          />

          <UButton
            :aria-label="`${info.type.open ? t('form.descBtnClose') : t('form.descBtnOpen')} ${t('form.type.label')}`"
            :aria-expanded="info.type.open"
            aria-controls="issue-type-more-desc"
            icon="i-lucide-info"
            size="xs"
            variant="ghost"
            color="neutral"
            :ui="{ base: 'selectable-focus cursor-pointer absolute -top-7.5 right-0' }"
            @click="info.type.toggle"
          />
        </div>
      </UFormField>
    </div>

    <UFormField
      :label="t('form.description.label')"
      name="issue-description"
      required
      :ui="{
        label: 'label-title after:content-none',
        labelWrapper: 'flex items-center justify-start gap-1',
        hint: 'label-hint',
        base: 'relative'
      }"
    >
      <template #hint>
        <span aria-hidden="true">({{ t('form.required') }})</span>
      </template>

      <span id="issue-description-desc" class="sr-only">
        {{ t('form.description.description') }}
      </span>

      <div class="relative">
        <div aria-live="polite" aria-atomic="true" class="sr-only">
          {{ info.body.liveText }}
        </div>

        <Transition name="collapsible">
          <div v-show="info.body.open" id="issue-description-more-desc" class="grid">
            <p class="label-hint overflow-hidden min-h-0 mb-1">
              {{ t('form.description.description') }}
            </p>
          </div>
        </Transition>

        <RichTextEditor
          v-model="description"
          :placeholder="t('form.description.placeholder')"
          :label="t('form.description.label')"
          :aria-describedby="'issue-description-desc'"
        />

        <UButton
          :aria-label="`${info.body.open ? t('form.descBtnClose') : t('form.descBtnOpen')} ${t('form.description.label')}`"
          :aria-expanded="info.body.open"
          aria-controls="issue-description-more-desc"
          icon="i-lucide-info"
          size="xs"
          variant="ghost"
          color="neutral"
          :ui="{ base: 'selectable-focus cursor-pointer absolute -top-7.5 right-0' }"
          @click="info.body.toggle"
        />
      </div>
    </UFormField>

    <UButton
      type="submit"
      :disabled="!canSubmit"
      :loading="submitting"
      :label="submitting ? t('form.submitIssue.loading') : t('form.submitIssue.label')"
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
