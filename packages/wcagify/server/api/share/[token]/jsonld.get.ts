import { loadEarlExport, sendEarlExport } from '../../../utils/earl'
import { requireShare, verifyShareUnlock } from '../../../utils/share-access'

export default defineEventHandler(async (event) => {
  const share = await requireShare(event)

  if (!verifyShareUnlock(event, share)) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { earl, filename } = await loadEarlExport(event, `/reports/${share.report_slug}`)
  return sendEarlExport(event, earl, filename)
})
