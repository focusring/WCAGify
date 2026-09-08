import type {
  WcagVersion,
  Language,
  Level,
  ScStatuses,
  IssueGroup,
  GuidelineGroup,
  PrincipleGroup,
  Principle
} from './types'
import {
  scName,
  scUri,
  guidelineName,
  allScEntries,
  levelIncludes,
  normalizeScStatuses,
  resolveScStatus
} from './wcag'

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

interface GroupByPrincipleOptions {
  wcagVersion?: WcagVersion
  language?: Language
  scStatuses?: ScStatuses
}

function groupIssuesByPrinciple<T extends { sc: string }>(
  issues: T[],
  targetLevel: Level,
  options: GroupByPrincipleOptions = {}
): PrincipleGroup<T>[] {
  const { wcagVersion = '2.2', language = 'en' } = options
  const scStatuses = normalizeScStatuses(options.scStatuses)
  const realIssues = filterIssues(issues)
  const issuesBySc = new Map<string, T[]>()
  for (const issue of realIssues) {
    const list = issuesBySc.get(issue.sc)
    if (list) list.push(issue)
    else issuesBySc.set(issue.sc, [issue])
  }

  const entries = allScEntries(wcagVersion, language)
  const includedLevels = levelIncludes[targetLevel]

  const principleMap: Record<string, Principle> = {
    '1': 'perceivable',
    '2': 'operable',
    '3': 'understandable',
    '4': 'robust'
  }

  const result: PrincipleGroup<T>[] = []

  for (const pNum of ['1', '2', '3', '4']) {
    const principle = principleMap[pNum]!
    const guidelinesMap = new Map<string, GuidelineGroup<T>>()

    const scCodes = Object.keys(entries)
      .filter((sc) => sc.startsWith(`${pNum}.`))
      .toSorted((a, b) => a.localeCompare(b, undefined, { numeric: true }))

    for (const sc of scCodes) {
      const entry = entries[sc]!
      if (entry.obsolete && wcagVersion === '2.2') continue
      if (!includedLevels.includes(entry.level)) continue

      const guidelineCode = sc.split('.').slice(0, 2).join('.')
      let guideline = guidelinesMap.get(guidelineCode)
      if (!guideline) {
        guideline = {
          guideline: guidelineCode,
          name: guidelineName(guidelineCode, wcagVersion, language),
          criteria: []
        }
        guidelinesMap.set(guidelineCode, guideline)
      }

      const scIssues = issuesBySc.get(sc) ?? []
      const status = resolveScStatus(sc, scIssues.length > 0, scStatuses)

      guideline.criteria.push({
        sc,
        name: scName(sc, wcagVersion, language),
        level: entry.level,
        uri: scUri(sc, wcagVersion, language),
        status,
        issues: scIssues
      })
    }

    const guidelinesList = [...guidelinesMap.values()].filter((g) => g.criteria.length > 0)

    if (guidelinesList.length > 0) {
      result.push({
        principle,
        number: Number(pNum),
        guidelines: guidelinesList
      })
    }
  }

  return result
}

export { filterIssues, sortIssuesBySc, filterTips, groupIssuesBySc, groupIssuesByPrinciple }
