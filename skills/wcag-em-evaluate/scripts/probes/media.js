// Audio, video and embedded players on the current page, for 1.2.1 to 1.2.9, 1.4.2, 1.4.7.
// Run against the open page:  agent-browser eval --stdin < media.js
// Track kinds and autoplay flags are facts. The evaluator hears whether the audio has speech.
// The evaluator also sees whether the video carries information.
/* oxlint-disable unicorn/consistent-function-scoping, unicorn/no-null */
;(() => {
  const clean = (text) => (text || '').replace(/\s+/g, ' ').trim()
  const cssPath = (el) => {
    const parts = []
    let node = el
    while (node && node.nodeType === 1 && parts.length < 6) {
      let part = node.localName
      if (node.id) {
        parts.unshift(`${part}#${CSS.escape(node.id)}`)
        break
      }
      const siblings = node.parentElement
        ? [...node.parentElement.children].filter((s) => s.localName === node.localName)
        : []
      if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(node) + 1})`
      parts.unshift(part)
      node = node.parentElement
    }
    return parts.join(' > ')
  }
  const providerOf = (src) => {
    if (!src) return null
    if (/youtube(?:-nocookie)?\.com|youtu\.be/.test(src)) return 'youtube'
    if (/vimeo\.com/.test(src)) return 'vimeo'
    if (/soundcloud\.com/.test(src)) return 'soundcloud'
    if (/spotify\.com/.test(src)) return 'spotify'
    if (/player|video|media|embed/.test(src)) return 'other-player'
    return null
  }
  const alternativeNear = (el) => {
    const figure = el.closest('figure')
    const caption = figure ? clean(figure.querySelector('figcaption')?.textContent) : ''
    const scope = el.closest('figure, section, article, div') || el.parentElement
    const link = scope
      ? [...scope.querySelectorAll('a[href], button')].find((a) =>
          /transcri|tekst|text version|audio ?descri|beschrijving|ondertitel|caption/i.test(
            a.textContent
          )
        )
      : null
    return caption || (link ? clean(link.textContent) : null) || null
  }
  const media = []
  for (const el of document.querySelectorAll('video, audio')) {
    const sources = [
      el.currentSrc || el.getAttribute('src'),
      ...[...el.querySelectorAll('source')].map((s) => s.getAttribute('src'))
    ].filter(Boolean)
    media.push({
      kind: el.localName,
      selector: cssPath(el),
      sources: [...new Set(sources)],
      provider: providerOf(sources[0]),
      autoplay: el.autoplay || el.hasAttribute('autoplay'),
      playing: !el.paused && !el.ended,
      muted: el.muted,
      loop: el.loop,
      controls: el.controls,
      duration: Number.isFinite(el.duration) ? Math.round(el.duration) : null,
      tracks: [...el.querySelectorAll('track')].map((t) => ({
        kind: t.kind || 'subtitles',
        srclang: t.srclang || null,
        label: t.label || null
      })),
      audioTracks: el.audioTracks ? el.audioTracks.length : null,
      poster: el.getAttribute('poster') || null,
      textAlternativeNearby: alternativeNear(el)
    })
  }
  for (const el of document.querySelectorAll('iframe, embed, object')) {
    const src = el.getAttribute('src') || el.getAttribute('data') || ''
    const provider = providerOf(src)
    if (!provider) continue
    media.push({
      kind: 'embed',
      selector: cssPath(el),
      sources: [src],
      provider,
      autoplay: /autoplay=1|autoplay=true/.test(src),
      playing: null,
      muted: /mute=1|muted=1/.test(src),
      loop: /loop=1/.test(src),
      controls: !/controls=0/.test(src),
      duration: null,
      tracks: [],
      audioTracks: null,
      poster: null,
      title: el.getAttribute('title') || null,
      textAlternativeNearby: alternativeNear(el)
    })
  }
  const animatedImages = [...document.querySelectorAll('img')]
    .filter((img) => /\.(?:gif|apng|webp)(?:\?|$)/i.test(img.currentSrc || img.src || ''))
    .map((img) => ({ selector: cssPath(img), src: img.currentSrc || img.src }))
  return {
    url: location.href,
    media,
    animatedImages,
    counts: {
      video: media.filter((m) => m.kind === 'video').length,
      audio: media.filter((m) => m.kind === 'audio').length,
      embeds: media.filter((m) => m.kind === 'embed').length,
      autoplaying: media.filter((m) => m.autoplay && !m.muted).length,
      withoutCaptions: media.filter(
        (m) =>
          m.kind === 'video' &&
          !m.tracks.some((t) => t.kind === 'captions' || t.kind === 'subtitles')
      ).length,
      withoutDescriptions: media.filter(
        (m) => m.kind === 'video' && !m.tracks.some((t) => t.kind === 'descriptions')
      ).length
    }
  }
})()
