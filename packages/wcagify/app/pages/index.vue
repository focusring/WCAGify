<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { ReportsCollectionItem } from '@nuxt/content'
import { h, resolveComponent } from 'vue'

const UButton = resolveComponent('UButton')

const { t, locale } = useI18n()

const { data: reports } = await useAsyncData('reports', () => queryCollection('reports').all())

const search = ref('')
const view = useCookie<'grid' | 'table'>('wcagify-reports-view', { default: () => 'table' })
const table = useTemplateRef('table')
const sorting = ref([{ id: 'evaluation_date', desc: true }])

const filteredReports = computed(() => {
  if (!reports.value) return []
  if (!search.value) return reports.value
  const query = search.value.toLowerCase()
  return reports.value.filter(
    (report) =>
      report.title.toLowerCase().includes(query) ||
      report.evaluation.commissioner.toLowerCase().includes(query) ||
      report.evaluation.evaluator.toLowerCase().includes(query)
  )
})

function sortIcon(isSorted: false | 'asc' | 'desc') {
  if (isSorted === 'asc') return 'i-lucide-arrow-up-narrow-wide'
  if (isSorted === 'desc') return 'i-lucide-arrow-down-wide-narrow'
  return 'i-lucide-arrow-up-down'
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(locale.value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const columns = computed<TableColumn<ReportsCollectionItem>[]>(() => [
  {
    accessorKey: 'title',
    enableHiding: false,
    header: ({ column }) => {
      const isSorted = column.getIsSorted()
      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: t('report.title'),
        icon: sortIcon(isSorted),
        class: '-mx-2.5 cursor-pointer',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
      })
    }
  },
  {
    accessorKey: 'evaluation.commissioner',
    header: t('report.commissionedBy')
  },
  {
    accessorKey: 'evaluation.evaluator',
    header: t('report.evaluatedBy')
  },
  {
    accessorKey: 'evaluation.date',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()
      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: t('report.date'),
        icon: sortIcon(isSorted),
        class: '-mx-2.5 cursor-pointer',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
      })
    },
    cell: ({ row }) => formatDate(row.original.evaluation.date)
  },
  {
    id: 'targetLevel',
    accessorKey: 'evaluation.targetLevel',
    header: t('report.target')
  }
])

const columnLabels = computed<Record<string, string>>(() => ({
  title: t('report.title'),
  evaluation_commissioner: t('report.commissionedBy'),
  evaluation_evaluator: t('report.evaluatedBy'),
  evaluation_date: t('report.date'),
  targetLevel: t('report.target')
}))
</script>

<template>
  <div class="py-8">
    <h1 class="text-3xl font-bold">
      {{ t('app.reports') }}
    </h1>
    <p class="mt-1 text-muted">
      {{ t('app.description') }}
    </p>

    <template v-if="reports?.length">
      <div class="mt-6 rounded-lg border border-accented divide-y divide-accented">
        <div class="flex items-center gap-2 px-4 py-3.5">
          <UInput
            v-model="search"
            :placeholder="t('report.searchReports')"
            icon="i-lucide-search"
            class="max-w-sm"
          />

          <div class="ml-auto flex items-center gap-1">
            <UDropdownMenu
              v-if="view === 'table'"
              :items="
                table?.tableApi
                  ?.getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => ({
                    label: columnLabels[column.id] || column.id,
                    type: 'checkbox' as const,
                    checked: column.getIsVisible(),
                    onUpdateChecked(checked: boolean) {
                      column.toggleVisibility(checked)
                    },
                    onSelect(e: Event) {
                      e.preventDefault()
                    }
                  }))
              "
              :content="{ align: 'end' as const }"
            >
              <UButton
                :label="t('app.columns')"
                color="neutral"
                variant="outline"
                trailing-icon="i-lucide-chevron-down"
                class="cursor-pointer"
              />
            </UDropdownMenu>

            <UButton
              :color="view === 'table' ? 'primary' : 'neutral'"
              :variant="view === 'table' ? 'subtle' : 'ghost'"
              icon="i-lucide-table"
              square
              :aria-label="t('app.tableView')"
              :aria-pressed="view === 'table'"
              @click="view = 'table'"
              class="cursor-pointer"
            />
            <UButton
              :color="view === 'grid' ? 'primary' : 'neutral'"
              :variant="view === 'grid' ? 'subtle' : 'ghost'"
              icon="i-lucide-layout-grid"
              square
              :aria-label="t('app.gridView')"
              :aria-pressed="view === 'grid'"
              @click="view = 'grid'"
              class="cursor-pointer"
            />
          </div>
        </div>

        <div v-if="view === 'grid'" class="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <NuxtLinkLocale
            v-for="report in filteredReports"
            :key="report.path"
            :to="report.path"
            class="group rounded-lg border border-default bg-default p-5 transition-colors hover:border-primary hover:bg-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <div class="flex items-start justify-between gap-2">
              <h2 class="font-semibold text-highlighted group-hover:text-primary">
                {{ report.title }}
              </h2>
              <UBadge variant="subtle" color="neutral" class="shrink-0">
                WCAG {{ report.evaluation.targetLevel }}
              </UBadge>
            </div>

            <p class="mt-2 text-sm text-muted">
              {{ report.evaluation.commissioner }}
            </p>

            <div class="mt-4 flex items-center gap-4 text-xs text-dimmed">
              <span class="flex items-center gap-1">
                <UIcon name="i-lucide-user" class="size-3.5" />
                {{ report.evaluation.evaluator }}
              </span>
              <span class="flex items-center gap-1">
                <UIcon name="i-lucide-calendar" class="size-3.5" />
                {{ formatDate(report.evaluation.date) }}
              </span>
            </div>
          </NuxtLinkLocale>
        </div>

        <UTable
          ref="table"
          v-else
          v-model:sorting="sorting"
          :data="filteredReports"
          :columns="columns"
          :caption="t('app.reports')"
          :ui="{ caption: 'sr-only' }"
        >
          <template #title-cell="{ row }">
            <NuxtLinkLocale
              :to="row.original.path"
              class="font-medium text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {{ row.original.title }}
            </NuxtLinkLocale>
          </template>
          <template #targetLevel-cell="{ row }">
            <UBadge variant="subtle" color="neutral">
              WCAG {{ row.original.evaluation.targetLevel }}
            </UBadge>
          </template>
        </UTable>

        <div v-if="filteredReports.length === 0" class="px-4 py-3.5 text-sm text-muted">
          {{ t('app.noReports') }}
        </div>
      </div>
    </template>

    <p v-else class="mt-6 text-muted">
      {{ t('app.noReports') }}
    </p>
  </div>
</template>
