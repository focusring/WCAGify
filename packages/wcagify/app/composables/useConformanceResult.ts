import type { IssuesCollectionItem, ReportsCollectionItem } from '@nuxt/content'
import { conformanceSummary } from '@focusring/wcagify'

/**
 * Formats the WCAG-EM outcome of a report as "{met} of {total} criteria met".
 * A criterion is met when it passed or is not present in the sample.
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

  const text = computed(() =>
    t('report.criteriaMet', {
      conforming: summary.value.conforming.all,
      total: summary.value.totals.all
    })
  )

  return { summary, text }
}
