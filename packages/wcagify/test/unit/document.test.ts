import { describe, it, expect } from 'vitest'
import { issueDocumentSchema, reportDocumentSchema } from '../../src/index'

const body = {
  type: 'minimark',
  value: [
    ['p', {}, ['img', { src: '/api/uploads/acme/hero-1-1-1-0a1b2c3d.png', alt: 'The hero' }]],
    ['h4', { id: 'recommendation' }, 'Recommendation'],
    ['pre', { className: ['shiki'], language: 'html' }, ['code', {}, '<img src="hero.png">']],
    ['style', {}, '.ct-1{--shiki-light:#24292e}']
  ],
  toc: { title: '', searchDepth: 2, depth: 2, links: [] }
}

const report = {
  title: 'WCAG audit Acme customer portal',
  description: 'Accessibility audit of Acme customer portal against WCAG 2.2 level AA.',
  path: '/reports/acme-customer-portal',
  language: 'en',
  evaluation: {
    evaluator: 'focusring',
    commissioner: 'Acme B.V.',
    target: 'Acme customer portal',
    targetLevel: 'AA',
    targetWcagVersion: '2.2',
    date: '2026-10-08',
    specialRequirements: 'None'
  },
  scope: ['https://app.acme.example/login'],
  outOfScope: ['The admin area'],
  baseline: ['macOS with Safari and VoiceOver'],
  technologies: ['HTML', 'CSS', 'JavaScript'],
  sample: [
    {
      title: 'Login',
      id: 'page-1',
      url: 'https://app.acme.example/login',
      description: 'The login page'
    }
  ],
  scStatuses: { 'not-present': ['1.2.1'] },
  body
}

const issue = {
  title: 'The hero image has no text alternative',
  path: '/reports/acme-customer-portal/image-without-alt',
  sc: '1.1.1',
  sample: 'page-1',
  severity: 'High',
  body
}

const nuxtContentFields = {
  id: 'reports/reports/acme-customer-portal/index.md',
  stem: 'reports/acme-customer-portal/index',
  extension: 'md',
  seo: { title: 'WCAG audit Acme customer portal' },
  meta: {},
  navigation: true
}

describe('reportDocumentSchema', () => {
  it('accepts a report as Nuxt Content returns it and keeps only what the renderer reads', () => {
    expect(reportDocumentSchema.parse({ ...report, ...nuxtContentFields })).toStrictEqual(report)
  })

  it('accepts a report without a description', () => {
    const { description: _, ...withoutDescription } = report

    expect(reportDocumentSchema.parse(withoutDescription)).toStrictEqual(withoutDescription)
  })

  it('still checks the frontmatter as reportSchema does', () => {
    expect(reportDocumentSchema.safeParse({ ...report, language: 'de' }).success).toBe(false)
    expect(
      reportDocumentSchema.safeParse({
        ...report,
        evaluation: { ...report.evaluation, targetLevel: 'AAAA' }
      }).success
    ).toBe(false)
  })

  it('requires a title', () => {
    expect(reportDocumentSchema.safeParse({ ...report, title: '  ' }).success).toBe(false)
    const { title: _, ...untitled } = report
    expect(reportDocumentSchema.safeParse(untitled).success).toBe(false)
  })

  it('requires the path of a report folder', () => {
    for (const path of [
      '/reports/acme-customer-portal/image-without-alt',
      '/reports/',
      '/acme-customer-portal',
      '/reports/Acme Portal',
      '/reports/../admin'
    ]) {
      expect(reportDocumentSchema.safeParse({ ...report, path }).success, path).toBe(false)
    }
  })

  it('requires a minimark body', () => {
    for (const invalid of [
      '# Markdown',
      { type: 'root', children: [] },
      { type: 'minimark', value: [[42, {}]] },
      { type: 'minimark', value: [['p', 'text']] }
    ]) {
      expect(reportDocumentSchema.safeParse({ ...report, body: invalid }).success).toBe(false)
    }
  })
})

describe('issueDocumentSchema', () => {
  it('accepts an issue as Nuxt Content returns it and keeps only what the renderer reads', () => {
    expect(issueDocumentSchema.parse({ ...issue, ...nuxtContentFields })).toStrictEqual(issue)
  })

  it('accepts a tip', () => {
    expect(issueDocumentSchema.parse({ ...issue, sc: 'none' })).toMatchObject({ sc: 'none' })
  })

  it('reports an empty title at its path', () => {
    const result = issueDocumentSchema.safeParse({ ...issue, title: '' })

    expect(result.error?.issues).toStrictEqual([expect.objectContaining({ path: ['title'] })])
  })

  it('requires the path of a file inside a report folder', () => {
    for (const path of ['/reports/acme-customer-portal', '/reports/acme-customer-portal/', '/x']) {
      expect(issueDocumentSchema.safeParse({ ...issue, path }).success, path).toBe(false)
    }
  })

  it('still checks the frontmatter as issueSchema does', () => {
    expect(issueDocumentSchema.safeParse({ ...issue, severity: 'Critical' }).success).toBe(false)
    const { sample: _, ...withoutSample } = issue
    expect(issueDocumentSchema.safeParse(withoutSample).success).toBe(false)
  })
})
