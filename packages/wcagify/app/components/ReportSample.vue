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
  <!--
    `contain-inline-size` keeps the table's minimum content width from
    widening the page column at narrow viewports: the table scrolls inside
    its own `overflow-auto` wrapper instead of the whole page.
  -->
  <!-- Mobile: one stacked card per page, so no column is squeezed into a narrow strip. -->
  <ul :aria-label="t('report.representativeSample')" class="mt-4 space-y-4 md:hidden">
    <li
      v-for="page in report.sample"
      :key="page.url"
      class="rounded-lg border border-default p-4 space-y-3"
    >
      <dl class="space-y-3 text-sm">
        <div>
          <dt class="font-semibold text-highlighted">{{ t('report.title') }}</dt>
          <dd class="text-toned">{{ page.title }}</dd>
        </div>
        <div>
          <dt class="font-semibold text-highlighted">{{ t('report.url') }}</dt>
          <dd>
            <ULink
              :to="page.url"
              target="_blank"
              class="inline-flex items-start gap-1.5 font-medium text-primary hover:underline wrap-anywhere"
            >
              {{ page.url }}
              <span class="sr-only">({{ t('report.opensInNewTab') }})</span>
              <UIcon name="i-lucide-external-link" class="size-4 shrink-0 mt-0.5" />
            </ULink>
          </dd>
        </div>
        <div v-if="page.description">
          <dt class="font-semibold text-highlighted">{{ t('report.description') }}</dt>
          <dd class="text-toned">{{ page.description }}</dd>
        </div>
      </dl>
    </li>
  </ul>

  <!-- Desktop: the full table. -->
  <UTable
    class="hidden md:block"
    :data="report.sample"
    :columns="columns"
    :ui="{
      root: 'contain-inline-size',
      caption: 'sr-only',
      td: 'text-toned align-top whitespace-normal'
    }"
    :caption="t('report.representativeSample')"
  >
    <template #url-cell="{ row }">
      <!-- The visible URL starts the accessible name; the page title and new-tab hint follow as hidden text. -->
      <ULink
        :to="row.original.url"
        target="_blank"
        class="inline-flex items-start gap-1.5 text-sm font-medium text-primary hover:underline wrap-anywhere"
      >
        {{ row.original.url }}
        <span class="sr-only">({{ row.original.title }}, {{ t('report.opensInNewTab') }})</span>
        <UIcon name="i-lucide-external-link" class="size-4 shrink-0 mt-0.5" />
      </ULink>
    </template>
  </UTable>
</template>
