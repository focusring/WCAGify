import { queryCollection } from '@nuxt/content/server'
import { requireShare, verifyShareUnlock } from '../../utils/share-access'

export default defineEventHandler(async (event) => {
  const share = await requireShare(event)

  if (!verifyShareUnlock(event, share)) {
    return { passwordRequired: true, token: share.token }
  }

  const reportPath = `/reports/${share.report_slug}`

  const report = await queryCollection(event, 'reports').path(reportPath).first()
  if (!report) {
    throw createError({ statusCode: 404, statusMessage: 'Report not found' })
  }

  const issues = await queryCollection(event, 'issues')
    .where('path', 'LIKE', `${reportPath}/%`)
    .all()

  return { report, issues, token: share.token }
})
