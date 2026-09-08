export { buildEarlReport, earlFileName, criterionTestId } from './build'
export { buildEarlContext, WCAG_SPEC_NS, WCAGIFY_NS } from './context'
export { minimarkToText } from './minimark'
export type {
  EarlReport,
  EarlReportSource,
  EarlIssueSource,
  EarlExportOptions,
  EarlAssertion,
  EarlTestResult,
  EarlOutcome
} from './build'
export type { MinimarkBody, MinimarkNode, MinimarkElement } from './minimark'
