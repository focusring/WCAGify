<script setup lang="ts">
import type { ScGroup } from '@focusring/wcagify'
import type { IssuesCollectionItem, ReportsCollectionItem } from '@nuxt/content'

const props = defineProps<{
  issue: IssuesCollectionItem
  report: ReportsCollectionItem
  criterion: ScGroup<IssuesCollectionItem>
}>()

const { t } = useI18n()
const { resolveSamplePage } = useWcagData()

const samplePage = computed(() => resolveSamplePage(props.report.sample, props.issue.sample))

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

const issueType = computed(() => (props.issue as any).type as string | undefined)
</script>

<template>
  <dl
    class="flex flex-col gap-2 md:gap-1 px-6 py-4 text-sm font-medium bg-default text-gray-950 dark:text-white"
  >
    <div v-if="issue.severity || issueType" class="flex flex-row gap-4">
      <div v-if="issue.severity" class="flex gap-1 w-full">
        <dt>{{ t('report.severity') }}:</dt>
        <UBadge
          :label="t(`report.severityLevel.${issue.severity.toLowerCase()}`)"
          :color="getSeverityColor(issue.severity)"
          variant="subtle"
        />
      </div>
      <div v-if="issueType" class="flex gap-1 w-full">
        <dt>{{ t('report.type') }}:</dt>
        <UBadge
          :label="t(`report.typesort.${issueType.toLowerCase()}`)"
          variant="subtle"
          color="primary"
        />
      </div>
    </div>
    <div class="flex flex-row gap-4">
      <div v-if="criterion" class="flex gap-1 items-center w-full">
        <dt>{{ t('report.successCriteria') }}:</dt>
        <UButton
          :to="criterion.uri"
          :label="criterion.name"
          target="_blank"
          variant="link"
          trailing-icon="i-lucide-external-link"
          class="p-0 underline"
        />
      </div>
      <div v-if="samplePage" class="flex gap-1 items-center w-full">
        <dt>{{ t('report.sample') }}:</dt>
        <UButton
          :to="samplePage.url"
          :label="samplePage.title"
          target="_blank"
          variant="link"
          trailing-icon="i-lucide-external-link"
          class="p-0 underline"
        />
      </div>
    </div>
  </dl>
</template>
