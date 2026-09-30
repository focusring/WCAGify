import { describe, it, expect, vi } from 'vitest'
import sharp from 'sharp'
import { inlineImages } from '../../../src/pdf/images'

async function png(width: number, height: number): Promise<Blob> {
  const buffer = await sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 128, b: 0, alpha: 0.5 } }
  })
    .png()
    .toBuffer()
  return new Blob([new Uint8Array(buffer)])
}

function decode(dataUri: string): Buffer {
  return Buffer.from(dataUri.replace('data:image/jpeg;base64,', ''), 'base64')
}

describe('inlineImages', () => {
  it('embeds local images as JPEG data URIs downscaled to print width', async () => {
    const localFetch = vi.fn(async () => new Response(await png(2000, 1000)))
    const html = '<p><img src="/api/uploads/r/shot.png" alt="Shot" class="w-full"></p>'

    const result = await inlineImages(html, localFetch)

    expect(localFetch).toHaveBeenCalledWith('/api/uploads/r/shot.png')
    const src = result.match(/src="([^"]+)"/)![1]!
    expect(src).toMatch(/^data:image\/jpeg;base64,/)
    expect(result).toContain('alt="Shot" class="w-full"')
    const meta = await sharp(decode(src)).metadata()
    expect(meta.format).toBe('jpeg')
    expect(meta.width).toBe(1000)
    expect(meta.height).toBe(500)
  })

  it('fetches an image used more than once only once', async () => {
    const localFetch = vi.fn(async () => new Response(await png(10, 10)))
    const html = '<img src="/a.png" alt=""><img src="/a.png" alt="">'

    const result = await inlineImages(html, localFetch)

    expect(localFetch).toHaveBeenCalledTimes(1)
    expect(result.match(/data:image\/jpeg/g)).toHaveLength(2)
  })

  it('leaves external, data and unloadable images as they are', async () => {
    const localFetch = vi.fn(async () => new Response('missing', { status: 404 }))
    const html =
      '<img src="https://example.com/a.png" alt=""><img src="data:image/png;base64,AA" alt="">' +
      '<img src="//cdn.example.com/b.png" alt=""><img src="/api/uploads/r/gone.png" alt="Gone">'

    const result = await inlineImages(html, localFetch)

    expect(localFetch).toHaveBeenCalledTimes(1)
    expect(result).toBe(html)
  })
})
