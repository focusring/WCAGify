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

const open = ref(false)

/*
 * A link to an issue lands on a closed collapsible, so a deep link (the report
 * navigation, a shared URL, an embed) opens it and scrolls it under the sticky
 * header. The scroll is done on the window rather than with scrollIntoView so
 * that an embedding page is never scrolled along with the iframe, and it runs
 * again once the content has expanded, since near the end of the report the
 * page is only tall enough to reach the issue after it has opened.
 */
const STICKY_HEADER_OFFSET = 80
const EXPAND_ANIMATION_MS = 300

function scrollUnderHeader() {
  const element = document.getElementById(issueId)
  if (!element) return
  const top = element.getBoundingClientRect().top + globalThis.scrollY - STICKY_HEADER_OFFSET
  globalThis.scrollTo({ top, behavior: 'smooth' })
}

function revealFromHash() {
  if (globalThis.location.hash !== `#${issueId}`) return
  open.value = true
  nextTick(scrollUnderHeader)
  setTimeout(scrollUnderHeader, EXPAND_ANIMATION_MS)
}

onMounted(() => {
  revealFromHash()
  globalThis.addEventListener('hashchange', revealFromHash)
})

onBeforeUnmount(() => {
  globalThis.removeEventListener('hashchange', revealFromHash)
})
</script>

<template>
  <UCollapsible
    :id="issueId"
    v-model:open="open"
    :unmount-on-hide="false"
    as="article"
    class="scroll-mt-20"
  >
    <UButton
      class="group"
      color="neutral"
      variant="subtle"
      block
      :ui="{
        base: 'px-4 py-3 items-start gap-3 text-left rounded-none ring-0 border-t border-muted'
      }"
    >
      <h5 class="font-medium text-highlighted text-base w-full">
        <span v-if="index !== undefined && index !== null">{{ index }}. </span>{{ issue.title }}
      </h5>

      <template #trailing>
        <UBadge
          v-if="samplePage"
          :label="samplePage.title"
          color="neutral"
          variant="subtle"
          class="shrink-0"
        />
        <UBadge
          :label="t('report.scStatus.failed')"
          color="error"
          variant="subtle"
          icon="i-lucide-x"
          class="shrink-0"
        />
        <UIcon name="i-lucide-chevron-down" class="mt-0.5 shrink-0 size-5 icon-animation" />
      </template>
    </UButton>

    <template #content>
      <ContentRenderer :value="issue" class="pt-4 pb-2 px-4 prose dark:prose-invert" />
      <ReportIssueFooter :issue="issue" :report="report" :criterion="criterion" />
    </template>
  </UCollapsible>
</template>
