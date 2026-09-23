---
title: 'The "Ja, vertel meer!" link''s name glues "meer" and "over" together'
sc: 2.5.3
severity: Low
type: Content
difficulty: Low
sample: page-13
---

![The "Gratis Overstapservice" block with a photo on the left and the dark green button-styled link "Ja, vertel meer!" outlined in red under the text.](/api/uploads/test-audit/the-ja-vertel-meer-link-s-name-glues-meer-and-over-together-2-5-3-024d1453.webp)

In the "Gratis Overstapservice" block on the payment-account page, the button-styled link reads **"Ja, vertel meer!"** on screen, but its `aria-label` is "Ja, vertel meerover de Overstapservice!". A missing space joins "meer" and "over" into one word.

The visible label is therefore not part of the accessible name: the name holds the word "meerover", not "meer". A speech-recognition user who says "klik Ja, vertel meer" may not reach the link, because the software matches whole words. The name's intent is right; only the space is missing.

The same call to action on the account-opening page (page-12) has the opposite problem: its name does not say what it is about. That is a separate issue, "The "Ja, vertel meer!" link does not say what it tells you more about".

#### Recommendation

Correct the CMS `aria-label`, keeping the visible text at the start of the name:

    <a href="…/overstappen.html" aria-label="Ja, vertel meer over de Overstapservice!">Ja, vertel meer!</a>

Or remove the `aria-label` and put the full wording in the visible text ([G208](https://www.w3.org/WAI/WCAG22/Techniques/general/G208)).
