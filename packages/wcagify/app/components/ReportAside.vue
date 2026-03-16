<script setup lang="ts">
import type { ContentNavigationLink } from '@nuxt/ui'

const { t } = useI18n()

const navigation = ref<ContentNavigationLink[]>([
  {
    title: t('report.executiveSummary'),
    icon: 'i-lucide:notebook',
    path: '#executive-summary'
  },
  {
    title: t('report.resultsPerPrinciple'),
    icon: 'i-lucide:book-open-text',
    path: '#scorecard'
  },
  {
    title: t('report.aboutThisReport'),
    icon: 'i-lucide:book-search',
    path: '#about'
  },
  {
    title: t('report.scope'),
    icon: 'i-lucide:map',
    path: '#scope'
  },
  {
    title: t('report.representativeSample'),
    icon: 'i-lucide:test-tube',
    path: '#sample'
  },
  {
    title: t('report.issues'),
    icon: 'i-lucide:clipboard-x',
    path: '#issues',
    children: [
      {
        title: t('report.principles.perceivable'),
        icon: 'i-lucide-eye',
        path: '#perceivable'
      },
      {
        title: t('report.principles.operable'),
        icon: 'i-lucide-pointer',
        path: '#operable'
      },
      {
        title: t('report.principles.understandable'),
        icon: 'i-lucide-brain',
        path: '#understandable'
      },
      {
        title: t('report.principles.robust'),
        icon: 'i-lucide-shield-check',
        path: '#robust'
      }
    ]
  }
])
</script>

<template>
  <div class="p-3 rounded-lg border border-accented max-w-58">
    <h2 class="mb-4 text-2xl font-semibold text-gray-950 dark:text-white">
      {{ t('report.navigationTitle') }}
    </h2>
    <UContentNavigation
      :navigation="navigation"
      highlight
      highlight-color="primary"
      color="primary"
      variant="pill"
    />
  </div>
</template>
