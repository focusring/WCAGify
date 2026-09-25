---
title: Starting a video with its play overlay drops keyboard focus
sc: 2.4.3
severity: Medium
type: Technical
sample: page-11
---

![The video "Een kijkje achter de schermen" before playback, with a focus ring around the large round play button in the middle of the poster.](/api/uploads/test-audit/starting-a-video-with-its-play-overlay-drops-keyboard-focus-2-4-3-9c67de8d.webp)

![The same video playing after Enter; the play button has gone and no focus ring is visible anywhere on the page.](/api/uploads/test-audit/starting-a-video-with-its-play-overlay-drops-keyboard-focus-2-4-3-8e4e55bb.webp)

The video component places a large play button, **"<span lang="nl">Afspelen video</span>"**, over the poster. Tab reaches it and shows a focus ring. Enter or Space starts the video, the button hides itself (`display: none`) and `document.activeElement` becomes `BODY`. The control that had focus is gone and nothing takes its place.

At that moment there is no focus indicator on the page and a screen reader has nothing to announce, so the user does not know where they are. In Chrome the next Tab happens to land on the video's own controls, but browsers that restart from the document send the user back to the top of the page. Pressing Space to pause, a natural next step, scrolls the page instead. When playback is paused the button comes back.

Reproduced on the payments page (page-11, by Enter and by Space), the app page (page-18, by Enter and by Space) and the mortgage-interest page (page-15, by Enter); it is the same video component on all three.

#### Recommendation

When the overlay starts playback, move focus to the video's own play/pause control or to the `<video>` element:

    playButton.addEventListener('click', () => { video.play(); playButton.hidden = true; video.focus(); });

Alternatively keep the button visible as a pause toggle whose name follows its state ("<span lang="nl">Pauzeer video</span>") ([G59](https://www.w3.org/WAI/WCAG22/Techniques/general/G59), [F85](https://www.w3.org/WAI/WCAG22/Techniques/failures/F85)).
