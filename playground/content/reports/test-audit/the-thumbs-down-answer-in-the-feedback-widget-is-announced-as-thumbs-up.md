---
title: 'The thumbs-down answer in the feedback widget is announced as "thumbs up"'
sc: 1.1.1
severity: Medium
type: Content
difficulty: Low
sample: page-25
---

![The feedback widget "Wat vind je van deze informatie?" outlined above the footer on a phone, with two answer tiles, a thumbs-up and a thumbs-down.](/api/uploads/test-audit/the-thumbs-down-answer-in-the-feedback-widget-is-announced-as-thumbs-up-1-1-1-affc564b.webp)

The inline feedback widget **"Wat vind je van deze informatie?"** offers two answers, a thumbs-up and a thumbs-down drawing. Both images have `alt="thumbs up"` (the second one is `<img id="thumbs_down" alt="thumbs up" aria-label="thumbs up">`), and each radio button takes its name from its image. A screen reader reads the group as `radio "thumbs up"`, `radio "thumbs up"`. Blind users hear two identical answers and cannot give the negative answer on purpose. The name of the second radio also misstates its value, so this fails 4.1.2 for the same reason.

The widget is a Qualtrics survey (`feedback.abnamro.com`, survey `SV_dnEXAdGGjItZVWK`) embedded in the page. It renders with a phone browser, and there it sits at the bottom of every content page. The same answer pair was seen on page-2, page-6, page-10, page-12, page-13, page-15, page-18, page-19, page-22, page-24, page-25 and page-26 (on the English page as "Did you find this useful?").

#### Recommendation

In the Qualtrics survey editor, give each image a Dutch alternative that names the answer, and drop the duplicate `aria-label`:

    <img id="thumbs_up" alt="Ja, nuttig">
    <img id="thumbs_down" alt="Nee, niet nuttig">

Use the English equivalents ("Yes, useful" / "No, not useful") in the English survey ([H37](https://www.w3.org/WAI/WCAG22/Techniques/html/H37), [G94](https://www.w3.org/WAI/WCAG22/Techniques/general/G94)).
