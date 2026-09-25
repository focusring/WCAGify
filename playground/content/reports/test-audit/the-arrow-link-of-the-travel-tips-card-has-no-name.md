---
title: The arrow link of the travel tips card has no name
sc: 2.4.4
severity: Medium
type: Technical
difficulty: Low
sample: page-19
---

![The card "Lees onze tips over reizen en je verzekeringen" on the travel insurance page, with a round dark-green arrow button at its right end outlined in red.](/api/uploads/test-audit/the-arrow-link-of-the-travel-tips-card-has-no-name-2-4-4-5793f35d.webp)

On the travel insurance page the card **"<span lang="nl">Lees onze tips over reizen en je verzekeringen</span>"** links to the travel tips with a 44 by 44 pixel arrow at its right end. That arrow is the whole link: an `<a>` with `aria-label=""` around an unnamed `<svg>`. The sentence of the card is a separate paragraph outside the link.

The link therefore has **no accessible name**. A screen reader announces only "link", in the tab order and in the list of links, and a speech-input user has nothing to say to follow it. axe reports it (`link-name`) in every state tested, at desktop and phone width. Having no name, it also fails 4.1.2 (Name, Role, Value).

#### Recommendation

Put the card's sentence inside the link, or name the arrow from it, and never ship an empty `aria-label`:

    <p id="tips-reizen" class="emc-h3">Lees onze tips over reizen en je verzekeringen</p>
    <a href="/nl/prive/verzekeren/artikelen/reisverzekering/index.html" aria-labelledby="tips-reizen">
      <svg aria-hidden="true" …></svg>
    </a>

([ARIA16](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA16), [H30](https://www.w3.org/WAI/WCAG22/Techniques/html/H30)).
