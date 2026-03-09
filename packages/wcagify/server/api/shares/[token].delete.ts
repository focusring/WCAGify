import { deleteShare } from '../../utils/shares'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')

  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Missing token' })
  }

  const body = await readBody<{ deleteToken?: string }>(event)
  if (!body?.deleteToken) {
    throw createError({ statusCode: 400, statusMessage: 'Missing deleteToken' })
  }

  const deleted = deleteShare(token, body.deleteToken)
  if (!deleted) {
    throw createError({ statusCode: 403, statusMessage: 'Invalid delete token or share not found' })
  }

  setResponseStatus(event, 204)
  return ''
})
