<script setup lang="ts">
import type { ReportsCollectionItem } from '@nuxt/content'
import type { TableColumn } from '@nuxt/ui'

defineProps<{
  report: ReportsCollectionItem
}>()

const { t } = useI18n()

type SamplePage = ReportsCollectionItem['sample'][number]

const columns = computed<TableColumn<SamplePage>[]>(() => [
  {
    accessorKey: 'title',
    header: t('report.title'),
    meta: { class: { th: 'w-1/6', td: 'w-1/6' } }
  },
  {
    accessorKey: 'url',
    header: t('report.url'),
    meta: { class: { th: 'w-1/3', td: 'w-1/3' } }
  },
  {
    accessorKey: 'description',
    header: t('report.description')
  }
])
</script>

<template>
  <UTable
    :data="report.sample"
    :columns="columns"
    :ui="{ caption: 'sr-only', td: 'text-toned align-top whitespace-normal' }"
    :caption="t('report.representativeSample')"
  >
    <template #url-cell="{ row }">
      <ULink
        :to="row.original.url"
        target="_blank"
        :aria-label="`${row.original.title} (${t('report.externalLink')})`"
        class="inline-flex items-start gap-1.5 text-sm font-medium text-primary hover:underline [overflow-wrap:anywhere]"
      >
        {{ row.original.url }}
        <UIcon name="i-lucide-external-link" class="size-4 shrink-0 mt-0.5" />
      </ULink>
    </template>
  </UTable>
</template>
