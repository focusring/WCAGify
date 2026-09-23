---
title: The Prive and Zakelijk tabs of the login are not tied to their panels
sc: 4.1.2
severity: Medium
type: Technical
sample: page-3
---

![The login card with the tabs "Prive" and "Zakelijk" at the top, "Zakelijk" underlined as chosen, above the panel "Log in met QR-code".](/api/uploads/test-audit/the-prive-and-zakelijk-tabs-of-the-login-are-not-tied-to-their-panels-4-1-2-537fb92b.webp)

The login card's tabs **"Prive"** and **"Zakelijk"** are built across a shadow-DOM boundary, so the tabs and their panels cannot refer to each other:

- the panel `div#panel-IB[role="tabpanel"]` is in the page with `aria-labelledby="IB"`, but the tab `button#IB` sits inside the shadow root of `aab-tabs`, where an id reference cannot reach. The panel has **no accessible name**; the same holds for `div#panel-IBB` under "Zakelijk";
- both tabs carry an empty `aria-controls=""`, so no tab points at its panel either;
- `<aab-tabs aria-label="Prive">` puts a name on a custom element with no role. It shows up as an unnamed-role wrapper called "Prive", which changes to "Zakelijk" with the chosen tab.

A screen-reader user hears a nameless "tab panel" and cannot tell from it whether they are logging in as a private or a business customer.

#### Recommendation

Keep the tablist and the panels in one tree: render the panels inside the shadow root of `aab-tabs`, or the tabs in the page. Then connect them by id and name the tablist itself:

    <div role="tablist" aria-label="Soort klant">
      <button role="tab" id="IB" aria-controls="panel-IB" aria-selected="true">Prive</button>
    </div>
    <div role="tabpanel" id="panel-IB" aria-labelledby="IB">…</div>

([ARIA Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/), [ARIA16](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA16)).
