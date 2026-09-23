---
title: The open mobile menu is wider than the screen and hides its close button
sc: 1.4.10
severity: High
type: Technical
sample: page-16
---

![The open menu at 320 px wide. The items Producten, Je situatie, App en Internet Bankieren and Service en Contact are shown, but there is no close button, no Menu button and no row arrows, because the right-hand part of the menu lies beyond the edge of the screen.](/api/uploads/test-audit/the-open-mobile-menu-is-wider-than-the-screen-and-hides-its-close-button-1-4-10-2336713c.webp)

On the interest-rates page, opening the menu at phone width lays the menu out **699 px wide** inside a 320, 393 or 640 px screen, and the page cannot be scrolled sideways to reach the rest.

The cause is the scroll lock. Opening the menu sets `body` to `position: fixed; top: 0` (classes `emc-fixed emc-top-0`) without a width. A fixed box without a width shrinks to fit its content, and on this page the 603 px savings table sets that to 698.8 px, so body, header and menu all become that wide. At 320 px and on an iPhone (393 px) **"Sluiten" and the "Menu" button are both off screen**, so the open menu shows no way to close it. The row arrows are gone, and the "Bankrekening openen" promotion in the Producten level is cut off mid-word. At 640 px (200 % zoom) the close cross and the arrows are lost.

Page-12 has the same header without a wide table and shows the menu intact, so any page with wide content will do the same. This makes the menu unusable at 400 % zoom and on a phone for anyone who needs its close control.

Text spacing triggers the same cause on pages without wide content, which also fails 1.4.12. On the energy-saving tips article (page-27) the body shrinks to the longest word of the h1, "energiebespaartips": 333 px at 320 px wide, so only the menu's right padding falls off. With the letter and word spacing that 1.4.12 requires, that word grows and the menu becomes 385 px wide. "Sluiten ×" is then cut off after "Sluiten", the row arrows are gone and the "Bankrekening openen" promotion is cut at the right edge.

#### Recommendation

Give the scroll-locked body an explicit width, or lock scrolling without taking the body out of the flow:

    body.emc-fixed { width: 100%; left: 0; right: 0; }
    /* or: html.menu-open { overflow: hidden; } instead of position: fixed on body */

Size the menu to the viewport (`inset: 0` or `width: 100vw`) so its close button is always on screen ([C32](https://www.w3.org/WAI/WCAG22/Techniques/css/C32), [F102](https://www.w3.org/WAI/WCAG22/Techniques/failures/F102)).
