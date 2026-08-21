<script setup lang="ts">
import type { IssuesCollectionItem, ReportsCollectionItem } from '@nuxt/content'

const props = defineProps<{
  report: ReportsCollectionItem
  issues: IssuesCollectionItem[]
}>()

const { t } = useI18n()
const conformanceResult = useConformanceResult(
  () => props.report,
  () => props.issues
)
</script>

<template>
  <div class="cover-page hidden print:flex print:flex-col print:justify-center print:min-h-full">
    <h1 class="text-4xl font-bold tracking-tight text-black sm:text-5xl">
      {{ t('report.accessibilityConformanceReportFor', { title: report.title }) }}
    </h1>
    <dl class="mt-12 grid grid-cols-1 gap-y-6 text-base">
      <div>
        <dt class="text-gray-600">
          {{ t('report.commissionedBy') }}
        </dt>
        <dd class="mt-0.5 text-lg font-medium text-black">
          {{ report.evaluation.commissioner }}
        </dd>
      </div>
      <div>
        <dt class="text-gray-600">
          {{ t('report.evaluatedBy') }}
        </dt>
        <dd class="mt-0.5 text-lg font-medium text-black">
          {{ report.evaluation.evaluator }}
        </dd>
      </div>
      <div>
        <dt class="text-gray-600">
          {{ t('report.date') }}
        </dt>
        <dd class="mt-0.5 text-lg font-medium text-black">
          {{ report.evaluation.date }}
        </dd>
      </div>
      <div>
        <dt class="text-gray-600">
          {{ t('report.conformanceResult') }}
        </dt>
        <dd class="mt-0.5 text-lg font-medium text-black">
          {{ conformanceResult }}
        </dd>
      </div>
    </dl>
  </div>
</template>
