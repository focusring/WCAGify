type EarlOutcome =
  | 'earl:failed'
  | 'earl:passed'
  | 'earl:inapplicable'
  | 'earl:untested'
  | 'earl:cantTell'
type EarlMode = 'earl:manual' | 'earl:automatic' | 'earl:semiAuto'

interface EarlAssertor {
  '@id': string
  '@type': 'Assertor'
  title: string
}

interface EarlWebpage {
  '@id': string
  '@type': ['TestSubject', 'Webpage'] | ['TestSubject', 'Website']
  title: string
  description: string
}

interface EarlTestCriterion {
  '@id': string
  '@type': 'TestCriterion'
  title: string
  isPartOf: string[]
}

type EarlOutcomeTypeTag = 'Pass' | 'Fail' | 'CannotTell' | 'NotApplicable' | 'NotTested'

interface EarlOutcomeValue {
  '@id': EarlOutcome
  '@type': ['OutcomeValue', EarlOutcomeTypeTag]
}

interface EarlResult {
  '@type': 'TestResult'
  outcome: EarlOutcomeValue
  description?: string
}

interface EarlAssertion {
  '@id': string
  '@type': 'Assertion'
  assertedBy: string
  mode: EarlMode
  subject: EarlWebpage
  test: EarlTestCriterion
  result: EarlResult
  'wcagify:severity'?: string
  'wcagify:type'?: string
  'wcagify:difficulty'?: string
  'wcagify:issuePath'?: string
  'wcagify:sampleHint'?: string
}

interface EarlDefineScope {
  '@id': string
  scope: { '@id': string; title: string; description: string }
  conformanceTarget: string
  accessibilitySupportBaseline: string
  additionalEvaluationRequirements: string
  wcagVersion: string
}

interface EarlExploreTarget {
  '@id': string
  technologiesReliedUpon: { title: string }[]
  essentialFunctionality: string
  pageTypeVariety: string
}

interface EarlSelectSample {
  '@id': string
  structuredSample: EarlWebpage[]
  randomSample: EarlWebpage[]
}

interface EarlReportFindings {
  '@id': string
  title: string
  commissioner: string
  evaluator: string
  date: string
  summary: string
  evaluationSpecifics: string
  documentSteps: { '@id': string }[]
}

interface EarlDocument {
  '@context': Record<string, unknown>
  '@type': 'Evaluation'
  '@language': string
  reportToolVersion: string
  defineScope: EarlDefineScope
  exploreTarget: EarlExploreTarget
  selectSample: EarlSelectSample
  auditSample: EarlAssertion[]
  reportFindings: EarlReportFindings
}

export type {
  EarlDocument,
  EarlAssertor,
  EarlWebpage,
  EarlAssertion,
  EarlTestCriterion,
  EarlResult,
  EarlOutcome,
  EarlOutcomeValue,
  EarlMode,
  EarlDefineScope,
  EarlExploreTarget,
  EarlSelectSample,
  EarlReportFindings
}
