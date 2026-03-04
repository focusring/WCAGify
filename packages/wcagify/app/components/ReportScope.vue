<script setup lang="ts">
import type { ReportsCollectionItem } from '@nuxt/content'

defineProps<{
  report: ReportsCollectionItem
}>()

const { t } = useI18n()
</script>

<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-medium text-gray-950 dark:text-white">
        {{ t('report.scopeItems') }}
      </h3>
      <ul class="mt-2 list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
        <li v-for="item in report.scope" :key="item">
          {{ item }}
        </li>
      </ul>
    </div>

    <div v-if="report.outOfScope?.length">
      <h3 class="text-lg font-medium text-gray-950 dark:text-white">
        {{ t('report.notInScope') }}
      </h3>
      <ul class="mt-2 list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
        <li v-for="item in report.outOfScope" :key="item">
          {{ item }}
        </li>
      </ul>
    </div>

    <div>
      <h3 class="text-lg font-medium text-gray-950 dark:text-white">
        {{ t('report.accessibilitySupport') }}
      </h3>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
        {{ t('report.accessibilitySupportExplanation') }}
      </p>
      <ul class="mt-2 list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
        <li v-for="item in report.baseline" :key="item">
          {{ item }}
        </li>
      </ul>
    </div>

    <div>
      <h3 class="text-lg font-medium text-gray-950 dark:text-white">
        {{ t('report.technologiesUsed') }}
      </h3>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
        {{ t('report.technologiesExplanation') }}
      </p>
      <ul class="mt-2 list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
        <li v-for="item in report.technologies" :key="item">
          {{ item }}
        </li>
      </ul>
    </div>
  </div>
</template>
