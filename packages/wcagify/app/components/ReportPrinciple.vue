<script setup lang="ts">
import type { PrincipleGroup } from '@focusring/wcagify'
import type { IssuesCollectionItem, ReportsCollectionItem } from '@nuxt/content'

defineProps<{
  group: PrincipleGroup<IssuesCollectionItem>
  report: ReportsCollectionItem
}>()

const { t } = useI18n()

const principleIcons: Record<string, string> = {
  perceivable: 'i-lucide-eye',
  operable: 'i-lucide-pointer',
  understandable: 'i-lucide-brain',
  robust: 'i-lucide-shield-check'
}
</script>

<template>
  <section :id="group.principle" class="mt-12 scroll-mt-20">
    <div class="flex items-center gap-3">
      <Icon
        :name="principleIcons[group.principle] ?? 'i-lucide-circle'"
        class="size-6 text-primary"
      />
      <h2 class="text-2xl font-semibold text-gray-950 dark:text-white">
        {{ t(`report.principles.${group.principle}`) }}
      </h2>
    </div>
    <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
      {{ t(`report.principleDescriptions.${group.principle}`) }}
    </p>

    <div class="mt-6 space-y-6">
      <ReportGuideline
        v-for="guideline in group.guidelines"
        :key="guideline.guideline"
        :guideline="guideline"
        :report="report"
      />
    </div>
  </section>
</template>
