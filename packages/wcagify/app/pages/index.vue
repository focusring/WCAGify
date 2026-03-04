<script setup lang="ts">
import type { ReportsCollectionItem } from '@nuxt/content'
import type { TableColumn, TableRow } from '@nuxt/ui'

const { t } = useI18n()
const localePath = useLocalePath()

const { data: reports } = await useAsyncData('reports', () => queryCollection('reports').all())

const columns = computed<TableColumn<ReportsCollectionItem>[]>(() => [
  {
    accessorKey: 'title',
    header: t('report.title')
  },
  {
    accessorKey: 'evaluation.evaluator',
    header: t('report.evaluatedBy')
  },
  {
    accessorKey: 'evaluation.commissioner',
    header: t('report.commissionedBy')
  },
  {
    accessorKey: 'evaluation.date',
    header: t('report.date')
  },
  {
    accessorKey: 'evaluation.targetLevel',
    header: t('report.target')
  }
])

function onSelect(_e: Event, row: TableRow<ReportsCollectionItem>) {
  navigateTo(localePath(row.original.path))
}
</script>

<template>
  <div class="py-8">
    <h1 class="text-3xl font-bold">
      {{ t('app.reports') }}
    </h1>
    <p class="mt-1 text-muted">
      {{ t('app.description') }}
    </p>

    <UTable
      v-if="reports?.length"
      :data="reports"
      :columns="columns"
      class="mt-6"
      @select="onSelect"
    />

    <p v-else class="mt-6 text-muted">
      {{ t('app.noReports') }}
    </p>
  </div>
</template>
