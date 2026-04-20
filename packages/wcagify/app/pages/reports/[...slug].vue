<script setup lang="ts">
const route = useRoute()

const reportPath = computed(() => `/reports/${(route.params.slug as string[]).join('/')}`)

const { data: report } = await useAsyncData(`report-${reportPath.value}`, () =>
  queryCollection('reports').path(reportPath.value).first()
)

if (!report.value) {
  throw createError({ statusCode: 404, statusMessage: 'Report not found' })
}

useSeoMeta({
  title: () => (report.value ? `${report.value.title} - WCAGify` : 'WCAGify'),
  description: () => report.value?.description
})

const { data: issues } = await useAsyncData(`issues-${reportPath.value}`, () =>
  queryCollection('issues').where('path', 'LIKE', `${reportPath.value}/%`).all()
)

const isGeneratingPdf = ref(false)

async function downloadPdf() {
  isGeneratingPdf.value = true
  try {
    const response = await $fetch<Blob>(`/api${reportPath.value}.pdf`, {
      responseType: 'blob'
    })
    const url = URL.createObjectURL(response)
    const link = document.createElement('a')
    link.href = url
    link.download = `${report.value?.title ?? 'report'}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } finally {
    isGeneratingPdf.value = false
  }
}

function downloadEarl() {
  const link = document.createElement('a')
  link.href = `/api/exports${reportPath.value}`
  link.download = `${report.value?.title ?? 'report'}-evaluation.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const shareOpen = ref(false)

const importIssuesInput = useTemplateRef<HTMLInputElement>('importIssuesInput')
const importingIssues = ref(false)
const toast = useToast()
const { t } = useI18n()

interface ImportResponse {
  success: boolean
  mode: 'create' | 'merge'
  issueCount: number
  warnings: { code: string; message: string }[]
}

async function onImportIssuesFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const slug = (route.params.slug as string[]).join('/')
  importingIssues.value = true
  try {
    const text = await file.text()
    const response = await $fetch<ImportResponse>(
      `/api/reports/import?target=${encodeURIComponent(slug)}`,
      {
        method: 'POST',
        body: text,
        headers: { 'Content-Type': 'application/json' }
      }
    )
    toast.add({
      title: t('app.importSuccess'),
      description:
        response.warnings.length > 0
          ? t('app.importWithWarnings', {
              count: response.warnings.length,
              issues: response.issueCount
            })
          : t('app.importSuccessDetail', { issues: response.issueCount }),
      color: response.warnings.length > 0 ? 'warning' : 'success'
    })
    await reloadNuxtApp({ path: reportPath.value })
  } catch (error: unknown) {
    const message =
      (error as { data?: { statusMessage?: string }; statusMessage?: string }).data
        ?.statusMessage ??
      (error as { statusMessage?: string }).statusMessage ??
      (error as Error).message
    toast.add({ title: t('app.importFailed'), description: message, color: 'error' })
  } finally {
    importingIssues.value = false
    input.value = ''
  }
}

function triggerIssuesImport() {
  importIssuesInput.value?.click()
}

const reportContentRef = ref<{ visiblePrinciples: Set<string> }>()
const visiblePrinciples = computed(
  () => reportContentRef.value?.visiblePrinciples ?? new Set<string>()
)
</script>

<template>
  <div class="mx-6 flex gap-20 mb-8">
    <div v-if="report" class="mx-auto w-full max-w-prose lg:max-w-none">
      <ReportContent ref="reportContentRef" :report="report" :issues="issues ?? []">
        <template #actions>
          <UButton
            :label="$t('share.share')"
            icon="i-lucide-share-2"
            variant="outline"
            @click="shareOpen = true"
          />
          <UButton
            :label="$t('report.importIssues')"
            icon="i-lucide-upload"
            variant="outline"
            :loading="importingIssues"
            :disabled="importingIssues"
            @click="triggerIssuesImport"
          />
          <input
            ref="importIssuesInput"
            type="file"
            accept=".json,.jsonld,application/json,application/ld+json"
            class="sr-only"
            @change="onImportIssuesFileChange"
          />
          <UButton
            :label="$t('report.exportEarl')"
            icon="i-lucide-file-json"
            variant="outline"
            @click="downloadEarl"
          />
          <UButton
            :label="$t('report.downloadPdf')"
            icon="i-lucide-download"
            :loading="isGeneratingPdf"
            @click="downloadPdf"
          />
        </template>
      </ReportContent>
      <ReportShareSlideover
        v-if="shareOpen"
        v-model:open="shareOpen"
        :report-slug="(route.params.slug as string[]).join('/')"
      />
    </div>

    <ReportAside
      :visible-principles="visiblePrinciples"
      class="mt-12 hidden lg:block h-fit min-w-60.5 sticky top-20 print:hidden"
    />
  </div>
</template>
