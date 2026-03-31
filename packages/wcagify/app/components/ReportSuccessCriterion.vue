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

const statusConfig: Record<ScStatus, { color: BadgeColor; icon: string }> = {
  passed: { color: 'success', icon: 'i-lucide:check' },
  failed: { color: 'error', icon: 'i-lucide:x' },
  'not-present': { color: 'neutral', icon: 'i-lucide:book-dashed' },
  'not-tested': { color: 'warning', icon: 'i-lucide:mouse-pointer-2-off' }
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
    <div class="flex items-center gap-3 px-4 py-3">
      <UBadge
        :label="criterion.level"
        variant="subtle"
        :color="levelColors[criterion.level] ?? 'primary'"
        class="shrink-0"
      />

      <h4 class="font-medium text-gray-950 dark:text-white text-base w-full">
        {{ criterion.name }}
      </h4>

      <UBadge
        :label="t(`report.scStatus.${criterion.status}`)"
        variant="subtle"
        :color="statusConfig[criterion.status].color"
        :icon="statusConfig[criterion.status].icon"
        class="shrink-0"
      />
    </div>

    <div v-if="criterion.issues.length > 0">
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
