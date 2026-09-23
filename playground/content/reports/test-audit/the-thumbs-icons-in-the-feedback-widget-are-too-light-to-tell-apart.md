---
title: The thumbs icons in the feedback widget are too light to tell apart
sc: 1.4.11
severity: Medium
type: Design
difficulty: Low
sample: page-9
---

![The question "Wat vind je van deze informatie?" above two white tiles with light teal thumbs-up and thumbs-down drawings; only the small cuff of each hand is dark.](/api/uploads/test-audit/the-thumbs-icons-in-the-feedback-widget-are-too-light-to-tell-apart-1-4-11-f58e3192.webp)

The two answers of the feedback widget **"Wat vind je van deze informatie?"** have no visible text: each radio shows only a thumbs-up or thumbs-down drawing. The hand is painted `#66c7c0` on the white tile, a contrast of **2.00:1** against the required 3:1. Only the small cuff is dark enough (`#00716b`, 5.88:1). Take the light part away, as the criterion's test does, and what is left is two small dark rectangles: users with low vision cannot see which answer is "up" and which is "down". The tiles add nothing either, white on the `#f3f3f3` page (1.11:1).

The widget is a Qualtrics survey embedded in the page. It appears at the bottom of every content page with a phone browser (on this page also at 1280 px), and was seen on page-2, page-6, page-9, page-12, page-13, page-18, page-19, page-22, page-24, page-25 and page-26. The wrong text alternative of the same icons is a separate issue.

#### Recommendation

Draw the whole hand in a colour with at least 3:1 against white, for example the `#00716b` already used for the cuff (5.88:1). Visible labels such as "Nuttig" / "Niet nuttig" next to the icons would also solve it, and help everyone ([G207](https://www.w3.org/WAI/WCAG22/Techniques/general/G207)).
