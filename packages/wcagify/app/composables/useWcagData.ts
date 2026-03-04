import {
  scUri,
  scName,
  scorecard,
  conformanceSummary,
  PRINCIPLES,
  filterIssues,
  sortIssuesBySc,
  filterTips,
  groupIssuesBySc,
  resolveSamplePage
} from 'wcagify'

export function useWcagData() {
  return {
    scUri,
    scName,
    scorecard,
    conformanceSummary,
    PRINCIPLES,
    filterIssues,
    sortIssuesBySc,
    filterTips,
    groupIssuesBySc,
    resolveSamplePage
  }
}
