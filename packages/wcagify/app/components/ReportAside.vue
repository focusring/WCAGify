<script setup lang="ts">
interface NavItem {
  title: string
  icon?: string
  hash: string
  children?: NavItem[]
}

const props = defineProps<{
  visiblePrinciples?: Set<string>
}>()

const { t } = useI18n()

const navigation = computed<NavItem[]>(() => [
  {
    title: t('report.executiveSummary'),
    icon: 'i-lucide-file-text',
    hash: 'executive-summary'
  },
  {
    title: t('report.resultsPerPrinciple'),
    icon: 'i-lucide-list-checks',
    hash: 'scorecard'
  },
  {
    title: t('report.aboutThisReport'),
    icon: 'i-lucide-info',
    hash: 'about'
  },
  {
    title: t('report.scope'),
    icon: 'i-lucide-target',
    hash: 'scope'
  },
  {
    title: t('report.representativeSample'),
    icon: 'i-lucide-layers',
    hash: 'sample'
  },
  {
    title: t('report.results'),
    hash: 'issues',
    icon: 'i-lucide-bar-chart-2',
    children: [
      {
        title: t('report.principles.perceivable'),
        icon: 'i-lucide-eye',
        hash: 'perceivable'
      },
      {
        title: t('report.principles.operable'),
        icon: 'i-lucide-pointer',
        hash: 'operable'
      },
      {
        title: t('report.principles.understandable'),
        icon: 'i-lucide-brain',
        hash: 'understandable'
      },
      {
        title: t('report.principles.robust'),
        icon: 'i-lucide-shield-check',
        hash: 'robust'
      }
    ]
  }
])
</script>

<template>
  <nav
    class="px-2 py-3 rounded-lg border border-accented"
    :aria-label="t('report.navigationTitle')"
  >
    <h2 class="mb-3 px-2 text-2xl font-semibold text-gray-950 dark:text-white">
      {{ t('report.navigationTitle') }}
    </h2>
    <ul class="space-y-1">
      <li v-for="item in navigation" :key="item.hash">
        <a
          :href="`#${item.hash}`"
          class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-950 dark:text-white no-underline!"
        >
          <UIcon v-if="item.icon" :name="item.icon" class="size-4 shrink-0" />
          {{ item.title }}
        </a>
        <ul v-if="item.children" class="ml-3 mt-1 space-y-1">
          <li
            v-for="child in item.children"
            :key="child.hash"
            :aria-hidden="
              visiblePrinciples && !visiblePrinciples.has(child.hash) ? 'true' : undefined
            "
          >
            <a
              :href="`#${child.hash}`"
              class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors no-underline!"
              :class="
                visiblePrinciples && !visiblePrinciples.has(child.hash)
                  ? 'pointer-events-none text-gray-500 dark:text-gray-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-950 dark:text-white'
              "
              :tabindex="visiblePrinciples && !visiblePrinciples.has(child.hash) ? -1 : undefined"
            >
              <UIcon v-if="child.icon" :name="child.icon" class="size-4 shrink-0" />
              {{ child.title }}
            </a>
          </li>
        </ul>
      </li>
    </ul>
  </nav>
</template>
