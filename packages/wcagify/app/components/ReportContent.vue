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

type Status = 'passed' | 'failed' | 'not-present' | 'not-tested'
const allStatuses: Status[] = ['passed', 'failed', 'not-present', 'not-tested']

const statusCounts = computed(() => {
  const counts: Record<Status, number> = { passed: 0, failed: 0, 'not-present': 0, 'not-tested': 0 }
  for (const group of issuesByPrinciple.value) {
    for (const guideline of group.guidelines) {
      for (const sc of guideline.criteria) {
        counts[sc.status as Status]++
      }
    }
  }
  return counts
})

const activeFilters = ref<Set<Status>>(new Set(allStatuses))

function toggleFilter(status: Status) {
  const isOnlyThis = activeFilters.value.size === 1 && activeFilters.value.has(status)
  activeFilters.value = isOnlyThis ? new Set(allStatuses) : new Set([status])
}

const isFiltering = computed(() => activeFilters.value.size < allStatuses.length)

const emptyFilterStatus = computed<Status | null>(() => {
  if (!isFiltering.value) return null
  const [status] = [...activeFilters.value] as Status[]
  if (status === undefined) return null
  return statusCounts.value[status] === 0 ? status : null
})

provide('statusFilters', activeFilters)

const visiblePrinciples = computed(() => {
  const visible = new Set<string>()
  for (const group of issuesByPrinciple.value) {
    const hasVisible = group.guidelines.some((g) =>
      g.criteria.some((sc) => activeFilters.value.has(sc.status as Status))
    )
    if (hasVisible) {
      visible.add(group.principle)
    }
  }
  return visible
})

defineExpose({ visiblePrinciples })
</script>

<template>
  <div>
    <ReportCoverPage :report="report" :issues="issues" />
    <ReportHeader :report="report" :issues="issues" />

    <div class="mt-4 flex justify-end gap-2 print:hidden">
      <slot name="actions" />
    </div>

    <section id="executive-summary" class="mt-12 scroll-mt-20">
      <h2 class="flex items-center gap-2 text-2xl font-semibold text-gray-950 dark:text-white">
        <UIcon name="i-lucide-file-text" class="size-6 shrink-0" />
        {{ t('report.executiveSummary') }}
      </h2>
      <div class="mt-4 prose dark:prose-invert">
        <ContentRenderer :value="report" />
      </div>
    </section>

    <hr class="my-12 border-gray-200 dark:border-gray-800" />

    <section id="scorecard" class="scroll-mt-20">
      <h2 class="flex items-center gap-2 text-2xl font-semibold text-gray-950 dark:text-white">
        <UIcon name="i-lucide-list-checks" class="size-6 shrink-0" />
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
      <h2 class="flex items-center gap-2 text-2xl font-semibold text-gray-950 dark:text-white">
        <UIcon name="i-lucide-info" class="size-6 shrink-0" />
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
      <h2 class="flex items-center gap-2 text-2xl font-semibold text-gray-950 dark:text-white">
        <UIcon name="i-lucide-target" class="size-6 shrink-0" />
        {{ t('report.scope') }}
      </h2>
      <div class="mt-4">
        <ReportScope :report="report" />
      </div>
    </section>

    <hr class="my-12 border-gray-200 dark:border-gray-800" />

    <section id="sample" class="scroll-mt-20">
      <h2 class="flex items-center gap-2 text-2xl font-semibold text-gray-950 dark:text-white">
        <UIcon name="i-lucide-layers" class="size-6 shrink-0" />
        {{ t('report.representativeSample') }}
      </h2>
      <div class="mt-4">
        <ReportSample :report="report" />
      </div>
    </section>

    <template v-if="issuesByPrinciple.length">
      <hr class="my-12 border-gray-200 dark:border-gray-800" />

      <section id="issues" class="min-h-screen scroll-mt-20">
        <h2 class="flex items-center gap-2 text-2xl font-semibold text-gray-950 dark:text-white">
          <UIcon name="i-lucide-bar-chart-2" class="size-6 shrink-0" />
          {{ t('report.results') }}
        </h2>

        <div class="md:flex grid grid-cols-2 grid-rows-2 gap-4 mt-4 max-w-lg md:max-w-none">
          <ResultsIndicator
            status="passed"
            :count="statusCounts.passed"
            :active="activeFilters.has('passed')"
            :filtering="isFiltering"
            @toggle="toggleFilter('passed')"
          />
          <ResultsIndicator
            status="failed"
            :count="statusCounts.failed"
            :active="activeFilters.has('failed')"
            :filtering="isFiltering"
            @toggle="toggleFilter('failed')"
          />
          <ResultsIndicator
            status="not-present"
            :count="statusCounts['not-present']"
            :active="activeFilters.has('not-present')"
            :filtering="isFiltering"
            @toggle="toggleFilter('not-present')"
          />
          <ResultsIndicator
            status="not-tested"
            :count="statusCounts['not-tested']"
            :active="activeFilters.has('not-tested')"
            :filtering="isFiltering"
            @toggle="toggleFilter('not-tested')"
          />
        </div>

        <div
          v-if="emptyFilterStatus"
          class="mt-8 flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 dark:border-muted py-16 text-center bg-muted"
        >
          <h3 class="text-lg font-semibold text-gray-950 dark:text-white">
            {{ t(`report.emptyFilter.${emptyFilterStatus}.title`) }}
          </h3>
          <p class="max-w-sm text-sm text-gray-600 dark:text-gray-400">
            {{ t(`report.emptyFilter.${emptyFilterStatus}.description`) }}
          </p>
        </div>

        <template v-else>
          <ReportPrinciple
            v-for="group in issuesByPrinciple"
            :key="group.principle"
            :group="group"
            :report="report"
          />
        </template>
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
              {{ $t('report.difficulty') }}:
              {{
                tip.difficulty ? $t(`report.difficultyLevel.${tip.difficulty.toLowerCase()}`) : ''
              }}
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
