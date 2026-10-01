import { issueDocumentSchema, reportDocumentSchema } from '@focusring/wcagify-reporter'
import { issues, report } from '../report'

// Validated on the server only, so the client bundle carries no schemas.
export default defineNuxtPlugin(() => {
  useState('report', () => ({
    report: reportDocumentSchema.parse(report),
    issues: issueDocumentSchema.array().parse(issues)
  }))
})
