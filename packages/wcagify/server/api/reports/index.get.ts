import { queryCollection } from '@nuxt/content/server'

export default defineEventHandler(async (event) => {
  const reports = await queryCollection(event, 'reports').all()

  return reports.map((report) => ({
    slug: report.path?.replace('/reports/', '') ?? '',
    title: report.title ?? '',
    sample: report.sample ?? [],
    wcagVersion: report.evaluation?.targetWcagVersion ?? '2.2',
    targetLevel: report.evaluation?.targetLevel ?? 'AA'
  }))
})
