---
title: Closing the feedback survey with Escape sends focus to the top of the page
sc: 2.4.3
severity: Medium
type: Technical
sample: page-6
---

![The feedback survey panel open on a phone, with the close cross focused at the top right above "Met jouw tips en suggesties verbeteren wij de website".](/api/uploads/test-audit/closing-the-feedback-survey-with-escape-sends-focus-to-the-top-of-the-page-2-4-3-359b7a9e.webp)

![After Escape the panel is gone and the focus ring sits on the skip link at the top left of the page header, far from the "Feedback" tab on the right.](/api/uploads/test-audit/closing-the-feedback-survey-with-escape-sends-focus-to-the-top-of-the-page-2-4-3-3e176d58.webp)

Press Enter on the fixed **"Feedback"** tab: the survey panel opens and focus moves to its close button, which is correct. Enter on the close button closes the panel and returns focus to "Feedback", also correct. But **Escape** on the close button closes the panel and sends focus to the skip link "<span lang="nl">Ga naar hoofdinhoud</span>", the first stop of the page. "Feedback" is the last stop of the page, so a keyboard user who dismisses the survey with Escape is thrown back to the top and must tab through the whole page to get back.

The tab and its survey are supplied by Qualtrics. The tab appears on every content page with a phone browser; it was seen on page-2, page-3, page-6, page-9, page-10, page-13, page-16, page-18, page-22, page-24 and page-26.

#### Recommendation

Return focus to the "Feedback" button whichever way the panel is closed, Escape included, in the Qualtrics intercept settings or the wrapper script that opens it:

    closePanel(); document.getElementById('QSIFeedbackButton-btn').focus();

([G59](https://www.w3.org/WAI/WCAG22/Techniques/general/G59), [F85](https://www.w3.org/WAI/WCAG22/Techniques/failures/F85))
