<script setup lang="ts">
import type { IssuesCollectionItem } from '@nuxt/content'

const props = defineProps<{
  issues: IssuesCollectionItem[]
  targetLevel: string
  wcagVersion: string
}>()

const { t } = useI18n()
const { scorecardByLevel, PRINCIPLES } = useWcagData()

const data = computed(() =>
  scorecardByLevel(
    props.issues,
    props.targetLevel as 'A' | 'AA' | 'AAA',
    props.wcagVersion as '2.0' | '2.1' | '2.2'
  )
)

const showTotalColumn = computed(() => data.value.levels.length > 1)
</script>

<template>
  <div class="space-y-4">
    <p class="text-lg font-medium text-highlighted">
      {{
        t('report.conformanceLevel', {
          level: targetLevel,
          conforming: data.total.conforming.all,
          total: data.total.totals.all
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
          <th scope="col" class="border-b border-muted py-2 pr-4 font-medium text-muted">
            {{ t('report.wcagPrinciple') }}
          </th>
          <th
            v-for="level in data.levels"
            :key="level"
            scope="col"
            class="border-b border-muted py-2 pr-4 text-center font-medium text-muted"
          >
            {{ level }}
          </th>
          <th
            v-if="showTotalColumn"
            scope="col"
            class="border-b border-muted py-2 text-center font-medium text-muted"
          >
            {{ t('report.total') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="principle in PRINCIPLES" :key="principle">
          <th scope="row" class="border-b border-muted py-2 pr-4 font-medium text-highlighted">
            {{ t(`report.principles.${principle}`) }}
          </th>
          <td
            v-for="level in data.levels"
            :key="level"
            class="border-b border-muted py-2 pr-4 text-center text-gray-700 dark:text-gray-300"
          >
            {{
              t('report.scoreFormat', {
                conforming: data.perLevel.get(level)!.conforming[principle],
                total: data.perLevel.get(level)!.totals[principle]
              })
            }}
          </td>
          <td
            v-if="showTotalColumn"
            class="border-b border-muted py-2 text-center text-gray-700 dark:text-gray-300"
          >
            {{
              t('report.scoreFormat', {
                conforming: data.total.conforming[principle],
                total: data.total.totals[principle]
              })
            }}
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <th scope="row" class="border-b border-muted py-2 pr-4 font-medium text-highlighted">
            {{ t('report.total') }}
          </th>
          <td
            v-for="level in data.levels"
            :key="level"
            class="border-b border-muted py-2 pr-4 text-center font-medium text-highlighted"
          >
            {{
              t('report.scoreFormat', {
                conforming: data.perLevel.get(level)!.conforming.all,
                total: data.perLevel.get(level)!.totals.all
              })
            }}
          </td>
          <td
            v-if="showTotalColumn"
            class="border-b border-muted py-2 text-center font-medium text-highlighted"
          >
            {{
              t('report.scoreFormat', {
                conforming: data.total.conforming.all,
                total: data.total.totals.all
              })
            }}
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>
