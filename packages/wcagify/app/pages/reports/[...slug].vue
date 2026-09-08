<script setup lang="ts">
const route = useRoute()

const reportSlug = computed(() => (route.params.slug as string[]).join('/'))
const reportPath = computed(() => `/reports/${reportSlug.value}`)

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

const { downloading, download } = useReportDownload()
const reportTitle = computed(() => report.value?.title ?? 'report')

function downloadPdf() {
  return download(`/api${reportPath.value}.pdf`, `${reportTitle.value}.pdf`, 'pdf')
}

function downloadEarl() {
  return download(`/api/earl/${reportSlug.value}`, `${reportTitle.value}-earl.jsonld`, 'earl')
}

const shareOpen = ref(false)

function openShare() {
  shareOpen.value = true
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
            @click="openShare"
          />
          <UButton
            :label="$t('report.downloadEarl')"
            icon="i-lucide-file-json"
            variant="outline"
            :loading="downloading === 'earl'"
            :disabled="!!downloading && downloading !== 'earl'"
            @click="downloadEarl"
          />
          <UButton
            :label="$t('report.downloadPdf')"
            icon="i-lucide-download"
            :loading="downloading === 'pdf'"
            :disabled="!!downloading && downloading !== 'pdf'"
            @click="downloadPdf"
          />
        </template>
      </ReportContent>
      <ReportShareSlideover v-if="shareOpen" v-model:open="shareOpen" :report-slug="reportSlug" />
    </div>

    <ReportAside
      :visible-principles="visiblePrinciples"
      class="mt-12 hidden lg:block h-fit min-w-60.5 sticky top-20 print:hidden"
    />
  </div>
</template>
