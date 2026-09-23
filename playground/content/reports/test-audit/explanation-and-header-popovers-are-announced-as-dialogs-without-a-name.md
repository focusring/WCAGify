---
title: Explanation and header popovers are announced as dialogs without a name
sc: 4.1.2
severity: Low
type: Technical
difficulty: Low
sample: page-25
---

![The chat page with the "Openingstijden" popover open and outlined in red. It starts with the heading "Openingstijden", followed by the chat opening hours.](/api/uploads/test-audit/explanation-and-header-popovers-are-announced-as-dialogs-without-a-name-4-1-2-e7bf6133.webp)

The popovers built with the shared PrimeVue popover component are marked up as modal dialogs, `div[role="dialog"][aria-modal="true"]`, but **none of them has an accessible name**: no `aria-label` and no `aria-labelledby`. On this page the **"Openingstijden"** popover opens from the ⓘ after "Openingstijden" and starts with a visible heading of that name, yet the accessibility tree shows only a bare `dialog`.

When focus moves into one of these popovers, a screen-reader user hears that a dialog has opened and nothing about what it is. The keyboard handling is correct (focus moves in, Tab stays inside, Escape closes and returns focus), so only the purpose is lost on entry.

The same component, with the same gap, is used for:

- the glossary explanations beside terms in the text, such as "Cookies" (page-10), "Kifid" (page-8) and "Bankrekening" (page-12);
- the **"Taal"** and **"Kies Segment"** popovers of the phone-width header (page-4, page-7, page-9), which have no visible heading at all.

#### Recommendation

Name each dialog from its own heading, or, where there is none, from the button that opens it:

    <div role="dialog" aria-modal="true" aria-labelledby="popover-title-12">
      <h4 id="popover-title-12">Openingstijden</h4> …
    </div>

    <div role="dialog" aria-modal="true" aria-label="Taal kiezen"> …

See [ARIA16](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA16).
