<script setup lang="ts">
import type { IssuesCollectionItem, ReportsCollectionItem } from '@nuxt/content'

const props = defineProps<{
  report: ReportsCollectionItem
  issues: IssuesCollectionItem[]
}>()

const { t } = useI18n()
const { groupIssuesBySc, filterTips } = useWcagData()

const issuesBySc = computed(() => {
  const wcagVersion = (props.report.evaluation.targetWcagVersion ?? '2.2') as '2.0' | '2.1' | '2.2'
  const language = (props.report.language === 'nl' ? 'nl' : 'en') as 'en' | 'nl'
  return groupIssuesBySc(props.issues, wcagVersion, language)
})

const reportTips = computed(() => filterTips(props.issues))
</script>

<template>
  <div class="mx-auto max-w-prose">
    <ReportCoverPage :report="report" :issues="issues" />
    <ReportHeader :report="report" :issues="issues" />

    <div class="mt-4 flex justify-end gap-2 print:hidden">
      <slot name="actions" />
    </div>

    <section id="executive-summary" class="mt-12">
      <h2 class="text-2xl font-semibold text-gray-950 dark:text-white">
        {{ t('report.executiveSummary') }}
      </h2>
      <div class="mt-4 prose dark:prose-invert">
        <ContentRenderer :value="report" />
      </div>
    </section>

    <hr class="my-12 border-gray-200 dark:border-gray-800" />

    <section id="scorecard">
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

    <section id="about">
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

    <section id="scope">
      <h2 class="text-2xl font-semibold text-gray-950 dark:text-white">
        {{ t('report.scope') }}
      </h2>
      <div class="mt-4">
        <ReportScope :report="report" />
      </div>
    </section>

    <hr class="my-12 border-gray-200 dark:border-gray-800" />

    <section id="sample">
      <h2 class="text-2xl font-semibold text-gray-950 dark:text-white">
        {{ t('report.representativeSample') }}
      </h2>
      <div class="mt-4">
        <ReportSample :report="report" />
      </div>
    </section>

    <template v-if="issuesBySc.length">
      <hr class="my-12 border-gray-200 dark:border-gray-800" />

      <section id="issues">
        <h2 class="text-2xl font-semibold text-gray-950 dark:text-white">
          {{ t('report.issues') }}
        </h2>

        <nav class="mt-4">
          <div v-for="group in issuesBySc" :key="`toc-${group.sc}`" class="mt-3">
            <h3 class="text-sm font-medium text-gray-950 dark:text-white">
              {{ group.name }}
            </h3>
            <ol class="mt-1 list-decimal list-inside text-sm">
              <li v-for="issue in group.issues" :key="issue.path">
                <a
                  :href="`#issue-${issue.path.split('/').filter(Boolean).pop() || issue.path}`"
                  class="text-primary"
                >
                  {{ issue.title }}
                </a>
              </li>
            </ol>
          </div>
        </nav>

        <div v-for="group in issuesBySc" :key="group.sc" class="mt-8">
          <h3 class="text-lg font-medium text-gray-950 dark:text-white">
            <a :href="group.uri" target="_blank">{{ group.name }}</a>
          </h3>
          <div class="mt-4 space-y-8">
            <ReportIssue
              v-for="issue in group.issues"
              :key="issue.path"
              :issue="issue"
              :report="report"
              :sc-name="group.name"
            />
          </div>
        </div>
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
              {{ t('report.difficulty') }}: {{ t(`report.difficultyLevel.${tip.difficulty.toLowerCase()}`) }}
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
