<script setup lang="ts">
import type { ScGroup } from '@focusring/wcagify'
import type { IssuesCollectionItem, ReportsCollectionItem } from '@nuxt/content'

const props = defineProps<{
  issue: IssuesCollectionItem
  report: ReportsCollectionItem
  criterion: ScGroup<IssuesCollectionItem>
  scName: string
  index?: number
}>()

const { t } = useI18n()
const { resolveSamplePage } = useWcagData()

const samplePage = computed(() => resolveSamplePage(props.report.sample, props.issue.sample))

const open = ref(false)

const sanitizedPath = props.issue.path.split('/').filter(Boolean).join('-')
const issueId = `issue-${sanitizedPath}`
const panelId = `issue-panel-${sanitizedPath}`

const severityColor = {
  low: 'success',
  medium: 'warning',
  high: 'error'
} as const

type BadgeColor = 'error' | 'neutral' | 'success' | 'warning' | 'primary' | 'secondary' | 'info'

function getSeverityColor(severity: string): BadgeColor {
  return (severityColor[severity.toLowerCase() as keyof typeof severityColor] ??
    'neutral') as BadgeColor
}
</script>

<template>
  <article :id="issueId">
    <button
      class="p-4 flex w-full items-start gap-3 text-left border-t border-muted"
      :aria-expanded="open"
      :aria-controls="panelId"
      @click="open = !open"
    >
      <span class="font-medium text-gray-950 dark:text-white">
        <span v-if="index !== undefined && index !== null">{{ index }}. </span>{{ issue.title }}
      </span>

      <div class="ml-auto flex items-center gap-2 shrink-0">
        <UBadge v-if="samplePage" :label="samplePage.title" variant="outline" color="neutral" />
        <UBadge
          v-if="issue.severity"
          :label="t(`report.severityLevel.${issue.severity.toLowerCase()}`)"
          variant="subtle"
          :color="getSeverityColor(issue.severity)"
        />
        <UBadge
          :label="t('report.scStatus.failed')"
          variant="subtle"
          color="error"
          icon="i-lucide-x"
        />
        <UIcon
          name="i-lucide-chevron-down"
          class="size-5 text-gray-400 transition-transform"
          :class="{ 'rotate-180': open }"
        />
      </div>
    </button>

    <div :id="panelId" v-show="open" :aria-hidden="!open" class="mt-3">
      <div class="mt-3 pl-7 pr-4 prose dark:prose-invert">
        <ContentRenderer :value="issue" />
      </div>
      <ReportIssueFooter :issue="issue" :report="report" :criterion="criterion" />
    </div>
  </article>
</template>
