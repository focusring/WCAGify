<script setup lang="ts">
import type { ReportsCollectionItem } from '@nuxt/content'
import { toSlug } from '@focusring/wcagify'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  reports: ReportsCollectionItem[]
}>()

const emit = defineEmits<{
  imported: [slug: string]
}>()

const { t } = useI18n()
const toast = useToast()

interface IssueSummary {
  index: number
  title: string
  sc: string
  scName: string
  sample: string
  sampleTitle: string
  sampleUrl: string
  severity?: string
  type?: string
}

interface ImportSummary {
  slug: string
  title: string
  wcagVersion: string
  targetLevel: string
  samples: number
  issues: number
  passed: number
  notPresent: number
  warnings: string[]
  issueList?: IssueSummary[]
  reportDir?: string
  issuesWritten?: number
}

const fileName = ref('')
const document = ref('')
const preview = ref<ImportSummary>()
const slug = ref('')
const mode = ref<'create' | 'merge'>('create')
const mergeSlug = ref('')
const busy = ref(false)
const error = ref('')
/** Indices of previewed issues the user chose not to import. */
const skipped = ref(new Set<number>())

const issueList = computed(() => preview.value?.issueList ?? [])
const selectedCount = computed(() => issueList.value.length - skipped.value.size)

function isSelected(index: number) {
  return !skipped.value.has(index)
}

function setSelected(index: number, selected: boolean) {
  const next = new Set(skipped.value)
  if (selected) next.delete(index)
  else next.add(index)
  skipped.value = next
}

function selectAll(selected: boolean) {
  skipped.value = selected ? new Set() : new Set(issueList.value.map((issue) => issue.index))
}

// Titles are not unique, an imported copy keeps its title, so the label includes the slug.
const existingReports = computed(() =>
  props.reports.map((report) => {
    const value = report.path?.replace('/reports/', '') ?? ''
    return { label: `${report.title} (${value})`, value }
  })
)

const modeItems = computed(() => [
  { label: t('import.modeCreate'), value: 'create' },
  { label: t('import.modeMerge'), value: 'merge' }
])

const targetSlug = computed(() => (mode.value === 'merge' ? mergeSlug.value : slug.value))
const slugValid = computed(() => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(targetSlug.value))

function reset() {
  fileName.value = ''
  document.value = ''
  preview.value = undefined
  skipped.value = new Set()
  slug.value = ''
  mode.value = 'create'
  mergeSlug.value = existingReports.value[0]?.value ?? ''
  error.value = ''
}

watch(open, (isOpen) => {
  if (isOpen) reset()
})

/**
 * Every file selection gets a request id. Only the latest one may apply its
 * preview, so a slow response for an earlier file can never be paired with
 * the text of a later one.
 */
let previewRequest = 0

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const request = ++previewRequest
  busy.value = true
  error.value = ''
  preview.value = undefined
  skipped.value = new Set()
  fileName.value = file.name
  document.value = ''
  const text = await file.text()
  if (request !== previewRequest) return
  document.value = text
  await loadPreview(text, request)
}

async function loadPreview(text: string, request: number) {
  try {
    const summary = await $fetch<ImportSummary>('/api/earl/import', {
      method: 'POST',
      body: { earl: text, dryRun: true }
    })
    if (request !== previewRequest) return
    preview.value = summary
    slug.value = summary.slug || toSlug(summary.title)
  } catch (fetchError: unknown) {
    if (request !== previewRequest) return
    error.value =
      (fetchError as { statusMessage?: string; data?: { statusMessage?: string } }).data
        ?.statusMessage ??
      (fetchError as { statusMessage?: string }).statusMessage ??
      t('import.error')
  } finally {
    if (request === previewRequest) busy.value = false
  }
}

async function runImport() {
  if (!preview.value || !slugValid.value) return
  busy.value = true
  error.value = ''
  try {
    const result = await $fetch<ImportSummary>('/api/earl/import', {
      method: 'POST',
      body: {
        earl: document.value,
        slug: targetSlug.value,
        mode: mode.value,
        skipIssues: [...skipped.value]
      }
    })
    toast.add({
      title: t('import.success', { count: result.issuesWritten ?? result.issues }),
      color: 'success'
    })
    open.value = false
    emit('imported', result.slug)
  } catch (fetchError: unknown) {
    error.value =
      (fetchError as { data?: { statusMessage?: string } }).data?.statusMessage ??
      (fetchError as { statusMessage?: string }).statusMessage ??
      t('import.error')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <USlideover
    v-model:open="open"
    :title="$t('import.title')"
    :description="$t('import.description')"
  >
    <template #body>
      <div class="space-y-6">
        <div>
          <label for="earl-file" class="block text-sm font-medium text-default">
            {{ $t('import.file') }}
          </label>
          <div class="mt-1">
            <input
              id="earl-file"
              aria-describedby="earl-file-help"
              type="file"
              accept=".json,.jsonld,application/json,application/ld+json"
              class="block w-full text-sm text-default file:mr-3 file:rounded-md file:border-0 file:bg-elevated file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-highlighted hover:file:bg-accented"
              :disabled="busy"
              @change="onFileChange"
            />
          </div>
          <p id="earl-file-help" class="mt-1 text-sm text-muted">
            {{ $t('import.fileHelp') }}
          </p>
        </div>

        <p v-if="error" role="alert" class="text-sm text-error">
          {{ error }}
        </p>

        <template v-if="preview">
          <dl class="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-default p-4 text-sm">
            <dt class="text-toned">{{ $t('report.title') }}</dt>
            <dd class="text-highlighted">{{ preview.title }}</dd>
            <dt class="text-toned">{{ $t('report.wcagVersion') }}</dt>
            <dd class="text-highlighted">
              WCAG {{ preview.wcagVersion }} {{ preview.targetLevel }}
            </dd>
            <dt class="text-toned">{{ $t('report.sample') }}</dt>
            <dd class="text-highlighted">{{ preview.samples }}</dd>
            <dt class="text-toned">{{ $t('report.issues') }}</dt>
            <dd class="text-highlighted">
              {{
                $t('import.issuesSelected', { selected: selectedCount, total: issueList.length })
              }}
            </dd>
            <dt class="text-toned">{{ $t('report.scStatus.passed') }}</dt>
            <dd class="text-highlighted">{{ preview.passed }}</dd>
            <dt class="text-toned">{{ $t('report.scStatus.not-present') }}</dt>
            <dd class="text-highlighted">{{ preview.notPresent }}</dd>
          </dl>

          <fieldset v-if="issueList.length" class="rounded-lg border border-default p-4">
            <legend class="px-1 text-sm font-medium text-highlighted">
              {{ $t('import.issuesToImport') }}
            </legend>
            <p class="text-sm text-toned">{{ $t('import.issuesHelp') }}</p>
            <div class="mt-2 flex gap-2">
              <UButton
                :label="$t('import.selectAll')"
                size="xs"
                variant="ghost"
                color="neutral"
                :disabled="skipped.size === 0"
                @click="selectAll(true)"
              />
              <UButton
                :label="$t('import.selectNone')"
                size="xs"
                variant="ghost"
                color="neutral"
                :disabled="selectedCount === 0"
                @click="selectAll(false)"
              />
            </div>
            <ul class="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
              <li v-for="issue in issueList" :key="issue.index">
                <UCheckbox
                  :model-value="isSelected(issue.index)"
                  :label="issue.title"
                  :description="`${issue.scName} · ${issue.sampleTitle}`"
                  @update:model-value="(value) => setSelected(issue.index, value === true)"
                />
              </li>
            </ul>
          </fieldset>

          <div
            v-if="preview.warnings.length"
            class="rounded-lg border border-warning/50 bg-warning/10 p-4"
          >
            <h3 class="text-sm font-medium text-highlighted">{{ $t('import.warnings') }}</h3>
            <ul class="mt-2 list-disc list-inside space-y-1 text-sm text-toned">
              <li v-for="warning in preview.warnings" :key="warning">{{ warning }}</li>
            </ul>
          </div>

          <UFormField :label="$t('import.mode')" name="mode">
            <URadioGroup v-model="mode" :items="modeItems" />
          </UFormField>

          <UFormField
            v-if="mode === 'create'"
            :label="$t('import.slug')"
            :help="$t('import.slugHelp')"
            :error="slug && !slugValid ? $t('import.slugInvalid') : undefined"
            name="slug"
          >
            <UInput v-model="slug" class="w-full" />
          </UFormField>

          <UFormField v-else :label="$t('import.mergeInto')" name="merge-slug">
            <USelect v-model="mergeSlug" :items="existingReports" class="w-full" />
          </UFormField>
        </template>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="$t('import.cancel')"
          variant="ghost"
          color="neutral"
          @click="open = false"
        />
        <UButton
          :label="$t('import.import')"
          icon="i-lucide-upload"
          :loading="busy"
          :disabled="!preview || !slugValid"
          @click="runImport"
        />
      </div>
    </template>
  </USlideover>
</template>
