import type { WcagVersion, Language, IssueGroup } from './types'
import { scName, scUri } from './wcag'

function filterIssues<T extends { sc: string }>(issues: T[]): T[] {
  return issues.filter((issue) => issue.sc !== 'none')
}

function sortIssuesBySc<T extends { sc: string }>(issues: T[]): T[] {
  return issues.toSorted((a, b) => a.sc.localeCompare(b.sc, undefined, { numeric: true }))
}

function filterTips<T extends { sc: string }>(issues: T[]): T[] {
  return issues.filter((issue) => issue.sc === 'none')
}

function groupIssuesBySc<T extends { sc: string }>(
  issues: T[],
  wcagVersion: WcagVersion = '2.2',
  language: Language = 'en'
): IssueGroup<T>[] {
  const sorted = sortIssuesBySc(filterIssues(issues))
  const groups: IssueGroup<T>[] = []
  const seen = new Map<string, number>()

  for (const issue of sorted) {
    const idx = seen.get(issue.sc)
    if (idx !== undefined) {
      groups[idx]!.issues.push(issue)
    } else {
      seen.set(issue.sc, groups.length)
      groups.push({
        sc: issue.sc,
        name: scName(issue.sc, wcagVersion, language),
        uri: scUri(issue.sc, wcagVersion, language),
        issues: [issue]
      })
    }
  }
  return groups
}

export { filterIssues, sortIssuesBySc, filterTips, groupIssuesBySc }
