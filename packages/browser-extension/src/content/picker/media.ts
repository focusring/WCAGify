import type { MediaInfo } from './types'

const MEDIA_FORMATS = new Set([
  'png',
  'jpg',
  'jpeg',
  'webp',
  'gif',
  'svg',
  'avif',
  'bmp',
  'ico',
  'apng',
  'mp4',
  'webm',
  'ogg',
  'ogv',
  'mov',
  'm4v'
])

// A MIME subtype normalized to a known media format, stripping structured-syntax suffixes (svg+xml → svg). '' when the subtype is absent or unrecognized.
function normalizeMediaSubtype(subtype: string | undefined): string {
  const norm = subtype?.split('+')[0]?.toLowerCase() ?? ''
  return MEDIA_FORMATS.has(norm) ? norm : ''
}

// Lowercase file format from a URL or data: URI, '' if absent/unrecognized. URLs: last path segment's extension (query/hash stripped). Data URIs: the MIME subtype (image/svg+xml → svg).
export function extractMediaFormat(src: string): string {
  if (!src) return ''
  if (src.startsWith('data:')) {
    return normalizeMediaSubtype(/^data:[a-z]+\/([a-z0-9.+-]+)/i.exec(src)?.[1])
  }
  const path = src.split(/[?#]/)[0] ?? ''
  const segment = path.slice(path.lastIndexOf('/') + 1)
  const dot = segment.lastIndexOf('.')
  if (dot === -1) return ''
  const ext = segment.slice(dot + 1).toLowerCase()
  return MEDIA_FORMATS.has(ext) ? ext : ''
}

// Pulls a format from a <source>'s `type` (e.g. "video/mp4" → mp4) or its `src` extension.
function sourceFormat(source: HTMLSourceElement): string {
  const fromType = normalizeMediaSubtype(
    /\/([a-z0-9.+-]+)/i.exec(source.getAttribute('type') ?? '')?.[1]
  )
  if (fromType) return fromType
  return extractMediaFormat(source.getAttribute('src') ?? '')
}

// A <video>'s format from its src/currentSrc extension, falling back to its <source> children's type/src.
export function videoFormat(video: HTMLVideoElement): string {
  let format = extractMediaFormat(video.currentSrc || video.src)
  for (const source of video.querySelectorAll('source')) {
    if (format) break
    format = sourceFormat(source)
  }
  return format
}

// Informational descriptor for raster/video elements, which have no styleable fill/color. Returns kind + detected format ('' when undeterminable), or null when el is not an <img>/<video>.
export function getMediaInfo(el: Element): MediaInfo | null {
  if (el instanceof HTMLImageElement) {
    return { kind: 'image', format: extractMediaFormat(el.currentSrc || el.src) }
  }
  if (el instanceof HTMLVideoElement) {
    return { kind: 'video', format: videoFormat(el) }
  }
  return null
}
