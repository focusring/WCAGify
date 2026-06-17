import type { BackgroundInfo, MediaInfo } from './types'
import { formatLayer, hasCssMask, splitOuterCommas, tryParseColor } from './css-utils'
import { parseGradient } from './gradient'
import { extractMediaFormat, videoFormat } from './media'

// First url(...) layer of a computed background-image, unquoted; '' when there is none.
function firstBackgroundUrl(bgImage: string): string {
  for (const layer of splitOuterCommas(bgImage)) {
    const m = /^url\((['"]?)([\s\S]*?)\1\)/i.exec(layer.trim())
    if (m?.[2]) return m[2]
  }
  return ''
}

// Background image as { kind, format }, reusing extractMediaFormat (allow-list + data: parsing). null when the
// background-image has no url() layer (e.g. gradient only).
function bgImageMedia(bgImage: string): MediaInfo | null {
  const url = firstBackgroundUrl(bgImage)
  return url ? { kind: 'image', format: extractMediaFormat(url) } : null
}

// A blur() in filter or backdrop-filter.
function hasBlur(el: Element): boolean {
  const style = getComputedStyle(el)
  const backdrop =
    style.getPropertyValue('backdrop-filter') || style.getPropertyValue('-webkit-backdrop-filter')
  return /\bblur\(/i.test(style.filter) || /\bblur\(/i.test(backdrop)
}

// CSS background-image can't reference a <video>; "background videos" are absolutely/fixed-positioned <video>s layered
// behind content. Heuristic: a positioned <video> that doesn't contain el, covers el's centre, and is at least as large as el. Best-effort — won't catch every layering technique.
function findBackgroundVideo(el: Element): MediaInfo | null {
  const r = el.getBoundingClientRect()
  if (r.width === 0 || r.height === 0) return null
  const cx = r.left + r.width / 2
  const cy = r.top + r.height / 2
  for (const video of document.querySelectorAll('video')) {
    if (video.contains(el) || el.contains(video)) continue
    const pos = getComputedStyle(video).position
    if (pos !== 'absolute' && pos !== 'fixed') continue
    const vr = video.getBoundingClientRect()
    if (cx < vr.left || cx > vr.right || cy < vr.top || cy > vr.bottom) continue
    if (vr.width * vr.height < r.width * r.height) continue
    return { kind: 'video', format: videoFormat(video) }
  }
  return null
}

// Structured description of the first visible background behind el. Walks parent → <html>, recording the top most background image/gradient and the first solid color behind it, then stops (that color backs everything below).
// Falls back to a layered background <video> when there's no CSS image/gradient. Skips CSS-mask elements.
export function getBackgroundInfo(el: Element): BackgroundInfo {
  let color = ''
  let media: MediaInfo | null = null
  let gradient: BackgroundInfo['gradient'] = null
  let blur = hasBlur(el)

  for (let current: Element | null = el.parentElement; current; current = current.parentElement) {
    if (!hasCssMask(current)) {
      const style = getComputedStyle(current)
      const bgImage = style.backgroundImage
      if (bgImage && bgImage !== 'none') {
        if (!media) media = bgImageMedia(bgImage)
        if (!gradient) gradient = parseGradient(bgImage)
      }
      if (!color) {
        const c = tryParseColor(style.backgroundColor)
        if (c && c.a > 0) color = formatLayer(c)
      }
      if (hasBlur(current)) blur = true
      if (color) break
    }
    if (current === document.documentElement) break
  }

  if (!media && !gradient) media = findBackgroundVideo(el)

  return { color, media, gradient, blur }
}
