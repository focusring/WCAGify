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

const metaRows = computed(() => [
  { label: t('report.commissionedBy'), value: props.report.evaluation.commissioner },
  { label: t('report.evaluatedBy'), value: props.report.evaluation.evaluator },
  { label: t('report.date'), value: props.report.evaluation.date },
  { label: t('report.wcagVersion'), value: `WCAG ${props.report.evaluation.targetWcagVersion}` },
  { label: t('report.conformanceTarget'), value: props.report.evaluation.targetLevel },
  { label: t('report.conformanceResult'), value: conformanceResult.value }
])
</script>

<template>
  <header class="py-12">
    <h1 class="text-4xl font-bold tracking-tight text-highlighted sm:text-5xl">
      {{ t('report.accessibilityConformanceReportFor', { title: report.title }) }}
    </h1>
    <dl class="mt-6 grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
      <div v-for="row in metaRows" :key="row.label">
        <dt class="text-toned">
          {{ row.label }}
        </dt>
        <dd class="mt-0.5 text-highlighted">
          {{ row.value }}
        </dd>
      </div>
    </dl>
  </header>
</template>
