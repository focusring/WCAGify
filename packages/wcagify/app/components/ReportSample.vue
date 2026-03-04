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
    header: t('report.title')
  },
  {
    accessorKey: 'url',
    header: t('report.url')
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
    :ui="{ caption: 'sr-only' }"
    :caption="t('report.representativeSample')"
  >
    <template #url-cell="{ row }">
      <UButton
        :to="row.original.url"
        :label="row.original.url"
        target="_blank"
        variant="link"
        trailing-icon="i-lucide-external-link"
        :aria-label="`${row.original.title} (${t('report.externalLink')})`"
        class="p-0"
      />
    </template>
  </UTable>
</template>
