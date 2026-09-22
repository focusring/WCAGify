import { describe, expect, it } from 'vitest'
import { rewriteUploadUrls } from '../../server/utils/share-uploads'

describe('rewriteUploadUrls', () => {
  it('points evidence at the token-scoped route so a share recipient can load it', () => {
    const issues = [{ body: { src: '/api/uploads/test-audit/focus-2-4-7-abc123.webp' } }]

    expect(rewriteUploadUrls(issues, 'test-audit', 'tok123')).toEqual([
      { body: { src: '/api/share/tok123/uploads/focus-2-4-7-abc123.webp' } }
    ])
  })

  it('leaves another report’s evidence alone, so a token cannot widen its reach', () => {
    const issues = [{ src: '/api/uploads/other-report/secret-1-1-1-abc123.webp' }]

    expect(rewriteUploadUrls(issues, 'test-audit', 'tok123')).toEqual(issues)
  })

  it('rewrites every occurrence, including several in one string', () => {
    const markdown =
      '![a](/api/uploads/test-audit/a-1-1-1-aaa.webp) and ![b](/api/uploads/test-audit/b-1-3-1-bbb.webp)'

    expect(rewriteUploadUrls(markdown, 'test-audit', 'tok123')).toBe(
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

    expect(rewriteUploadUrls(body, 'test-audit', 'tok123')).toEqual({
      value: [
        ['img', { src: '/api/share/tok123/uploads/deep-1-4-3-ccc.png' }],
        ['p', 'no url here']
      ]
    })
  })

  it('leaves values that are not strings untouched', () => {
    const input = { count: 42, flag: true, missing: null, nothing: undefined }

    expect(rewriteUploadUrls(input, 'test-audit', 'tok123')).toEqual(input)
  })
})
