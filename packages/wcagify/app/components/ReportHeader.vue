<script setup lang="ts">
import type { IssuesCollectionItem, ReportsCollectionItem } from '@nuxt/content'

const props = defineProps<{
  report: ReportsCollectionItem
  issues: IssuesCollectionItem[]
}>()

const { t } = useI18n()
const { conformanceSummary } = useWcagData()

const conformanceResult = computed(() => {
  const data = conformanceSummary(
    props.issues,
    props.report.evaluation.targetLevel as 'A' | 'AA' | 'AAA',
    props.report.evaluation.targetWcagVersion as '2.0' | '2.1' | '2.2'
  )
  return t('report.criteriaMet', { conforming: data.conforming.all, total: data.totals.all })
})
</script>

<template>
  <header class="py-12">
    <h1 class="text-4xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-5xl">
      {{ t('report.accessibilityConformanceReportFor', { title: report.title }) }}
    </h1>
    <dl class="mt-6 grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
      <div>
        <dt class="text-gray-500 dark:text-gray-400">
          {{ t('report.commissionedBy') }}
        </dt>
        <dd class="mt-0.5 text-gray-950 dark:text-white">
          {{ report.evaluation.commissioner }}
        </dd>
      </div>
      <div>
        <dt class="text-gray-500 dark:text-gray-400">
          {{ t('report.evaluatedBy') }}
        </dt>
        <dd class="mt-0.5 text-gray-950 dark:text-white">
          {{ report.evaluation.evaluator }}
        </dd>
      </div>
      <div>
        <dt class="text-gray-500 dark:text-gray-400">
          {{ t('report.date') }}
        </dt>
        <dd class="mt-0.5 text-gray-950 dark:text-white">
          {{ report.evaluation.date }}
        </dd>
      </div>
      <div>
        <dt class="text-gray-500 dark:text-gray-400">
          {{ t('report.wcagVersion') }}
        </dt>
        <dd class="mt-0.5 text-gray-950 dark:text-white">
          WCAG {{ report.evaluation.targetWcagVersion }}
        </dd>
      </div>
      <div>
        <dt class="text-gray-500 dark:text-gray-400">
          {{ t('report.conformanceTarget') }}
        </dt>
        <dd class="mt-0.5 text-gray-950 dark:text-white">
          {{ report.evaluation.targetLevel }}
        </dd>
      </div>
      <div>
        <dt class="text-gray-500 dark:text-gray-400">
          {{ t('report.conformanceResult') }}
        </dt>
        <dd class="mt-0.5 text-gray-950 dark:text-white">
          {{ conformanceResult }}
        </dd>
      </div>
    </dl>
  </header>
</template>
