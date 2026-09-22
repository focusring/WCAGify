---
title: The link in the cookie banner is only distinguishable by its colour
sc: 1.4.1
severity: Medium
type: Design
difficulty: Low
sample: page-1
---

![The cookie banner text shown in greyscale, where the word "cookiestatement" is indistinguishable from the sentence around it.](/api/uploads/test-audit/the-link-in-the-cookie-banner-is-only-distinguishable-by-its-colour-1-4-1-18f63a77.webp)

The consent banner explains what the bank does with cookies and links to the **cookiestatement** from inside that sentence. The link is marked only by being teal: it has **no underline, the same weight, the same size, the same style and the same font** as the prose around it.

Measured against the surrounding text, the link colour `rgb(0,113,107)` differs from the body colour `rgb(34,34,34)` by **2.71:1** — below the 3:1 that WCAG requires when colour is the only thing setting a link apart from its paragraph. In a greyscale rendering the word disappears into the sentence entirely.

Anyone who cannot distinguish teal from near-black — with a colour vision deficiency, on a poor screen, or in bright sunlight — has no way to tell that part of the sentence is a link, on the one banner every visitor to the site meets.

The link's own text contrast is fine at 5.88:1 against white; this is specifically about telling it apart from the text around it.

The same pattern is in the preference centre's description (`p#ot-pc-desc > a`), and the banner is on every page of the site.

#### Recommendation

Underline the link, which is the simplest fix and needs no colour change:

    #onetrust-policy-text a, #ot-pc-desc a { text-decoration: underline; }

If an underline is unwanted, raise the contrast between the link colour and the body text to at least 3:1 **and** add a non-colour cue on hover and focus ([G183](https://www.w3.org/WAI/WCAG22/Techniques/general/G183), [F73](https://www.w3.org/WAI/WCAG22/Techniques/failures/F73)).
