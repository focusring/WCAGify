<script setup lang="ts">
import type { IssuesCollectionItem } from '@nuxt/content'

const props = defineProps<{
  issues: IssuesCollectionItem[]
  targetLevel: string
  wcagVersion: string
}>()

const { t } = useI18n()
const { conformanceSummary, PRINCIPLES } = useWcagData()

const data = computed(() =>
  conformanceSummary(
    props.issues,
    props.targetLevel as 'A' | 'AA' | 'AAA',
    props.wcagVersion as '2.0' | '2.1' | '2.2'
  )
)
</script>

<template>
  <div class="space-y-4">
    <p class="text-lg font-medium text-gray-950 dark:text-white">
      {{
        t('report.conformanceLevel', {
          level: targetLevel,
          conforming: data.conforming.all,
          total: data.totals.all
        })
      }}
    </p>
    <table class="w-full border-separate border-spacing-0 text-sm text-left">
      <caption class="sr-only">
        {{
          t('report.resultsPerPrinciple')
        }}
      </caption>
      <thead>
        <tr>
          <th
            scope="col"
            class="border-b border-gray-200 py-2 pr-4 font-medium text-gray-950 dark:border-gray-800 dark:text-white"
          >
            {{ t('report.principle') }}
          </th>
          <th
            scope="col"
            class="border-b border-gray-200 py-2 font-medium text-gray-950 dark:border-gray-800 dark:text-white"
          >
            {{ t('report.result') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="principle in PRINCIPLES" :key="principle">
          <td
            class="border-b border-gray-100 py-2 pr-4 text-gray-700 dark:border-gray-900 dark:text-gray-300"
          >
            {{ t(`report.principles.${principle}`) }}
          </td>
          <td
            class="border-b border-gray-100 py-2 text-gray-700 dark:border-gray-900 dark:text-gray-300"
          >
            {{
              t('report.criteriaMet', {
                conforming: data.conforming[principle],
                total: data.totals[principle]
              })
            }}
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <th
            scope="row"
            class="border-t border-gray-200 py-2 pr-4 font-medium text-gray-950 dark:border-gray-800 dark:text-white"
          >
            {{ t('report.total') }}
          </th>
          <td
            class="border-t border-gray-200 py-2 font-medium text-gray-950 dark:border-gray-800 dark:text-white"
          >
            {{
              t('report.criteriaMet', { conforming: data.conforming.all, total: data.totals.all })
            }}
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>
