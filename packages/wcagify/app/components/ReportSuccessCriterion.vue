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
  <div
    v-show="!statusFilters || statusFilters.has(criterion.status)"
    class="rounded-lg border border-muted bg-muted overflow-hidden"
  >
    <!-- Success criterion header get x padding using sc-header class on print -->
    <div class="flex items-center gap-3 px-4 py-3 sc-header">
      <UBadge :label="criterion.level" variant="subtle" class="shrink-0" />

      <h4 class="font-medium text-highlighted text-base w-full">
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
          v-else-if="criterion.status === 'not-tested'"
          :label="t('report.scStatus.not-tested')"
          color="warning"
          variant="subtle"
          icon="i-lucide-mouse-pointer-2-off"
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
