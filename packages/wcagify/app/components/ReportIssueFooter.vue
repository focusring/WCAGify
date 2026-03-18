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
</script>

<template>
  <dl
    class="flex flex-col md:grid md:grid-cols-2 md:grid-rows-2 gap-x-4 gap-y-4 md:gap-y-1 px-7 py-4 text-sm font-medium bg-default text-gray-950 dark:text-white"
  >
    <div class="flex gap-1">
      <p>{{ t('report.type') }}:</p>
      <UBadge
        :label="t(`report.typesort.${(issue.type ?? 'Unknown').toLowerCase()}`)"
        variant="subtle"
        color="primary"
      />
    </div>
    <div class="flex gap-1">
      <p>{{ t('report.difficulty') }}:</p>
      <UBadge
        :label="t(`report.difficultyLevel.${issue.difficulty.toLowerCase()}`)"
        variant="subtle"
        color="secondary"
      />
    </div>
    <div v-if="criterion" class="flex gap-1 items-center">
      <p>{{ t('report.successCriterion') }}:</p>
      <UButton
        :to="criterion.uri"
        :label="criterion.name"
        target="_blank"
        variant="link"
        trailing-icon="i-lucide-external-link"
        class="p-0"
      />
    </div>
    <div v-if="samplePage" class="flex gap-1 items-center">
      <dt>{{ t('report.sample') }}:</dt>
      <UButton
        :to="samplePage.url"
        :label="samplePage.title"
        target="_blank"
        variant="link"
        trailing-icon="i-lucide-external-link"
        class="p-0"
      />
    </div>
  </dl>
</template>
