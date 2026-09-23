---
title: 'The "Bekijk de plannen" link on the home page does not say which plans'
sc: 2.4.4
severity: Low
type: Content
difficulty: Low
sample: page-1
---

![The home page block "Prinsjesdag 2026, de ins en outs" with a photo of the Binnenhof, a summary paragraph and the button-styled link "Bekijk de plannen" outlined in red.](/api/uploads/test-audit/the-bekijk-de-plannen-link-on-the-home-page-does-not-say-which-plans-2-4-4-ef942840.webp)

The Prinsjesdag block on the home page ends in the button-styled link **"Bekijk de plannen"**. Its name says only that there are plans to look at, not which plans or where the link goes.

For a sighted reader the heading "Prinsjesdag 2026: de ins en outs" and the paragraph above explain it, but neither is link context in the code. The link sits alone in a `div`, the heading and paragraph are siblings two levels up, and the wrapping `<section>` has no accessible name. A screen-reader user who moves through the page by links, or lists them, hears "Bekijk de plannen" without the topic. The cards further down the page ("Meld je aan", "Bekijk onze samenwerking") do this right: they sit in regions named after their heading.

#### Recommendation

Put the topic in the link text:

    <a href="…/prinsjesdag…">Bekijk de plannen van Prinsjesdag 2026</a>

Or, as the other cards do, name the section from its heading so the heading becomes the link's context: `<section aria-labelledby="prinsjesdag-title">` with that `id` on the heading ([G91](https://www.w3.org/WAI/WCAG22/Techniques/general/G91), [ARIA7](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA7)).
