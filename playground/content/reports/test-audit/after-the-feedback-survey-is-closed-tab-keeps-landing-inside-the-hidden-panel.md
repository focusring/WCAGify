---
title: 'After the feedback survey is closed, Tab keeps landing inside the hidden panel'
sc: 4.1.2
severity: Medium
type: Technical
sample: page-22
---

![On a phone, the "Feedback" tab is opened and closed with Enter, then Tab is pressed eight times. The survey panel stays out of sight and no visible element on the page receives focus.](/api/uploads/test-audit/after-the-feedback-survey-is-closed-tab-keeps-landing-inside-the-hidden-panel-4-1-2-95e636da.gif)

Open the survey from the fixed **"Feedback"** tab and close it again. The panel collapses to a height of 0 and gets `aria-hidden="true"`, but its content stays focusable: the survey frame `iframe#QSIFeedbackButton-survey-iframe`, the helper `div#QSIFeedbackButton-invisible-div` (`tabindex="0"`) and the close button, which Qualtrics' own focus loop keeps including. axe reports this as `aria-hidden-focus`.

The effect for a keyboard user: from "Feedback", 14 presses of Tab all landed inside the invisible panel (11 on the empty frame, 3 on the close button) and never reached the page again. Focus is invisible the whole time, and a screen reader lands on elements it has been told are hidden. Shift+Tab does get back to "Feedback". Before the panel has been opened once, Tab moves on normally. This also breaks the focus order (2.4.3).

The tab and survey are supplied by Qualtrics and appear on every content page with a phone browser. The same closed-panel state was confirmed on page-24; the tab was also seen on page-2, page-3, page-6, page-9, page-10, page-13, page-16, page-18 and page-26.

#### Recommendation

When the panel closes, take its content out of the tab order, not only out of the accessibility tree, and release the focus loop:

    const panel = document.getElementById('QSIFeedbackButton-pullup-container');
    panel.inert = true;   // on close; set false again when it opens

`display: none` on the closed panel works as well ([ACT rule 6cfa84](https://www.w3.org/WAI/standards-guidelines/act/rules/6cfa84/), [ARIA dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)).
