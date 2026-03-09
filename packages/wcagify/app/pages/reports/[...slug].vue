<script setup lang="ts">
const route = useRoute()
const { t } = useI18n()

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

const shareOpen = ref(false)
</script>

<template>
  <ReportContent v-if="report" :report="report" :issues="issues ?? []">
    <template #actions>
      <UButton
        :label="t('share.share')"
        icon="i-lucide-share-2"
        variant="outline"
        @click="shareOpen = true"
      />
      <UButton
        :label="t('report.downloadPdf')"
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
</template>
