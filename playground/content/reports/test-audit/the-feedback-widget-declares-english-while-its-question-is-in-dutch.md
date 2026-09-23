---
title: The feedback widget declares English while its question is in Dutch
sc: 3.1.2
severity: Low
type: Technical
difficulty: Low
sample: page-25
---

![The feedback widget outlined on a phone, with the Dutch question "Wat vind je van deze informatie?" and two thumbs tiles.](/api/uploads/test-audit/the-feedback-widget-declares-english-while-its-question-is-in-dutch-3-1-2-d2ac3885.webp)

The inline feedback widget **"Wat vind je van deze informatie?"** is a separate document in a frame. That document declares `<html lang="en">` and its title is "Customer feedback element", while the text a user must understand is Dutch: the question itself, "Verplicht", and the landmark name "Klantfeedback element". A screen reader follows the declared language, so it reads the Dutch question with English pronunciation rules. The answer names ("thumbs up") are English too, which mixes both languages in one small widget.

The widget is a Qualtrics survey (`feedback.abnamro.com`, survey `SV_dnEXAdGGjItZVWK`). It renders with a phone browser at the bottom of every Dutch content page; the same frame was seen on page-6, page-12, page-13, page-15, page-18, page-19, page-22, page-24 and page-25.

#### Recommendation

Set the survey language to Dutch in Qualtrics, so the frame is served with `<html lang="nl">`, a Dutch title such as "Klantfeedback", and Dutch answer names. Any English text that must stay gets its own `lang="en"` ([H57](https://www.w3.org/WAI/WCAG22/Techniques/html/H57), [H58](https://www.w3.org/WAI/WCAG22/Techniques/html/H58)).
