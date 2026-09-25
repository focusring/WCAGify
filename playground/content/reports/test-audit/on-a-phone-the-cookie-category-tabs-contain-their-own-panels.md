---
title: On a phone the cookie category tabs contain their own panels
sc: 1.3.1
severity: Medium
type: Technical
sample: page-10
---

![The cookie centre at phone width. The four category tabs are stacked, and the "Persoonlijke cookies" panel, with its text, its switch and the "Bekijk lijst van partners" button, opens between the tabs inside the list, outlined in red.](/api/uploads/test-audit/on-a-phone-the-cookie-category-tabs-contain-their-own-panels-1-3-1-9de4ff7a.webp)

At phone width (390 pixels) the cookie settings turn their four category tabs into a stacked list and open each category's panel directly under its tab. To do that, OneTrust moves the `div[role="tabpanel"]` (the category text, the consent switch and the "<span lang="nl">Bekijk lijst van partners</span>" button) **inside the `li` of its tab**, within `ul.ot-cat-grp[role="tablist"]`.

A tab list may only contain tabs. With the panels inside it, the structure that assistive technology receives no longer matches what is shown: the panel content, including the one consent switch, becomes part of the tab list. Screen readers may flatten it into the list of tabs or skip it when the user moves between tabs. axe reports this as a failure (`aria-required-children`: "Element has children which are not allowed: [role=tabpanel]"). At desktop width the panel sits outside the list and the check passes.

This is the OneTrust consent component, which is on every page. Also found on page-11 at phone width.

#### Recommendation

Keep the `tabpanel` elements outside the `role="tablist"` element at every width and position them with CSS. If the narrow layout is meant to be an accordion, drop the tab roles there and make each category heading a disclosure button:

    <h3><button aria-expanded="true" aria-controls="ot-desc-id-C0003">Persoonlijke cookies</button></h3>
    <div id="ot-desc-id-C0003">…</div>

See [G115](https://www.w3.org/WAI/WCAG22/Techniques/general/G115) and the ARIA [tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) and [disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) patterns.
