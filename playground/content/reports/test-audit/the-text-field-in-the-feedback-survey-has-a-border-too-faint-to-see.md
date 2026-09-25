---
title: The text field in the feedback survey has a border too faint to see
sc: 1.4.11
severity: Medium
type: Design
difficulty: Low
sample: page-9
---

![Enlarged part of the feedback survey. Under "Kun je hier meer over vertellen?" is an empty text field outlined only by a very light grey line, with "0/500" below it.](/api/uploads/test-audit/the-text-field-in-the-feedback-survey-has-a-border-too-faint-to-see-1-4-11-f507a39a.webp)

Open the **"Feedback"** tab at the right edge of the screen. The survey that opens asks "<span lang="nl">Kun je hier meer over vertellen?</span>" above an empty text field. The field has no fill; its only boundary is a 1 px border `#cccccc` on the white panel, a contrast of **1.61:1** against the required 3:1. Users with low vision may not find where to type. The select above it has the same border but passes, because its dark chevron and its visible value "<span lang="nl">Selecteer er één</span>" identify it.

The survey is supplied by Qualtrics and opens from the fixed "Feedback" tab, which appears on every content page with a phone browser. The survey was opened on page-2, page-3, page-6, page-9, page-10, page-13, page-18, page-22 and page-24 and is the same everywhere.

#### Recommendation

In the Qualtrics survey theme, give the form fields a border of at least `#949494` on white (3.03:1), for example `#767676` (4.54:1):

    textarea, select { border: 1px solid #767676; }

([G207](https://www.w3.org/WAI/WCAG22/Techniques/general/G207))
