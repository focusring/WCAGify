type ImportWarningCode =
  | 'missing-title'
  | 'missing-evaluator'
  | 'missing-date'
  | 'missing-scope'
  | 'missing-sample'
  | 'unknown-wcag-version'
  | 'unknown-level'
  | 'unknown-sc'
  | 'orphan-subject'
  | 'unsupported-outcome'
  | 'assertion-dropped'

interface ImportWarning {
  code: ImportWarningCode
  message: string
  context?: Record<string, string | number | undefined>
}

export type { ImportWarning, ImportWarningCode }
