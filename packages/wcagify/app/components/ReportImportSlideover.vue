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
  slug.value = ''
  mode.value = 'create'
  mergeSlug.value = existingReports.value[0]?.value ?? ''
  error.value = ''
}

watch(open, (isOpen) => {
  if (isOpen) reset()
})

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  error.value = ''
  preview.value = undefined
  fileName.value = file.name
  document.value = await file.text()
  await loadPreview()
}

async function loadPreview() {
  busy.value = true
  try {
    const summary = await $fetch<ImportSummary>('/api/earl/import', {
      method: 'POST',
      body: { earl: document.value, dryRun: true }
    })
    preview.value = summary
    slug.value = summary.slug || toSlug(summary.title)
  } catch (fetchError: unknown) {
    error.value =
      (fetchError as { statusMessage?: string; data?: { statusMessage?: string } }).data
        ?.statusMessage ??
      (fetchError as { statusMessage?: string }).statusMessage ??
      t('import.error')
  } finally {
    busy.value = false
  }
}

async function runImport() {
  if (!preview.value || !slugValid.value) return
  busy.value = true
  error.value = ''
  try {
    const result = await $fetch<ImportSummary>('/api/earl/import', {
      method: 'POST',
      body: { earl: document.value, slug: targetSlug.value, mode: mode.value }
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
        <UFormField :label="$t('import.file')" :help="$t('import.fileHelp')" name="earl-file">
          <input
            id="earl-file"
            type="file"
            accept=".json,.jsonld,application/json,application/ld+json"
            class="block w-full text-sm text-default file:mr-3 file:rounded-md file:border-0 file:bg-elevated file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-highlighted hover:file:bg-accented"
            :disabled="busy"
            @change="onFileChange"
          />
        </UFormField>

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
            <dd class="text-highlighted">{{ preview.issues }}</dd>
            <dt class="text-toned">{{ $t('report.scStatus.passed') }}</dt>
            <dd class="text-highlighted">{{ preview.passed }}</dd>
            <dt class="text-toned">{{ $t('report.scStatus.not-present') }}</dt>
            <dd class="text-highlighted">{{ preview.notPresent }}</dd>
          </dl>

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
