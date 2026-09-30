import sharp from 'sharp'

type LocalFetch = (url: string, init?: RequestInit) => Promise<Response>

// The `src` value of an `<img>`.
const IMG_SRC_RE = /(?<=<img\b[^>]*?\ssrc=")[^"]+(?=")/g

// A4 with 20mm margins leaves about 170mm for an image: 1000px is ~150dpi there.
// The print stylesheet caps an image at 190mm high, which 1100px covers.
const MAX_WIDTH = 1000
const MAX_HEIGHT = 1100
const JPEG_QUALITY = 70
const CONCURRENCY = 6

/** Same-origin image paths (`/api/uploads/...`); protocol-relative and absolute URLs are left alone. */
function isLocalPath(src: string): boolean {
  return src.startsWith('/') && !src.startsWith('//')
}

async function toDataUri(src: string, localFetch: LocalFetch): Promise<string | undefined> {
  try {
    const response = await localFetch(src)
    if (!response.ok) return undefined
    const input = new Uint8Array(await response.arrayBuffer())
    // The first frame of an animated GIF, on white so transparency does not turn black.
    const jpeg = await sharp(input)
      .resize({ width: MAX_WIDTH, height: MAX_HEIGHT, fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toBuffer()
    return `data:image/jpeg;base64,${jpeg.toString('base64')}`
  } catch {
    return undefined
  }
}

/**
 * Embeds the report's own images (the issue screenshots) in the HTML as JPEG
 * data URIs, so the PDF shows them.
 *
 * WeasyPrint runs as a separate service: it receives the HTML without a base
 * URL and without the session cookie, so it can load neither the relative
 * `/api/uploads/...` paths nor the uploads route behind the admin login, and
 * printed each image's alt text in its place. The images are fetched here with
 * the same authenticated local fetch as the report page.
 *
 * They are downscaled to print resolution and re-encoded as JPEG, which the PDF
 * embeds as is. WebP and GIF would be stored as uncompressed pixels, and a
 * report can hold hundreds of screenshots. An image that cannot be loaded keeps
 * its original `src`, so WeasyPrint still falls back to its alt text.
 */
export async function inlineImages(html: string, localFetch: LocalFetch): Promise<string> {
  const sources = [
    ...new Set(Array.from(html.matchAll(IMG_SRC_RE), (match) => match[0]).filter(isLocalPath))
  ]
  if (sources.length === 0) return html

  const dataUris = new Map<string, string>()
  let next = 0
  async function worker(): Promise<void> {
    while (next < sources.length) {
      const src = sources[next++]!
      const dataUri = await toDataUri(src.replaceAll('&amp;', '&'), localFetch)
      if (dataUri) dataUris.set(src, dataUri)
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, sources.length) }, worker))

  return html.replace(IMG_SRC_RE, (src) => dataUris.get(src) ?? src)
}
