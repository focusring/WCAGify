import { z } from 'zod'
import type { Level, ScStatuses, Scorecard, WcagVersion } from './types'
import { groupIssuesByPrinciple } from './issues'
import { scorecardByLevel } from './wcag'

const levels = ['A', 'AA', 'AAA'] as const satisfies Level[]
const wcagVersions = ['2.0', '2.1', '2.2'] as const satisfies WcagVersion[]

/* The schemas are built in pure immediately invoked functions; see `schemas.ts`. */

const teaserCountsSchema = /* @__PURE__ */ (() =>
  z.strictObject({
    conforming: z.int().min(0),
    failed: z.int().min(0),
    total: z.int().min(0)
  }))()

const levelSchema = /* @__PURE__ */ (() => z.enum(levels))()
const levelCountsSchema = /* @__PURE__ */ (() =>
  teaserCountsSchema.extend({ level: levelSchema }))()

/**
 * What a reader may see of a report before they get the report itself: the
 * number of findings and how many success criteria conform, per level and in
 * total. Strict, so a stored teaser cannot carry titles, criteria or other
 * report content.
 */
const teaserSchema = /* @__PURE__ */ (() =>
  z.strictObject({
    wcagVersion: z.enum(wcagVersions),
    targetLevel: levelSchema,
    findings: z.int().min(0),
    levels: z.array(levelCountsSchema),
    total: teaserCountsSchema
  }))()

type Teaser = z.output<typeof teaserSchema>

interface TeaserReport {
  evaluation: { targetLevel: Level; targetWcagVersion: WcagVersion }
  scStatuses?: ScStatuses | null
}

function teaserCounts(scorecard: Scorecard) {
  return {
    conforming: scorecard.conforming.all,
    failed: scorecard.failed.all,
    total: scorecard.totals.all
  }
}

/**
 * Summarises a report for its target level and WCAG version, as plain JSON.
 *
 * Findings are the issues the report lists under a success criterion of the
 * target, counted the way `ReportContent` groups them: tips (`sc: none`) and
 * issues against a criterion outside the target version or level are left out.
 * The scores are those of the report's scorecard (`scorecardByLevel`), with
 * its `Map` turned into an array so the teaser survives JSON.
 *
 * Takes only the target, the criterion statuses and each issue's criterion,
 * so nothing else of the report can end up in a teaser.
 */
function reportTeaser(report: TeaserReport, issues: { sc: string }[]): Teaser {
  const { targetLevel, targetWcagVersion: wcagVersion } = report.evaluation
  const options = { wcagVersion, scStatuses: report.scStatuses }
  const findings = groupIssuesByPrinciple(issues, targetLevel, options)
    .flatMap((principle) => principle.guidelines)
    .flatMap((guideline) => guideline.criteria)
    .reduce((count, criterion) => count + criterion.issues.length, 0)
  const byLevel = scorecardByLevel(issues, targetLevel, options)

  return {
    wcagVersion,
    targetLevel,
    findings,
    levels: byLevel.levels.map((level) => ({
      level,
      ...teaserCounts(byLevel.perLevel.get(level)!)
    })),
    total: teaserCounts(byLevel.total)
  }
}

export { reportTeaser, teaserSchema }
export type { Teaser, TeaserReport }
