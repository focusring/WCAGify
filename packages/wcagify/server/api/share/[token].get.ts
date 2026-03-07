import { queryCollection } from '@nuxt/content/server'
import { getShareByToken, verifySignedToken } from '../../utils/shares'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')

  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Missing token' })
  }

  const share = getShareByToken(token)
  if (!share) {
    throw createError({ statusCode: 404, statusMessage: 'Share link not found or expired' })
  }

  if (share.password_hash) {
    const unlockCookie = getCookie(event, `share-unlock-${token}`)
    const verifiedToken = unlockCookie ? verifySignedToken(unlockCookie, share.password_hash) : null
    if (verifiedToken !== token) {
      return { passwordRequired: true, token }
    }
  }

  const reportPath = `/reports/${share.report_slug}`

  const report = await queryCollection(event, 'reports').path(reportPath).first()
  if (!report) {
    throw createError({ statusCode: 404, statusMessage: 'Report not found' })
  }

  const issues = await queryCollection(event, 'issues')
    .where('path', 'LIKE', `${reportPath}/%`)
    .all()

  return { report, issues, token }
})
