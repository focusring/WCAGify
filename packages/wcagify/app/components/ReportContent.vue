<script setup lang="ts">
import type { IssuesCollectionItem, ReportsCollectionItem } from '@nuxt/content'
import type { Level, WcagVersion, Language } from '@focusring/wcagify'

const props = defineProps<{
  report: ReportsCollectionItem
  issues: IssuesCollectionItem[]
}>()

const { t } = useI18n()
const { groupIssuesByPrinciple, filterTips } = useWcagData()

const issuesByPrinciple = computed(() => {
  const wcagVersion = (props.report.evaluation.targetWcagVersion ?? '2.2') as WcagVersion
  const language = (props.report.language === 'nl' ? 'nl' : 'en') as Language
  const targetLevel = (props.report.evaluation.targetLevel ?? 'AA') as Level
  const scStatuses = (props.report as any).scStatuses as Record<string, string> | undefined
  return groupIssuesByPrinciple(props.issues, targetLevel, {
    wcagVersion,
    language,
    scStatuses: scStatuses ?? {}
  })
})

const reportTips = computed(() => filterTips(props.issues))

const statusCounts = computed(() => {
  const counts = { passed: 0, failed: 0, 'not-present': 0, 'not-tested': 0 }
  for (const group of issuesByPrinciple.value) {
    for (const guideline of group.guidelines) {
      for (const sc of guideline.criteria) {
        counts[sc.status as keyof typeof counts]++
      }
    }
  }
  return counts
})
</script>

<template>
  <div class="mx-auto max-w-prose">
    <ReportCoverPage :report="report" :issues="issues" />
    <ReportHeader :report="report" :issues="issues" />

    <div class="mt-4 flex justify-end gap-2 print:hidden">
      <slot name="actions" />
    </div>

    <section id="executive-summary" class="mt-12 scroll-mt-20">
      <h2 class="text-2xl font-semibold text-gray-950 dark:text-white">
        {{ t('report.executiveSummary') }}
      </h2>
      <div class="mt-4 prose dark:prose-invert">
        <ContentRenderer :value="report" />
      </div>
    </section>

    <hr class="my-12 border-gray-200 dark:border-gray-800" />

    <section id="scorecard" class="scroll-mt-20">
      <h2 class="text-2xl font-semibold text-gray-950 dark:text-white">
        {{ t('report.resultsPerPrinciple') }}
      </h2>
      <div class="mt-4">
        <ReportScorecard
          :issues="issues"
          :target-level="report.evaluation.targetLevel"
          :wcag-version="report.evaluation.targetWcagVersion"
        />
      </div>
    </section>

    <hr class="my-12 border-gray-200 dark:border-gray-800" />

    <section id="about" class="scroll-mt-20">
      <h2 class="text-2xl font-semibold text-gray-950 dark:text-white">
        {{ t('report.aboutThisReport') }}
      </h2>
      <div class="mt-4 prose dark:prose-invert">
        <p v-for="(paragraph, i) in t('report.aboutThisReportText').split('\n\n')" :key="i">
          {{ paragraph }}
        </p>
      </div>
    </section>

    <hr class="my-12 border-gray-200 dark:border-gray-800" />

    <section id="scope" class="scroll-mt-20">
      <h2 class="text-2xl font-semibold text-gray-950 dark:text-white">
        {{ t('report.scope') }}
      </h2>
      <div class="mt-4">
        <ReportScope :report="report" />
      </div>
    </section>

    <hr class="my-12 border-gray-200 dark:border-gray-800" />

    <section id="sample" class="scroll-mt-20">
      <h2 class="text-2xl font-semibold text-gray-950 dark:text-white">
        {{ t('report.representativeSample') }}
      </h2>
      <div class="mt-4">
        <ReportSample :report="report" />
      </div>
    </section>

    <template v-if="issuesByPrinciple.length">
      <hr class="my-12 border-gray-200 dark:border-gray-800" />

      <section id="issues">
        <h2 class="text-2xl font-semibold text-gray-950 dark:text-white">
          {{ t('report.results') }}
        </h2>

        <div class="md:flex grid grid-cols-2 grid-rows-2 gap-4 mt-4 max-w-lg md:max-w-none">
          <ResultsIndicator status="passed" :count="statusCounts.passed" />
          <ResultsIndicator status="failed" :count="statusCounts.failed" />
          <ResultsIndicator status="not-present" :count="statusCounts['not-present']" />
          <ResultsIndicator status="not-tested" :count="statusCounts['not-tested']" />
        </div>

        <ReportPrinciple
          v-for="group in issuesByPrinciple"
          :key="group.principle"
          :group="group"
          :report="report"
        />
      </section>
    </template>

    <template v-if="reportTips.length">
      <hr class="my-12 border-gray-200 dark:border-gray-800" />

      <section id="tips">
        <h2 class="text-2xl font-semibold text-gray-950 dark:text-white">
          {{ t('report.tips') }}
        </h2>
        <ol class="mt-6 list-decimal list-outside space-y-8 pl-6">
          <li v-for="tip in reportTips" :key="tip.path">
            <h3 class="font-medium text-gray-950 dark:text-white">
              {{ tip.title }}
            </h3>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {{ t('report.difficulty') }}:
              {{ t(`report.difficultyLevel.${tip.difficulty.toLowerCase()}`) }}
            </p>
            <div class="mt-3 prose dark:prose-invert">
              <ContentRenderer :value="tip" />
            </div>
          </li>
        </ol>
      </section>
    </template>
  </div>
</template>
