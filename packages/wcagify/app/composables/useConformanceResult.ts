import type { IssuesCollectionItem, ReportsCollectionItem } from '@nuxt/content'

// The "N of M criteria met" summary line shared by the cover page and header.
// Takes getters (not values) so it stays reactive to prop changes, same as an inline computed would.
export function useConformanceResult(
  getReport: () => ReportsCollectionItem,
  getIssues: () => IssuesCollectionItem[]
) {
  const { t } = useI18n()
  const { conformanceSummary } = useWcagData()

  return computed(() => {
    const report = getReport()
    const data = conformanceSummary(
      getIssues(),
      report.evaluation.targetLevel as 'A' | 'AA' | 'AAA',
      report.evaluation.targetWcagVersion as '2.0' | '2.1' | '2.2'
    )
    return t('report.criteriaMet', { conforming: data.conforming.all, total: data.totals.all })
  })
}
