<script setup lang="ts">
interface NavItem {
  title: string
  icon?: string
  hash: string
  children?: NavItem[]
}

const { t } = useI18n()

const navigation = computed<NavItem[]>(() => [
  {
    title: t('report.executiveSummary'),
    hash: 'executive-summary'
  },
  {
    title: t('report.resultsPerPrinciple'),
    hash: 'scorecard'
  },
  {
    title: t('report.aboutThisReport'),
    hash: 'about'
  },
  {
    title: t('report.scope'),
    hash: 'scope'
  },
  {
    title: t('report.representativeSample'),
    hash: 'sample'
  },
  {
    title: t('report.results'),
    hash: 'issues',
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
    class="p-3 rounded-lg border border-accented max-w-58"
    :aria-label="$t('report.navigationTitle')"
  >
    <h2 class="mb-4 text-2xl font-semibold text-gray-950 dark:text-white">
      {{ $t('report.navigationTitle') }}
    </h2>
    <ul class="space-y-1">
      <li v-for="item in navigation" :key="item.hash">
        <a
          :href="`#${item.hash}`"
          class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
        >
          <Icon v-if="item.icon" :name="item.icon" class="size-4 shrink-0" />
          {{ item.title }}
        </a>
        <ul v-if="item.children" class="ml-4 mt-1 space-y-1">
          <li v-for="child in item.children" :key="child.hash">
            <a
              :href="`#${child.hash}`"
              class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              <Icon v-if="child.icon" :name="child.icon" class="size-4 shrink-0" />
              {{ child.title }}
            </a>
          </li>
        </ul>
      </li>
    </ul>
  </nav>
</template>
