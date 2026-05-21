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

type BadgeColor = 'success' | 'warning' | 'error' | 'neutral'

const severityColorMap: Record<string, BadgeColor> = {
  low: 'success',
  medium: 'warning',
  high: 'error'
}
function getSeverityColor(severity: string): BadgeColor {
  return severityColorMap[severity.toLowerCase()] ?? 'neutral'
}

const issueType = computed(() => (props.issue as any).type as string | undefined)
</script>

<template>
  <dl class="flex flex-col gap-2 px-6 py-4 text-sm font-medium bg-default text-highlighted">
    <div v-if="issue.severity || issueType" class="flex flex-row gap-4">
      <div v-if="issue.severity" class="flex gap-1 w-full">
        <dt>{{ t('report.severity') }}:</dt>
        <UBadge
          :label="t(`report.severityLevel.${issue.severity.toLowerCase()}`)"
          :color="getSeverityColor(issue.severity)"
          class="shrink-0"
        />
      </div>
      <div v-if="issueType" class="flex gap-1 w-full">
        <dt>{{ t('report.type') }}:</dt>
        <UBadge
          :label="t(`report.typesort.${issueType.toLowerCase()}`)"
          variant="subtle"
          class="shrink-0"
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
          :ui="{ trailingIcon: 'size-4' }"
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
          :ui="{ trailingIcon: 'size-4' }"
        />
      </div>
    </div>
  </dl>
</template>
