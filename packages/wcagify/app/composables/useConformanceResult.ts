import type { IssuesCollectionItem, ReportsCollectionItem } from '@nuxt/content'
import { conformanceSummary } from '@focusring/wcagify'

/**
 * Formats the WCAG-EM outcome of a report as "{met} of {total} criteria met",
 * followed by the number of criteria without a recorded outcome when there
 * are any. Criteria that were not tested are never counted as met.
 */
export function useConformanceResult(
  report: MaybeRefOrGetter<ReportsCollectionItem>,
  issues: MaybeRefOrGetter<IssuesCollectionItem[]>
) {
  const { t } = useI18n()

  const summary = computed(() => {
    const r = toValue(report)
    return conformanceSummary(toValue(issues), r.evaluation.targetLevel, {
      wcagVersion: r.evaluation.targetWcagVersion,
      scStatuses: r.scStatuses
    })
  })

  const text = computed(() => {
    const data = summary.value
    const met = t('report.criteriaMet', { conforming: data.conforming.all, total: data.totals.all })
    if (data.notTested.all === 0) return met
    return `${met}, ${t('report.criteriaNotTested', { count: data.notTested.all })}`
  })

  return { summary, text }
}
