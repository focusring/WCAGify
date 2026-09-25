<script setup lang="ts">
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
import type { ReportsCollectionItem } from '@nuxt/content'
import { h, resolveComponent } from 'vue'

const UButton = resolveComponent('UButton')

const { t, locale } = useI18n()

const { data: reports, refresh } = await useAsyncData('reports', () =>
  queryCollection('reports').all()
)

const importOpen = ref(false)

async function onImported(slug: string) {
  await refresh()
  await navigateTo(`/reports/${slug}`)
}

const search = ref('')
const view = useCookie<'grid' | 'table'>('wcagify-reports-view', { default: () => 'table' })
const table = useTemplateRef('table')

type SortField = 'title' | 'evaluation_date'
const sortField = ref<SortField>('evaluation_date')
const sortDesc = ref(true)

const sorting = computed({
  get: () => [{ id: sortField.value, desc: sortDesc.value }],
  set: (val: { id: string; desc: boolean }[]) => {
    if (val.length > 0) {
      sortField.value = val[0]!.id as SortField
      sortDesc.value = val[0]!.desc
    }
  }
})

function toggleSort(field: SortField) {
  if (sortField.value === field) {
    sortDesc.value = !sortDesc.value
  } else {
    sortField.value = field
    sortDesc.value = false
  }
}

function getSortDirection(field: SortField): false | 'asc' | 'desc' {
  if (sortField.value !== field) return false
  return sortDesc.value ? 'desc' : 'asc'
}

const sortFieldLabels = computed<Record<SortField, string>>(() => ({
  title: t('report.title'),
  evaluation_date: t('report.date')
}))

function sortDirectionLabel(direction: 'asc' | 'desc') {
  return direction === 'desc' ? t('app.descending') : t('app.ascending')
}

/** Name of the icon-only sort button in the grid view, including the current order. */
const sortButtonLabel = computed(() =>
  t('app.sortBy', {
    field: sortFieldLabels.value[sortField.value],
    direction: sortDirectionLabel(sortDesc.value ? 'desc' : 'asc')
  })
)

/** Grid sort menu: one checked item per sort, with the direction in its name. */
const sortMenuItems = computed<DropdownMenuItem[]>(() =>
  (['title', 'evaluation_date'] as SortField[]).map((field) => {
    const direction = getSortDirection(field)
    const label = sortFieldLabels.value[field]
    return {
      label: direction
        ? t('app.sortState', { field: label, direction: sortDirectionLabel(direction) })
        : label,
      icon: sortIcon(direction),
      type: 'checkbox' as const,
      checked: direction !== false,
      onUpdateChecked: () => toggleSort(field)
    }
  })
)

/**
 * UTable renders the header cells itself and only accepts classes and styles for
 * them, so `aria-sort` is written onto the rendered <th> elements after each change.
 */
function syncAriaSort() {
  const headers = table.value?.tableApi?.getHeaderGroups()[0]?.headers ?? []
  const cells = table.value?.tableRef?.querySelectorAll<HTMLElement>('thead th') ?? []
  headers.forEach((header, index) => {
    const cell = cells[index]
    if (!cell) return
    const sorted = header.column.getIsSorted()
    if (sorted) {
      cell.setAttribute('aria-sort', sorted === 'desc' ? 'descending' : 'ascending')
    } else {
      cell.removeAttribute('aria-sort')
    }
  })
}

onMounted(syncAriaSort)
watch([sortField, sortDesc, view], () => nextTick(syncAriaSort))

/** Result announcement for the status region; written shortly after typing stops. */
const searchStatus = ref('')
let searchStatusTimer: ReturnType<typeof setTimeout> | undefined = undefined

interface FieldConfig {
  id: string
  label: string
  hideable: boolean
}

const fields: FieldConfig[] = [
  { id: 'commissioner', label: 'report.commissionedBy', hideable: true },
  { id: 'evaluator', label: 'report.evaluatedBy', hideable: true },
  { id: 'date', label: 'report.date', hideable: true },
  { id: 'target', label: 'report.target', hideable: true }
]

const hiddenFields = ref(new Set<string>())

function isFieldVisible(id: string) {
  return !hiddenFields.value.has(id)
}

function toggleFieldVisibility(id: string, visible: boolean) {
  const next = new Set(hiddenFields.value)
  if (visible) {
    next.delete(id)
  } else {
    next.add(id)
  }
  hiddenFields.value = next
}

function getAccessor(report: ReportsCollectionItem, field: string): string {
  switch (field) {
    case 'title': {
      return report.title
    }
    case 'evaluation_date': {
      return report.evaluation.date
    }
    default: {
      return ''
    }
  }
}

const filteredAndSortedReports = computed(() => {
  if (!reports.value) return []
  let result: ReportsCollectionItem[] = reports.value

  if (search.value) {
    const query = search.value.toLowerCase()
    result = result.filter(
      (report: ReportsCollectionItem) =>
        report.title.toLowerCase().includes(query) ||
        report.evaluation.commissioner.toLowerCase().includes(query) ||
        report.evaluation.evaluator.toLowerCase().includes(query)
    )
  }

  const field = sortField.value
  const desc = sortDesc.value
  return [...result].toSorted((a, b) => {
    const aVal = getAccessor(a, field)
    const bVal = getAccessor(b, field)
    const cmp = aVal.localeCompare(bVal)
    return desc ? -cmp : cmp
  })
})

watch([search, () => filteredAndSortedReports.value.length], ([query, count]) => {
  clearTimeout(searchStatusTimer)
  if (!query) {
    searchStatus.value = ''
    return
  }
  searchStatusTimer = setTimeout(() => {
    searchStatus.value = t('app.searchResults', count)
  }, 400)
})
onBeforeUnmount(() => clearTimeout(searchStatusTimer))

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
        'aria-label': isSorted
          ? t('app.sortedBy', { field: t('report.title'), direction: sortDirectionLabel(isSorted) })
          : undefined,
        icon: sortIcon(isSorted),
        class: '-mx-2.5',
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
        'aria-label': isSorted
          ? t('app.sortedBy', { field: t('report.date'), direction: sortDirectionLabel(isSorted) })
          : undefined,
        icon: sortIcon(isSorted),
        class: '-mx-2.5',
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
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">
          {{ t('app.reports') }}
        </h1>
        <p class="mt-1 text-toned">
          {{ t('app.description') }}
        </p>
      </div>
      <UButton
        :label="t('import.title')"
        icon="i-lucide-upload"
        variant="outline"
        @click="importOpen = true"
      />
    </div>
    <ReportImportSlideover
      v-if="importOpen"
      v-model:open="importOpen"
      :reports="reports ?? []"
      @imported="onImported"
    />

    <template v-if="reports?.length">
      <div class="mt-6 rounded-lg border border-accented divide-y divide-accented">
        <div class="flex flex-wrap items-center gap-2 px-4 py-3.5">
          <UInput
            v-model="search"
            :placeholder="t('report.searchReports')"
            icon="i-lucide-search"
            variant="subtle"
            class="w-full sm:w-auto sm:max-w-sm"
            :ui="{
              base: '[&::placeholder]:text-toned py-2 text-sm ring-neutral-500 hover:bg-accented/75',
              leadingIcon: 'text-toned'
            }"
          />
          <!-- Present from load so the search result can be announced when it changes. -->
          <p role="status" class="sr-only">{{ searchStatus }}</p>

          <div class="ml-auto flex items-center gap-1">
            <UDropdownMenu
              v-if="view === 'grid'"
              :modal="false"
              :items="
                fields
                  .filter((f) => f.hideable)
                  .map((f) => ({
                    label: t(f.label),
                    type: 'checkbox' as const,
                    checked: isFieldVisible(f.id),
                    onUpdateChecked(checked: boolean) {
                      toggleFieldVisibility(f.id, checked)
                    },
                    onSelect(e: Event) {
                      e.preventDefault()
                    }
                  }))
              "
              :content="{ align: 'end' as const }"
              :ui="{ content: 'ring-neutral-500/75' }"
            >
              <UButton
                :label="t('app.columns')"
                color="neutral"
                variant="subtle"
                size="lg"
                trailing-icon="i-lucide-chevron-down"
              />
            </UDropdownMenu>

            <UDropdownMenu
              v-if="view === 'table'"
              :modal="false"
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
                      nextTick(syncAriaSort)
                    },
                    onSelect(e: Event) {
                      e.preventDefault()
                    }
                  }))
              "
              :content="{ align: 'end' as const }"
              :ui="{ content: 'ring-neutral-500/75' }"
            >
              <UButton
                :label="t('app.columns')"
                color="neutral"
                variant="subtle"
                size="lg"
                trailing-icon="i-lucide-chevron-down"
              />
            </UDropdownMenu>

            <UDropdownMenu
              v-if="view === 'grid'"
              :modal="false"
              :items="sortMenuItems"
              :content="{ align: 'end' as const }"
            >
              <UButton
                icon="i-lucide-arrow-up-down"
                color="neutral"
                variant="subtle"
                size="lg"
                square
                :aria-label="sortButtonLabel"
              />
            </UDropdownMenu>

            <UButton
              :color="view === 'table' ? 'primary' : 'neutral'"
              :variant="view === 'table' ? 'subtle' : 'ghost'"
              icon="i-lucide-table"
              size="lg"
              square
              :aria-label="t('app.tableView')"
              :aria-pressed="view === 'table'"
              @click="view = 'table'"
            />
            <UButton
              :color="view === 'grid' ? 'primary' : 'neutral'"
              :variant="view === 'grid' ? 'subtle' : 'ghost'"
              icon="i-lucide-layout-grid"
              size="lg"
              square
              :aria-label="t('app.gridView')"
              :aria-pressed="view === 'grid'"
              @click="view = 'grid'"
            />
          </div>
        </div>

        <div v-if="view === 'grid'" class="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="report in filteredAndSortedReports"
            :key="report.path"
            class="group relative rounded-lg border border-neutral-500/75 bg-default p-5 transition-colors hover:border-primary-600 dark:hover:border-primary hover:bg-muted selectable-focus"
          >
            <div class="flex items-start justify-between gap-2">
              <h2 class="text-base! group-hover:text-primary-700! dark:group-hover:text-primary!">
                <NuxtLinkLocale
                  :to="report.path"
                  :lang="report.language"
                  class="hover:underline text-inherit! before:absolute before:inset-0 focus-visible:outline-none! focus-visible:shadow-none!"
                >
                  {{ report.title }}
                </NuxtLinkLocale>
              </h2>
              <UBadge
                v-if="isFieldVisible('target')"
                :label="`WCAG ${report.evaluation.targetWcagVersion} ${report.evaluation.targetLevel}`"
                color="neutral"
                variant="subtle"
                class="shrink-0 group-hover:bg-default"
              />
            </div>

            <p v-if="isFieldVisible('commissioner')" class="mt-2 text-sm text-toned">
              {{ report.evaluation.commissioner }}
            </p>

            <div class="mt-4 flex items-center gap-4 text-sm text-toned">
              <span v-if="isFieldVisible('evaluator')" class="flex items-center gap-1">
                <UIcon name="i-lucide-user" class="size-3.5" />
                {{ report.evaluation.evaluator }}
              </span>
              <span v-if="isFieldVisible('date')" class="flex items-center gap-1">
                <UIcon name="i-lucide-calendar" class="size-3.5" />
                {{ formatDate(report.evaluation.date) }}
              </span>
            </div>
          </div>
        </div>

        <UTable
          ref="table"
          v-else
          v-model:sorting="sorting"
          :data="filteredAndSortedReports"
          :columns="columns"
          :caption="t('app.reports')"
          :ui="{ caption: 'sr-only', td: 'text-toned', separator: 'border-accented' }"
        >
          <template #title-cell="{ row }">
            <NuxtLinkLocale
              :to="row.original.path"
              :lang="row.original.language"
              class="font-medium text-primary hover:underline flex items-center gap-1"
            >
              <UIcon name="i-lucide-notepad-text" class="size-4!" />
              {{ row.original.title }}
            </NuxtLinkLocale>
          </template>
          <template #targetLevel-cell="{ row }">
            <UBadge
              :label="`WCAG ${row.original.evaluation.targetWcagVersion} ${row.original.evaluation.targetLevel}`"
              color="neutral"
              variant="subtle"
            />
          </template>
        </UTable>

        <div v-if="filteredAndSortedReports.length === 0" class="px-4 py-3.5 text-sm text-toned">
          {{ t('app.noReports') }}
        </div>
      </div>
    </template>

    <p v-else class="mt-6 text-toned">
      {{ t('app.noReports') }}
    </p>
  </div>
</template>
