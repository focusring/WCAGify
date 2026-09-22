---
title: The mobile menu button points at a panel that does not exist
sc: 4.1.2
severity: Low
type: Technical
difficulty: Low
sample: page-7
---

![The site header at phone width with the menu open, showing the navigation panel below the hamburger button.](/api/uploads/test-audit/the-mobile-menu-button-points-at-a-panel-that-does-not-exist-4-1-2-a8dc8824.webp)

At phone widths the header shows a hamburger button (`button#hamburgerMenu`) that opens the navigation. It carries `aria-controls="navigation-dropdown-mobile"`, and **no element with that id exists in the document**. The panel it actually opens is `#mobileMenu`.

Assistive technology that follows `aria-controls` to reach the panel finds nothing. The button's name, role and `aria-expanded` state are all correct, so the menu remains usable — only the relationship is broken, which is why this is recorded as a low-severity defect rather than a blocking one.

It only appears below the mega-menu breakpoint, so a desktop-only test will not see it. It was confirmed at phone widths on page-1, page-5, page-6, page-7, page-11, page-18, page-19, page-21, page-24, page-26, page-27, page-28, page-29 and page-30 — the shared header on every page in the audit.

#### Recommendation

Point the attribute at the panel that is rendered, or remove it — `aria-expanded` alone is enough for a disclosure button:

    <button id="hamburgerMenu" aria-expanded="false" aria-controls="mobileMenu">Menu</button>

See the [ARIA Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) and [ARIA16](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA16).
