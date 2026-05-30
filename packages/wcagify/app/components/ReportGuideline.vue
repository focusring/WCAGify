<script setup lang="ts">
import type { GuidelineGroup } from '@focusring/wcagify'
import type { IssuesCollectionItem, ReportsCollectionItem } from '@nuxt/content'

const props = defineProps<{
  guideline: GuidelineGroup<IssuesCollectionItem>
  report: ReportsCollectionItem
}>()

const statusFilters = inject<Ref<Set<string>>>('statusFilters')

const hasVisibleCriteria = computed(
  () => !statusFilters || props.guideline.criteria.some((sc) => statusFilters.value.has(sc.status))
)
</script>

<template>
  <div v-show="hasVisibleCriteria">
    <h3 class="py-2">{{ guideline.guideline }}: {{ guideline.name }}</h3>

    <div class="mt-2 space-y-3">
      <ReportSuccessCriterion
        v-for="criterion in guideline.criteria"
        :key="criterion.sc"
        :criterion="criterion"
        :report="report"
      />
    </div>
  </div>
</template>
