import { loadEarlExport, sendEarlExport } from '../../utils/earl'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')?.replace(/\.jsonld$/, '')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing report slug' })
  }

  const { earl, filename } = await loadEarlExport(event, `/reports/${slug}`)
  return sendEarlExport(event, earl, filename)
})
