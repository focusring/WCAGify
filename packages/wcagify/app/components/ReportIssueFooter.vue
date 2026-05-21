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

const severityClasses: Record<string, string> = {
  low: 'bg-success-500 ring-success-500',
  medium: 'bg-warning-500 ring-warning-500',
  high: 'bg-error-500 ring-error-500'
}
function getSeverityClass(severity: string): string {
  return severityClasses[severity.toLowerCase()] ?? 'bg-neutral-500 ring-neutral-500'
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
          :class="[
            'shrink-0 ring-1 text-black ring-black! dark:ring-current',
            getSeverityClass(issue.severity)
          ]"
        />
      </div>
      <div v-if="issueType" class="flex gap-1 w-full">
        <dt>{{ t('report.type') }}:</dt>
        <UBadge
          :label="t(`report.typesort.${issueType.toLowerCase()}`)"
          class="shrink-0 ring-1 text-black bg-primary-400 ring-black dark:ring-primary-400"
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
          :ui="{ base: 'btn-link', trailingIcon: 'size-4' }"
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
          :ui="{ base: 'btn-link', trailingIcon: 'size-4' }"
        />
      </div>
    </div>
  </dl>
</template>
