/**
 * Node-only entry point for importing EARL documents: parsing needs jsonld.js
 * and writing touches the content directory, so this is kept apart from the
 * browser-safe `@focusring/wcagify/earl` entry.
 */
export {
  parseEarlReport,
  listImportedIssues,
  selectImportedIssues,
  criterionFromIri,
  outcomeStatus
} from './parse'
export { writeImportedReport, reportFrontmatter, mergeFrontmatter } from './write'
export type {
  EarlImport,
  ImportedReport,
  ImportedIssue,
  ImportedIssueSummary,
  ParseEarlOptions
} from './parse'
export type { ImportMode, WriteImportOptions, WriteImportResult } from './write'
