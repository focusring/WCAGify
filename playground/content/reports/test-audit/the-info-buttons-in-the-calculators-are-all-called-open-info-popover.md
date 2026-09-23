---
title: 'The info buttons in the calculators are all called "Open info-popover"'
sc: 4.1.2
severity: Low
type: Technical
sample: page-20
---

![The loan calculator with the info popover beside "Waarvoor wil je geld lenen?" open, a dark box headed "Leendoel" with a close cross, explaining that the loan purpose sets the maximum loan term.](/api/uploads/test-audit/the-info-buttons-in-the-calculators-are-all-called-open-info-popover-4-1-2-ad6d964e.webp)

The `aab-info-popover` component that puts an (i) button beside a calculator question gives every one of them the same name. In the loan calculator, the buttons beside "Waarvoor wil je geld lenen?", "Hoeveel wil je lenen?" and "Kies de gewenste looptijd" are all **"Open info-popover"**, and the dialogs they open are all `role="dialog" aria-label="Meer informatie"`. A screen-reader user meets three identical buttons and learns the topic only after opening one. The distinguishing text, such as "Informatiewisselknop voor Waarvoor wil je geld lenen?", sits in an `aria-label` on the role-less `aab-info-popover` host, where the attribute is not allowed and assistive technology need not announce it. The button has no `aria-expanded`; its state shows only as the name changing to "Sluit info-popover".

Inside an open popover, Tab alternates between the close button and an invisible focus sentinel, `<div id="popover-end-trap" tabindex="0" aria-hidden="true">`, 0 px high. Every second Tab lands on it and stays there. Nothing on screen shows where focus is (this also fails 2.4.7), and a screen reader announces nothing, because `aria-hidden` removes the element from the tree.

Also in the mortgage-rate tool (page-15): seven buttons, beside "Kies een hypotheeksoort" and six fixed-rate periods, are all "Open info-popover", and their dialog is named "popover". The "Woonbudget" dialog in the mortgage wizard (page-31) is named "popover" as well.

#### Recommendation

Put the subject on the button, name each dialog from its heading, and drop the `aria-label` from the host:

    <aab-icon id="info-button" role="button" tabindex="0" aria-haspopup="dialog"
              aria-expanded="false" aria-label="Uitleg leendoel"></aab-icon>
    <div role="dialog" aria-labelledby="popover-heading">
      <h4 id="popover-heading">Leendoel</h4>…
    </div>

Make the end sentinel send focus back to the close button when it receives it, or keep Tab inside the popover with a `keydown` handler. A focusable element must never be `aria-hidden` ([ARIA14](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA14), [ARIA16](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA16)).
