import {
  scUri,
  scName,
  scorecard,
  conformanceSummary,
  scorecardByLevel,
  PRINCIPLES,
  guidelineName,
  filterIssues,
  sortIssuesBySc,
  filterTips,
  groupIssuesBySc,
  groupIssuesByPrinciple,
  resolveSamplePage
} from '@focusring/wcagify-reporter'

export function useWcagData() {
  return {
    scUri,
    scName,
    scorecard,
    conformanceSummary,
    scorecardByLevel,
    PRINCIPLES,
    guidelineName,
    filterIssues,
    sortIssuesBySc,
    filterTips,
    groupIssuesBySc,
    groupIssuesByPrinciple,
    resolveSamplePage
  }
}
