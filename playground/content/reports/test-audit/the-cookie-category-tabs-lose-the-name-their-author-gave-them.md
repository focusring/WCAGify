---
title: The cookie category tabs lose the name their author gave them
sc: 4.1.2
severity: Low
type: Technical
difficulty: Low
sample: page-26
---

![The English cookie centre with its column of four category tabs on the left, "Your privacy" to "Personal cookies", and the "Your privacy" panel on the right.](/api/uploads/test-audit/the-cookie-category-tabs-lose-the-name-their-author-gave-them-4-1-2-f3571769.webp)

The four category tabs in the cookie settings sit in a `ul.ot-cat-grp[role="tablist"]`, wrapped in a `div.ot-tab-list`. The name meant for the tab list, **"Cookie Categories"** ("Cookiecategorieën" on the Dutch pages), is put on that wrapper `div` as `aria-label`, but the `div` has no role.

`aria-label` is not allowed on an element without a role, so browsers and screen readers ignore it (axe `aria-prohibited-attr`), and the real tab list is exposed without a name. A screen-reader user entering the tabs hears "tab list" with nothing saying what the tabs are for. On page-10 the category panels also have no name once a category tab is selected, while the "Jouw privacy" panel is named correctly.

This is the OneTrust consent component, which is on every page. Also recorded on page-1, page-2, page-4, page-10 and page-12.

#### Recommendation

Move the name to the element that carries the role, and name the panels from their tabs:

    <ul class="ot-cat-grp" role="tablist" aria-label="Cookiecategorieën">…</ul>
    <div role="tabpanel" id="ot-desc-id-C0003" aria-labelledby="ot-header-id-C0003">…</div>

and remove `aria-label` from `div.ot-tab-list` ([ARIA14](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA14), [ARIA16](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA16)).
