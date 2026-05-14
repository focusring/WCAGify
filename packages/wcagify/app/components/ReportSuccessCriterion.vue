<script setup lang="ts">
import type { ScGroup } from '@focusring/wcagify'
import type { IssuesCollectionItem, ReportsCollectionItem } from '@nuxt/content'

const props = defineProps<{
  criterion: ScGroup<IssuesCollectionItem>
  report: ReportsCollectionItem
}>()

const { t } = useI18n()

const statusFilters = inject<Ref<Set<string>>>('statusFilters')

const colorMode = useColorMode()
const statusBadgeVariant = computed(() => (colorMode.value === 'dark' ? 'subtle' : 'solid'))

const levelColors = {
  A: 'primary',
  AA: 'primary',
  AAA: 'primary'
} as const
</script>

<template>
  <div
    v-show="!statusFilters || statusFilters.has(criterion.status)"
    class="rounded-lg border border-muted bg-muted overflow-hidden"
  >
    <div class="flex items-center gap-3 px-4 py-3">
      <UBadge
        :label="criterion.level"
        variant="subtle"
        :color="levelColors[criterion.level] ?? 'primary'"
        class="shrink-0"
      />

      <h4 class="font-medium text-highlighted text-base w-full">
        {{ criterion.name }}
      </h4>

      <UBadge
        v-if="criterion.status === 'passed'"
        :label="t('report.scStatus.passed')"
        :variant="statusBadgeVariant"
        color="success"
        icon="i-lucide:check"
        class="shrink-0"
      />
      <UBadge
        v-else-if="criterion.status === 'failed'"
        :label="t('report.scStatus.failed')"
        :variant="statusBadgeVariant"
        color="error"
        icon="i-lucide:x"
        class="shrink-0 dark:bg-error/5 text-black dark:text-error-400"
      />
      <UBadge
        v-else-if="criterion.status === 'not-present'"
        :label="t('report.scStatus.not-present')"
        :variant="statusBadgeVariant"
        color="neutral"
        icon="i-lucide:book-dashed"
        class="shrink-0"
      />
      <UBadge
        v-else-if="criterion.status === 'not-tested'"
        :label="t('report.scStatus.not-tested')"
        :variant="statusBadgeVariant"
        color="warning"
        icon="i-lucide:mouse-pointer-2-off"
        class="shrink-0 text-warning-950 dark:text-warning-400"
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
