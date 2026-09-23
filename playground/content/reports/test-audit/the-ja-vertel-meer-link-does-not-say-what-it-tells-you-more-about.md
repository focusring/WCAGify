---
title: 'The "Ja, vertel meer!" link does not say what it tells you more about'
sc: 2.4.4
severity: Low
type: Content
difficulty: Low
sample: page-12
---

![The block "Overstappen met de Overstapservice" with a photo on the left and, under the text on the right, a dark green button-styled link "Ja, vertel meer!" outlined in red.](/api/uploads/test-audit/the-ja-vertel-meer-link-does-not-say-what-it-tells-you-more-about-2-4-4-f3f84a7e.webp)

In the "Overstappen met de Overstapservice" block on the account-opening page, the button-styled link **"Ja, vertel meer!"** leads to the Overstapservice page. Its text and its `aria-label` are both just "Ja, vertel meer!" ("Yes, tell me more!"), which says nothing about the subject.

The link sits alone in its own `div.actions`: the heading "Overstappen met de Overstapservice" and the paragraph it answers are siblings outside it, not in the same list item, cell or `aria-describedby`. So the link has no programmatically determined context either. In a screen reader's list of links it reads as a bare "Ja, vertel meer!", and the user has to go back into the text to find out what it is about.

The same call to action on the payment-account page (page-13) has an `aria-label` that names its subject but misspells it, which breaks speech input; that is a separate issue, "The "Ja, vertel meer!" link's name glues "meer" and "over" together".

#### Recommendation

Name the destination in the link text itself, which helps every user:

    <a href="…/bankrekening-openen/overstappen.html">Ja, vertel meer over de Overstapservice</a>

If the short text must stay, tie the link to the block's heading with `aria-labelledby` pointing at both the link and the `h2` ([G91](https://www.w3.org/WAI/WCAG22/Techniques/general/G91), [ARIA7](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA7)).
