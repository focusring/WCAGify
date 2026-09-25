<script setup lang="ts">
const route = useRoute()
const { locale, locales } = useI18n()

const reportSlug = computed(() => (route.params.slug as string[]).join('/'))
const reportPath = computed(() => `/reports/${reportSlug.value}`)

const { data: report } = await useAsyncData(`report-${reportPath.value}`, () =>
  queryCollection('reports').path(reportPath.value).first()
)

if (!report.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Report not found',
    data: { messageKey: 'report.notFound' }
  })
}

// The report is the main content, so the document language is the report's, not the
// interface's. The i18n locale's `language` gives the full tag (nl → nl-NL).
const reportLanguage = computed(() => {
  const code = report.value?.language ?? 'en'
  return locales.value.find((entry) => entry.code === code)?.language ?? code
})

useHead({ htmlAttrs: { lang: reportLanguage } })

useSeoMeta({
  title: () => (report.value ? `${report.value.title} - WCAGify` : 'WCAGify'),
  description: () => report.value?.description
})

const { data: issues } = await useAsyncData(`issues-${reportPath.value}`, () =>
  queryCollection('issues').where('path', 'LIKE', `${reportPath.value}/%`).all()
)

const { status: downloadStatus, download, buttonProps: downloadButtonProps } = useReportDownload()
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

// Below `lg` the sticky aside is hidden; the same navigation is offered in a disclosure.
const navigationOpen = ref(false)

const reportContentRef = ref<{ visiblePrinciples: Set<string> }>()
const visiblePrinciples = computed(
  () => reportContentRef.value?.visiblePrinciples ?? new Set<string>()
)
</script>

<template>
  <div class="mx-6 flex gap-20 mb-8">
    <div v-if="report" class="mx-auto w-full min-w-0 max-w-prose lg:max-w-none">
      <ReportContent ref="reportContentRef" :report="report" :issues="issues ?? []">
        <template #actions>
          <!-- Interface controls inside the report, which carries the report's language. -->
          <div class="w-full min-w-0" :lang="locale">
            <div class="flex flex-wrap justify-end gap-2">
              <UButton
                :label="$t('share.share')"
                icon="i-lucide-share-2"
                variant="outline"
                @click="openShare"
              />
              <UButton
                :label="$t('report.downloadEarl')"
                variant="outline"
                v-bind="downloadButtonProps('earl', 'i-lucide-file-json')"
                @click="downloadEarl"
              />
              <UButton
                :label="$t('report.downloadPdf')"
                v-bind="downloadButtonProps('pdf', 'i-lucide-download')"
                @click="downloadPdf"
              />
            </div>
            <p role="status" class="sr-only">{{ downloadStatus }}</p>
            <UCollapsible v-model:open="navigationOpen" class="mt-4 lg:hidden">
              <UButton
                :label="$t('report.navigationTitle')"
                icon="i-lucide-list"
                :trailing-icon="navigationOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                color="neutral"
                variant="outline"
                block
                :ui="{ base: 'justify-between' }"
              />
              <template #content>
                <ReportAside
                  :visible-principles="visiblePrinciples"
                  :heading="false"
                  class="mt-2"
                />
              </template>
            </UCollapsible>
          </div>
        </template>
      </ReportContent>
      <ReportShareSlideover v-if="shareOpen" v-model:open="shareOpen" :report-slug="reportSlug" />
    </div>

    <ReportAside
      :visible-principles="visiblePrinciples"
      :lang="locale"
      class="mt-12 hidden lg:block h-fit min-w-60.5 sticky top-20 print:hidden"
    />
  </div>
</template>
