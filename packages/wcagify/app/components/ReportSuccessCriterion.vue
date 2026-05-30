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
    <div class="flex items-center gap-3 px-4 py-3">
      <UBadge :label="criterion.level" variant="subtle" class="shrink-0" />

      <h4 class="font-medium text-highlighted text-base w-full">
        {{ criterion.name }}
      </h4>

      <UBadge
        v-if="criterion.status === 'passed'"
        :label="t('report.scStatus.passed')"
        color="success"
        icon="i-lucide-check"
        class="shrink-0"
      />
      <UBadge
        v-else-if="criterion.status === 'not-present'"
        :label="t('report.scStatus.not-present')"
        color="info"
        icon="i-lucide-book-dashed"
        class="shrink-0"
      />
      <UBadge
        v-else-if="criterion.status === 'not-tested'"
        :label="t('report.scStatus.not-tested')"
        color="warning"
        icon="i-lucide-mouse-pointer-2-off"
        class="shrink-0"
      />
      <UBadge
        v-else-if="criterion.status === 'failed'"
        :label="t('report.scStatus.failed')"
        color="error"
        icon="i-lucide-x"
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
