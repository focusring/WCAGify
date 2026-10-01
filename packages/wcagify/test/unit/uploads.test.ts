import { describe, expect, it } from 'vitest'
import { rewriteUploadUrls } from '../../src/index'

const from = '/api/uploads/test-audit/'
const to = '/api/share/tok123/uploads/'

describe('rewriteUploadUrls', () => {
  it('points evidence at the token-scoped route so a share recipient can load it', () => {
    const issues = [{ body: { src: '/api/uploads/test-audit/focus-2-4-7-abc123.webp' } }]

    expect(rewriteUploadUrls(issues, from, to)).toEqual([
      { body: { src: '/api/share/tok123/uploads/focus-2-4-7-abc123.webp' } }
    ])
  })

  it('leaves another report’s evidence alone, so a token cannot widen its reach', () => {
    const issues = [{ src: '/api/uploads/other-report/secret-1-1-1-abc123.webp' }]

    expect(rewriteUploadUrls(issues, from, to)).toEqual(issues)
  })

  it('rewrites every occurrence, including several in one string', () => {
    const markdown =
      '![a](/api/uploads/test-audit/a-1-1-1-aaa.webp) and ![b](/api/uploads/test-audit/b-1-3-1-bbb.webp)'

    expect(rewriteUploadUrls(markdown, from, to)).toBe(
      '![a](/api/share/tok123/uploads/a-1-1-1-aaa.webp) and ![b](/api/share/tok123/uploads/b-1-3-1-bbb.webp)'
    )
  })

  it('walks nested arrays and objects, because an issue body is a content tree', () => {
    const body = {
      value: [
        ['img', { src: '/api/uploads/test-audit/deep-1-4-3-ccc.png' }],
        ['p', 'no url here']
      ]
    }

    expect(rewriteUploadUrls(body, from, to)).toEqual({
      value: [
        ['img', { src: '/api/share/tok123/uploads/deep-1-4-3-ccc.png' }],
        ['p', 'no url here']
      ]
    })
  })

  it('leaves values that are not strings untouched', () => {
    const input = { count: 42, flag: true, missing: null, nothing: undefined }

    expect(rewriteUploadUrls(input, from, to)).toEqual(input)
  })

  it('rewrites a whole report and its issues to any target prefix, leaving the input as it was', () => {
    const snapshot = {
      report: { path: '/reports/test-audit', body: { value: [['p', {}, 'Summary']] } },
      issues: [
        {
          path: '/reports/test-audit/hero',
          body: { value: [['img', { src: '/api/uploads/test-audit/hero-1-1-1-aaa.png' }]] }
        }
      ]
    }
    const original = structuredClone(snapshot)

    const rewritten = rewriteUploadUrls(snapshot, from, '/api/r/')

    expect(rewritten.issues[0]!.body.value).toEqual([['img', { src: '/api/r/hero-1-1-1-aaa.png' }]])
    expect(rewritten.report).toEqual(snapshot.report)
    expect(snapshot).toEqual(original)
  })
})
