<script lang="ts">
import type { InjectionKey } from 'vue'

/** The id of the issue whose body is being rendered; provided by ReportIssue. */
export const issueIdKey: InjectionKey<string> = Symbol('wcagify-issue-id')
</script>

<script setup lang="ts">
/*
 * Heading used for every heading inside an issue body. The issue title is an
 * h5, so body headings (`#### Recommendation`) render as h6 to keep the
 * outline nested. There is no anchor self-link: the shared markdown ids
 * ("recommendation") were repeated for every issue, so the id is prefixed
 * with the issue id to keep it unique on the page and in the PDF.
 */
const props = defineProps<{
  id?: string
}>()

const issueId = inject(issueIdKey, '')

const headingId = computed(() => {
  if (!props.id) return undefined
  return issueId ? `${issueId}-${props.id}` : props.id
})
</script>

<template>
  <h6 :id="headingId" class="text-lg text-highlighted font-bold">
    <slot />
  </h6>
</template>
