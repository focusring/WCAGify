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
  <!--
    Each term/value pair sits in exactly one div (valid dl grouping, and what
    the PDF processor's flattenDefinitionLists expects). Items stack below
    `sm` and wrap so they are never clipped at narrow widths or with user
    text spacing.
  -->
  <dl
    class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 px-6 py-4 text-sm font-medium bg-default text-highlighted"
  >
    <div v-if="issue.severity" class="flex flex-wrap gap-1 items-center min-w-0">
      <dt>{{ t('report.severity') }}:</dt>
      <dd class="inline">
        <UBadge
          :label="t(`report.severityLevel.${issue.severity.toLowerCase()}`)"
          :color="getSeverityColor(issue.severity)"
          variant="subtle"
        />
      </dd>
    </div>
    <div v-if="issueType" class="flex flex-wrap gap-1 items-center min-w-0">
      <dt>{{ t('report.type') }}:</dt>
      <dd class="inline">
        <UBadge :label="t(`report.typesort.${issueType.toLowerCase()}`)" variant="subtle" />
      </dd>
    </div>
    <div v-if="criterion" class="flex flex-wrap gap-1 items-center min-w-0">
      <dt>{{ t('report.successCriteria') }}:</dt>
      <dd class="inline min-w-0">
        <UButton
          :to="criterion.uri"
          :label="criterion.name"
          target="_blank"
          variant="link"
          trailing-icon="i-lucide-external-link"
          class="hover:text-primary-800 dark:hover:text-primary-400"
          :ui="{ trailingIcon: 'size-4', label: 'whitespace-normal text-left' }"
        />
      </dd>
    </div>
    <div v-if="samplePage" class="flex flex-wrap gap-1 items-center min-w-0">
      <dt>{{ t('report.sample') }}:</dt>
      <dd class="inline min-w-0">
        <UButton
          :to="samplePage.url"
          :label="samplePage.title"
          target="_blank"
          variant="link"
          trailing-icon="i-lucide-external-link"
          class="hover:text-primary-800 dark:hover:text-primary-400"
          :ui="{ trailingIcon: 'size-4', label: 'whitespace-normal text-left' }"
        />
      </dd>
    </div>
  </dl>
</template>
