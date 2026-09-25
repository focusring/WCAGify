<script setup lang="ts">
import type { ScGroup } from '@focusring/wcagify'
import type { IssuesCollectionItem, ReportsCollectionItem } from '@nuxt/content'

const props = defineProps<{
  criterion: ScGroup<IssuesCollectionItem>
  report: ReportsCollectionItem
}>()

const { t } = useI18n()

const statusFilters = inject<Ref<Set<string>>>('statusFilters')
</script>

<template>
  <!--
    No overflow clipping on the card: rows wrap instead, so titles and badges
    stay visible at narrow widths and with user text spacing. The last issue's
    square corners are rounded to match the card instead.
  -->
  <div
    v-show="!statusFilters || statusFilters.has(criterion.status)"
    class="rounded-lg border border-muted bg-muted"
  >
    <!-- Success criterion header get x padding using sc-header class on print -->
    <div class="flex flex-wrap items-center gap-3 px-4 py-3 sc-header">
      <UBadge :label="criterion.level" variant="subtle" class="shrink-0" />

      <h4 class="font-medium text-highlighted text-base min-w-0 flex-[1_1_10rem]">
        {{ criterion.name }}
      </h4>

      <div class="shrink-0">
        <UBadge
          v-if="criterion.status === 'passed'"
          :label="t('report.scStatus.passed')"
          color="success"
          variant="subtle"
          icon="i-lucide-check"
        />
        <UBadge
          v-else-if="criterion.status === 'not-present'"
          :label="t('report.scStatus.not-present')"
          color="info"
          variant="subtle"
          icon="i-lucide-book-dashed"
        />
        <UBadge
          v-else-if="criterion.status === 'failed'"
          :label="t('report.scStatus.failed')"
          color="error"
          variant="subtle"
          icon="i-lucide-x"
        />
      </div>
    </div>

    <div
      v-if="criterion.issues.length > 0"
      class="[&>article:last-child[data-state=closed]>button]:rounded-b-lg [&>article:last-child_dl]:rounded-b-lg"
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
