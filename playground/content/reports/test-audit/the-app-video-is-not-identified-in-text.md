---
title: The app video is not identified in text
sc: 1.1.1
severity: Medium
type: Technical
difficulty: Low
sample: page-18
---

![The video in the page before playback, showing a poster image of a person holding a phone with a large round play button over it.](/api/uploads/test-audit/the-app-video-is-not-identified-in-text-1-1-1-fe4f462f.webp)

The `<video>` element in the "Waarom anderen vertrouwen op de ABN AMRO app" section carries **no accessible name**: no `aria-label`, no `title`, no `aria-labelledby` and no `<figure>`/`<figcaption>`. Its only child text is the fallback paragraph that a modern browser never renders.

Assistive technology announces it as an unlabelled media element, so a user moving through the page by elements is told there is a video but not what it contains.

The heading and introduction do sit immediately before it in the same section, which softens the effect for anyone reading the page in order — that is why this is recorded as Medium rather than High. It does not help a user who reaches the element directly.

The overlay play button is named correctly ("Afspelen video") and is not part of this issue.

#### Recommendation

Name the element from the heading that already introduces it:

    <video aria-labelledby="tcm-105922-heading" controls>…</video>

Or give it its own label — `aria-label="Video: waarom anderen vertrouwen op de ABN AMRO app"` ([G100](https://www.w3.org/WAI/WCAG22/Techniques/general/G100), [ARIA6](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA6)).

The same component is already doing this correctly elsewhere: the video on the payments page (page-11) carries `aria-label="Video waarbij je een kijkje achter de schermen van ABN AMRO krijgt"` and passes. Copying that usage is enough.
