---
title: "The mortgage-amount slider's white handle has no edge against the white card"
sc: 1.4.11
severity: Medium
type: Design
difficulty: Low
sample: page-31
---

![The mortgage-amount slider set to its minimum. The whole track is light grey and the white round handle at its left end can barely be made out against the white card.](/api/uploads/test-audit/the-mortgage-amount-slider-s-white-handle-has-no-edge-against-the-white-card-1-4-11-040cdf69.webp)

In **"Hypotheekbedrag aanpassen"** on the mortgage result, the amount is set with a slider (`input[type=range]` in `aab-slider`). Its handle is a white disc with only a faint drop shadow, about 1.2:1 against the white card, and no border. It gets a teal ring only while it has keyboard focus. With the pointer, or once focus has moved on, the handle's position is shown only by where the teal part of the track ends.

At the minimum value there is no teal part, so nothing of the slider reaches 3:1: the handle is about 1.2:1 and the empty track `#dedede` is 1.35:1. Low-vision users cannot find the handle to grab it or read its position. The same component on the loan calculator (page-20) gives its handle a `#00716b` border, so this is a missing style, not a design choice. Whether the empty track itself must reach 3:1 is an open question for page-20, page-21 and this slider.

#### Recommendation

Give the handle a permanent border of at least 3:1, as page-20's slider has:

    input[type=range]::-webkit-slider-thumb { border: 2px solid #00716b; }
    input[type=range]::-moz-range-thumb     { border: 2px solid #00716b; }

([G207](https://www.w3.org/WAI/WCAG22/Techniques/general/G207))
