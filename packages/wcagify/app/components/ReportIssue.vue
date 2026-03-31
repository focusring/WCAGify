<script setup lang="ts">
import type { ScGroup } from '@focusring/wcagify'
import type { IssuesCollectionItem, ReportsCollectionItem } from '@nuxt/content'

const props = defineProps<{
  issue: IssuesCollectionItem
  report: ReportsCollectionItem
  criterion: ScGroup<IssuesCollectionItem>
  scName: string
  index?: number
}>()

const { t } = useI18n()
const { resolveSamplePage } = useWcagData()

const samplePage = computed(() => resolveSamplePage(props.report.sample, props.issue.sample))

const sanitizedPath = props.issue.path.split('/').filter(Boolean).join('-')
const issueId = `issue-${sanitizedPath}`
</script>

<template>
  <UCollapsible :unmount-on-hide="false" :id="issueId" as="article">
    <UButton
      class="group cursor-pointer"
      color="neutral"
      variant="subtle"
      block
      :ui="{
        base: 'px-4 py-3 items-start gap-3 text-left rounded-none ring-0 border-t border-muted'
      }"
    >
      <h5 class="font-medium text-gray-950 dark:text-white text-base w-full">
        <span v-if="index !== undefined && index !== null">{{ index }}. </span>{{ issue.title }}
      </h5>

      <template #trailing>
        <UBadge
          v-if="samplePage"
          :label="samplePage.title"
          variant="outline"
          color="neutral"
          class="shrink-0"
        />
        <UBadge
          :label="t('report.scStatus.failed')"
          variant="subtle"
          color="error"
          icon="i-lucide-x"
          class="shrink-0"
        />
        <UIcon
          name="i-lucide-chevron-down"
          class="mt-0.5 shrink-0 size-5 text-muted transition-transform group-data-[state=open]:rotate-180"
        />
      </template>
    </UButton>

    <template #content>
      <ContentRenderer :value="issue" class="pt-4 pb-2 px-4 prose dark:prose-invert" />
      <ReportIssueFooter :issue="issue" :report="report" :criterion="criterion" />
    </template>
  </UCollapsible>
</template>
