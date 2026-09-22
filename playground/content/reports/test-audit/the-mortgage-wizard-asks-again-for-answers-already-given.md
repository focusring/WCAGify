---
title: The mortgage wizard asks again for answers already given
sc: 3.3.7
severity: Medium
type: Technical
sample: page-31
---

![The income question in the extended wizard, with an empty field, after an income had already been entered in the calculator on the previous page.](/api/uploads/test-audit/the-mortgage-wizard-asks-again-for-answers-already-given-3-3-7-8f89c138.webp)

The mortgage calculation runs across two pages. On the first (page-14) the visitor chooses whether they are buying alone or together and enters a gross annual income. Pressing **"Reken verder"** carries them to the extended wizard on this page — which asks **both questions again, with empty fields**.

"Koopt u alleen of samen?" comes back unanswered at 2%, and "Wat is uw bruto inkomen per jaar?" comes back empty at 27%. Neither is pre-filled, and neither offers the earlier answer as a choice.

WCAG 3.3.7 allows re-asking only where the information is essential to re-enter, where it is needed for security, or where the earlier answer is no longer valid. None of those applies: this is the same calculation continuing, moments later, in the same session.

Re-entering a figure is a small cost for most people and a real one for anyone who types slowly, uses speech input, or has to find the source document again.

Within this page the wizard behaves correctly — pressing "Vorige" keeps what was entered — so the gap is specifically at the hand-over between the two pages.

#### Recommendation

Pass the answers the first calculator already collected into the wizard and pre-fill them, leaving the user free to change them:

    Alleen/samen: prefilled from step 1
    Bruto jaarinkomen: € 45.000   [wijzig]

If pre-filling is not possible, offer the previous answer for selection rather than asking for it from scratch ([G221](https://www.w3.org/WAI/WCAG22/Techniques/general/G221)).
