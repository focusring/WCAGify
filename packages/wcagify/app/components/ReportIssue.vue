<script setup lang="ts">
import type { IssuesCollectionItem, ReportsCollectionItem } from '@nuxt/content'

const props = defineProps<{
  issue: IssuesCollectionItem
  report: ReportsCollectionItem
  scName: string
}>()

const { t } = useI18n()
const { resolveSamplePage } = useWcagData()

const samplePage = computed(() => resolveSamplePage(props.report.sample, props.issue.sample))
</script>

<template>
  <article :id="`issue-${issue.path.split('/').pop()}`">
    <h4 class="font-medium text-gray-950 dark:text-white">
      {{ issue.title }}
    </h4>
    <dl class="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
      <div class="flex gap-1">
        <dt>{{ t('report.successCriterion') }}:</dt>
        <dd>{{ scName }}</dd>
      </div>
      <div class="flex gap-1">
        <dt>{{ t('report.severity') }}:</dt>
        <dd>{{ issue.severity }}</dd>
      </div>
      <div class="flex gap-1">
        <dt>{{ t('report.difficulty') }}:</dt>
        <dd>{{ issue.difficulty }}</dd>
      </div>
      <div v-if="samplePage" class="flex gap-1">
        <dt>{{ t('report.sample') }}:</dt>
        <dd>{{ samplePage.title }}</dd>
      </div>
    </dl>
    <div class="mt-3 prose dark:prose-invert">
      <ContentRenderer :value="issue" />
    </div>
  </article>
</template>
