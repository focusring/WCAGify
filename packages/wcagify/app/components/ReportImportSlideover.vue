<script setup lang="ts">
import type { SelectProps } from '@nuxt/ui'
import type { SelectItem } from '@nuxt/ui'
import type { ReportsCollectionItem } from '@nuxt/content'
import { toSlug } from '@focusring/wcagify'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  reports: ReportsCollectionItem[]
}>()

const emit = defineEmits<{
  imported: [slug: string]
}>()

const { t, locale } = useI18n()
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
  /** Language of the imported evaluation, when the server reports it. */
  language?: string
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
const busy = ref(false)
const error = ref('')
/** Indices of previewed issues the user chose not to import. */
const skipped = ref(new Set<number>())

const issueList = computed(() => preview.value?.issueList ?? [])

/** Text taken from the imported file is in the evaluation's language, not the interface's. */
const previewLanguage = computed(() => preview.value?.language ?? locale.value)
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
const reportOptions = computed(() =>
  props.reports.map((report) => {
    const value = report.path?.replace('/reports/', '') ?? ''
    return { label: `${report.title} (${value})`, value }
  })
)

const mergeSlug = ref(reportOptions.value[0]?.value ?? '')

// The leading label item names the option group; Reka points the group's aria-labelledby at it.
const existingReports = computed<SelectItem[]>(() => [
  { type: 'label', label: t('import.mergeInto'), class: 'sr-only' },
  ...reportOptions.value
])

const modeItems = computed(() => [
  { label: t('import.modeCreate'), value: 'create' },
  { label: t('import.modeMerge'), value: 'merge' }
])

const targetSlug = computed(() => (mode.value === 'merge' ? mergeSlug.value : slug.value))
const slugValid = computed(() => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(targetSlug.value))

/** Why the slug blocks the import, or '' when it is fine. Shown in a live region below the field. */
const slugError = computed(() => {
  if (mode.value !== 'create' || !preview.value) return ''
  if (!slug.value) return t('import.slugRequired')
  return slugValid.value ? '' : t('import.slugInvalid')
})

const canImport = computed(() => Boolean(preview.value) && slugValid.value && !busy.value)

// Names the option list of the "Existing report" select after its visible label.
// Forwarded as attrs to Reka's listbox; the prop type does not list aria attributes.
const mergeListContent = {
  'aria-labelledby': 'import-merge-label'
} as unknown as SelectProps['content']

/**
 * Reka dismisses a dialog as soon as the pointer goes down outside it, which loses
 * everything entered on an accidental press. Cancel that and only remember the
 * press; the panel then closes on a completed click on the overlay (press and
 * release both beside the panel). Reka reports the press only while this panel is
 * the top layer, so a click that merely closes an open select inside it does not
 * close the panel. Escape and the close button work as before.
 */
let pressedOutside = false

function onPointerDownOutside(event: Event) {
  event.preventDefault()
  pressedOutside = true
}

function onDocumentClick(event: MouseEvent) {
  const onOverlay = (event.target as Element | null)?.matches('[data-slot="overlay"]') ?? false
  // On touch, Reka reports the press during this same click, after this listener ran.
  setTimeout(() => {
    if (pressedOutside && onOverlay && open.value) open.value = false
    pressedOutside = false
  }, 0)
}

// `document` is shadowed by the EARL text ref above.
onMounted(() => globalThis.document.addEventListener('click', onDocumentClick))
onBeforeUnmount(() => globalThis.document.removeEventListener('click', onDocumentClick))

function reset() {
  fileName.value = ''
  document.value = ''
  preview.value = undefined
  skipped.value = new Set()
  slug.value = ''
  mode.value = 'create'
  mergeSlug.value = reportOptions.value[0]?.value ?? ''
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
  // The button stays focusable while unavailable or busy (aria-disabled), so guard here.
  if (!canImport.value || !preview.value) return
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
    :content="{ onPointerDownOutside }"
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
              :aria-busy="busy || undefined"
              @change="onFileChange"
            />
          </div>
          <p id="earl-file-help" class="mt-1 text-sm text-muted">
            {{ $t('import.fileHelp') }}
          </p>
          <!-- Always in the DOM so the live region exists before a message is written into it. -->
          <p role="alert" class="text-sm text-error" :class="{ 'mt-2': error }">
            {{ error }}
          </p>
        </div>

        <template v-if="preview">
          <dl class="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-default p-4 text-sm">
            <dt class="text-toned">{{ $t('report.title') }}</dt>
            <dd class="text-highlighted" :lang="previewLanguage">{{ preview.title }}</dd>
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
                :aria-disabled="skipped.size === 0 || undefined"
                @click="selectAll(true)"
              />
              <UButton
                :label="$t('import.selectNone')"
                size="xs"
                variant="ghost"
                color="neutral"
                :aria-disabled="selectedCount === 0 || undefined"
                @click="selectAll(false)"
              />
            </div>
            <ul class="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1" :lang="previewLanguage">
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

          <URadioGroup v-model="mode" :items="modeItems" :legend="$t('import.mode')" />

          <div v-if="mode === 'create'" class="text-sm">
            <label for="import-slug" class="block font-medium text-default">
              {{ $t('import.slug') }}
              <span class="font-normal text-muted">({{ $t('import.required') }})</span>
            </label>
            <UInput
              id="import-slug"
              v-model="slug"
              class="mt-1 w-full"
              required
              aria-required="true"
              :aria-invalid="slugError ? 'true' : undefined"
              :aria-describedby="
                slugError ? 'import-slug-error' : 'import-slug-error import-slug-help'
              "
            />
            <!-- Always in the DOM so the live region exists before a message is written into it. -->
            <p
              id="import-slug-error"
              role="alert"
              class="text-error"
              :class="{ 'mt-2': slugError }"
            >
              {{ slugError }}
            </p>
            <p v-if="!slugError" id="import-slug-help" class="mt-2 text-muted">
              {{ $t('import.slugHelp') }}
            </p>
          </div>

          <div v-else class="text-sm">
            <label
              id="import-merge-label"
              for="import-merge"
              class="block font-medium text-default"
            >
              {{ $t('import.mergeInto') }}
            </label>
            <USelect
              id="import-merge"
              v-model="mergeSlug"
              :items="existingReports"
              :content="mergeListContent"
              class="mt-1 w-full"
            />
          </div>
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
        <!-- Not `disabled`/`loading`: a disabled button drops focus out of the dialog. -->
        <UButton
          :label="$t('import.import')"
          :icon="busy ? 'i-lucide-loader-circle' : 'i-lucide-upload'"
          :ui="{ leadingIcon: busy ? 'animate-spin' : '' }"
          :aria-disabled="!canImport || undefined"
          :aria-busy="busy || undefined"
          @click="runImport"
        />
      </div>
    </template>
  </USlideover>
</template>
