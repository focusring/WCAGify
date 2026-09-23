---
title: The help toggles in the mortgage wizard and the login misreport their state
sc: 4.1.2
severity: Medium
type: Technical
sample: page-31
---

![The mortgage wizard step "Wat is uw leeftijd?" with the toggle "Waarom vragen jullie mijn leeftijd?" opened and its explanation shown below it.](/api/uploads/test-audit/the-help-toggles-in-the-mortgage-wizard-and-the-login-misreport-their-state-4-1-2-5ecaf734.webp)

The design system's `aab-accordion` renders the help toggles under each question of the mortgage wizard ("Waarom vragen jullie mijn leeftijd?", "Wat mag ik meerekenen bij mijn inkomen?", …) and "Kosten koper" on its result. Its button is `<a href="#" role="button" aria-controls="accordion-content">`, and it never carries a valid open or closed state:

- closed, the button has **no `aria-expanded` at all**; open, it has `aria-expanded=""`, which is not a valid value. The browser exposes no state either way. The only hint is the word "Expand" or "Collapse" in the button's name;
- in "Kosten koper" the state is put on two `span` elements (`slot="cta-expand"`, `slot="cta-collapse"`) that have no role, where `aria-expanded` is not allowed (axe `aria-allowed-attr`).

A screen-reader user hears "button" and cannot tell whether the explanation is open.

The same component on the login page (page-3), "Hulp nodig bij het inloggen?", fails the other way round. It toggles `aria-expanded="false"` and `"true"` correctly, but the closed panel `div#accordion-content` is hidden only by `max-height: 0; overflow: hidden`. The steps "Inloggen met een QR-code" and the link "Kunt u niet inloggen? Bekijk alle hulp" stay in the accessibility tree while the button says the panel is collapsed.

#### Recommendation

Always set `aria-expanded` to `"true"` or `"false"` on the button itself, and hide the closed panel from everyone:

    <button type="button" aria-expanded="false" aria-controls="accordion-content">Waarom vragen jullie mijn leeftijd?</button>
    <div id="accordion-content" hidden>…</div>

In lit that is `aria-expanded=${String(this.open)}` rather than a boolean attribute binding. Remove `aria-expanded` from the slotted spans, and keep any height animation on an inner wrapper ([ARIA disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/), [G108](https://www.w3.org/WAI/WCAG22/Techniques/general/G108)).
