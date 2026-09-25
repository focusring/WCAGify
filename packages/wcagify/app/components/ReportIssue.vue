<script setup lang="ts">
import type { ScGroup } from '@focusring/wcagify'
import type { IssuesCollectionItem, ReportsCollectionItem } from '@nuxt/content'
import { CollapsibleRoot, CollapsibleTrigger, CollapsibleContent } from 'reka-ui'
import ProseHNested, { issueIdKey } from './content/ProseHNested.vue'

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

/*
 * The collapsible content gets an id derived from the issue path instead of
 * Reka's generated one: the generated ids differ between the server and the
 * client render, which left every trigger's aria-controls pointing at an id
 * that does not exist. The same id is set explicitly on the trigger.
 */
const contentId = `${issueId}-content`

/*
 * Headings in an issue body (`#### Recommendation`) must rank below the
 * issue title (h5), so every body heading is rendered as an h6 without the
 * anchor self-link, with an id unique to this issue.
 */
provide(issueIdKey, issueId)
const bodyComponents = Object.fromEntries(
  ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((tag) => [tag, ProseHNested])
)

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
  <CollapsibleRoot
    :id="issueId"
    v-model:open="open"
    :unmount-on-hide="false"
    as="article"
    data-slot="root"
    class="scroll-mt-20"
  >
    <CollapsibleTrigger as-child>
      <UButton
        class="group"
        color="neutral"
        variant="subtle"
        block
        :aria-controls="contentId"
        :ui="{
          base: 'px-4 py-3 flex-wrap items-start justify-start gap-3 text-left rounded-none ring-0 border-t border-muted'
        }"
      >
        <h5 class="font-medium text-highlighted text-base min-w-0 flex-[1_1_10rem]">
          <span v-if="index !== undefined && index !== null">{{ index }}. </span>{{ issue.title }}
        </h5>

        <!--
          Below `sm` the badges move to their own line under the title (visual
          order only, via `order`) and the sample title may wrap, so nothing is
          clipped at 320px or with user text spacing.
        -->
        <template #trailing>
          <UBadge
            v-if="samplePage"
            :label="samplePage.title"
            color="neutral"
            variant="subtle"
            class="max-sm:order-last min-w-0"
            :ui="{ label: 'whitespace-normal text-left' }"
          />
          <UBadge
            :label="t('report.scStatus.failed')"
            color="error"
            variant="subtle"
            icon="i-lucide-x"
            class="max-sm:order-last shrink-0"
          />
          <UIcon
            name="i-lucide-chevron-down"
            class="mt-0.5 ml-auto shrink-0 size-5 icon-animation"
          />
        </template>
      </UButton>
    </CollapsibleTrigger>

    <CollapsibleContent
      data-slot="content"
      as-child
      class="data-[state=open]:animate-[collapsible-down_200ms_ease-out] data-[state=closed]:animate-[collapsible-up_200ms_ease-out] data-[state=closed]:overflow-hidden"
    >
      <div :id="contentId">
        <ContentRenderer
          :value="issue"
          :components="bodyComponents"
          class="pt-4 pb-2 px-4 prose dark:prose-invert"
        />
        <ReportIssueFooter :issue="issue" :report="report" :criterion="criterion" />
      </div>
    </CollapsibleContent>
  </CollapsibleRoot>
</template>
