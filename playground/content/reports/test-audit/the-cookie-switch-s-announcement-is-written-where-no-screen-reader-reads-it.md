---
title: "The cookie switch's announcement is written where no screen reader reads it"
sc: 4.1.2
severity: Low
type: Technical
difficulty: Low
sample: page-18
---

![The cookie centre on the "Persoonlijke cookies" tab with the category switch just turned on. Nothing else on screen changes.](/api/uploads/test-audit/the-cookie-switch-s-announcement-is-written-where-no-screen-reader-reads-it-4-1-2-8e882e8b.webp)

Toggle the **"Persoonlijke cookies"** switch in the cookie settings. OneTrust then writes `aria-label="Persoonlijke cookies"` onto an empty, invisible `span.ot-scrn-rdr` that has `aria-live="assertive"` but no role, and clears the attribute again one to three seconds later. No text is ever put inside the span.

`aria-label` is not allowed on an element without a role, and a live region announces content that is added to it, not a change of attribute. So the announcement OneTrust apparently intends does not reach assistive technology, and the markup is invalid while it lasts (axe `aria-prohibited-attr`). The impact is small: the switch is a native checkbox and exposes its new checked state itself.

This is the OneTrust consent component, which is on every page. Also found on page-19. Checks run at other moments miss it because the attribute is only there for a moment after each toggle.

#### Recommendation

Put the announcement inside the live region as text, or remove the span and rely on the checkbox's own state:

    <span class="ot-scrn-rdr" aria-live="assertive" aria-atomic="true">Persoonlijke cookies aan</span>

Do not set `aria-label` on the generic element ([ARIA22](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA22), [ARIA19](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA19)).
