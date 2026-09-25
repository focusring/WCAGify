---
title: 'The address search field in the mortgage wizard''s "add a house" step has no name'
sc: 4.1.2
severity: Medium
type: Technical
difficulty: Low
sample: page-31
---

![The mortgage wizard step "Wat is het adres van de woning?" with its empty search field outlined in red and the hint "Zoek op straatnaam en huisnummer" under it.](/api/uploads/test-audit/the-address-search-field-in-the-mortgage-wizard-s-add-a-house-step-has-no-name-4-1-2-9041aa1b.webp)

On the mortgage result, **"<span lang="nl">Voeg een woning toe</span>"** starts a branch whose first step asks "<span lang="nl">Wat is het adres van de woning?</span>". Its search field (`input#searchInput`, `type="search"`) has no `<label>`, no `aria-label`, no `aria-labelledby` and an empty placeholder. axe reports it as `label` (critical), and the accessibility tree shows a bare "search box".

Screen-reader users who reach the first field of the branch hear "search box" and nothing else. The question is only the step's heading, and the hint "<span lang="nl">Zoek op straatnaam en huisnummer</span>" sits in a separate `status` element tied to nothing. This is a different component from the calculator fields whose labels point at the wrong id.

#### Recommendation

Name the field after its question and tie the hint to it:

    <h2 id="address-question">Wat is het adres van de woning?</h2>
    <input id="searchInput" type="search" aria-labelledby="address-question"
           aria-describedby="address-hint">
    <p id="address-hint">Zoek op straatnaam en huisnummer</p>

([ARIA16](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA16), [ARIA1](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA1), [H44](https://www.w3.org/WAI/WCAG22/Techniques/html/H44))
