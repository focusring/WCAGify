---
title: 'The loan calculator shows nothing, and says nothing, until a purpose is chosen'
sc: 3.3.1
severity: Medium
type: Technical
sample: page-20
---

![The loan calculator with none of the three purposes chosen and 15.000 in the amount field. The space to the right, where the result appears, is empty, and no message says what is missing.](/api/uploads/test-audit/the-loan-calculator-shows-nothing-and-says-nothing-until-a-purpose-is-chosen-3-3-1-b0c9ec9d.webp)

The loan calculator needs a loan purpose ("<span lang="nl">Waarvoor wil je geld lenen?</span>") before it shows the monthly costs. A user who enters a valid amount, such as 15.000, and moves on without choosing a purpose gets no result and no explanation. The result panel stays hidden, and there is no message, no `aria-invalid` and no mark on the radios. The calculator does work out the amounts in the background; it only withholds them.

The message "Je hebt nog geen "Waarvoor wil je geld lenen?" ingevuld" exists, but it appears only after keyboard focus has passed through the radios and left them without a choice. Anyone who clicks or taps straight into the amount field, which is where the real question seems to be, is never told what is missing. Once a purpose is chosen, the result appears at once.

#### Recommendation

When a valid amount has been entered and no purpose is chosen, show the existing message in place of the result, and link it to the radio group:

    <div role="radiogroup" aria-labelledby="radio-5-label" aria-describedby="radio-error-5">…</div>
    <p id="radio-error-5">Je hebt nog geen "Waarvoor wil je geld lenen?" ingevuld</p>

Preselecting a purpose, or calculating without one, would also remove the problem ([G83](https://www.w3.org/WAI/WCAG22/Techniques/general/G83)).
