<script setup lang="ts">
import type { ScGroup, ScStatus } from '@focusring/wcagify'
import type { IssuesCollectionItem, ReportsCollectionItem } from '@nuxt/content'

const props = defineProps<{
  criterion: ScGroup<IssuesCollectionItem>
  report: ReportsCollectionItem
}>()

const { t } = useI18n()

const statusFilters = inject<Ref<Set<string>>>('statusFilters')

type BadgeColor = 'error' | 'neutral' | 'success' | 'warning' | 'primary' | 'secondary' | 'info'

const statusColors: Record<ScStatus, BadgeColor> = {
  passed: 'success',
  failed: 'error',
  'not-present': 'neutral',
  'not-tested': 'warning'
}

const levelColors: Record<string, BadgeColor> = {
  A: 'primary',
  AA: 'primary',
  AAA: 'primary'
}
</script>

<template>
  <div
    v-show="!statusFilters || statusFilters.has(criterion.status)"
    class="rounded-lg border border-gray-200 dark:border-muted bg-muted overflow-hidden"
  >
    <div
      class="flex items-center gap-3 px-4 py-3"
      :class="{ 'border-b border-muted': criterion.issues.length > 0 }"
    >
      <UBadge
        :label="criterion.level"
        variant="subtle"
        :color="levelColors[criterion.level] ?? 'primary'"
        class="shrink-0"
      />

      <a
        :href="criterion.uri"
        target="_blank"
        class="font-medium text-gray-950 dark:text-white hover:underline"
      >
        {{ criterion.name }}
      </a>

      <div class="ml-auto flex items-center gap-2 shrink-0">
        <UBadge
          :label="t(`report.scStatus.${criterion.status}`)"
          variant="subtle"
          :color="statusColors[criterion.status]"
        />
      </div>
    </div>

    <div
      v-if="criterion.issues.length > 0"
      class="border-t border-gray-200 dark:border-gray-800 space-y-2"
    >
      <ReportIssue
        v-for="(issue, index) in criterion.issues"
        :key="issue.path"
        :issue="issue"
        :report="report"
        :criterion="criterion"
        :sc-name="criterion.name"
        :index="index + 1"
      />
    </div>
  </div>
</template>
