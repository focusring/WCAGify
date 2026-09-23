---
title: The search overlay has no way out at high zoom or in a narrow browser window
sc: 2.1.2
severity: High
type: Technical
sample: page-13
---

![At 640 px wide the search opens as a grey screen holding only the search field. A term is typed and cleared with the cross, the grey area is clicked, Escape and Tab are pressed, and the grey screen with the field stays every time.](/api/uploads/test-audit/the-search-overlay-has-no-way-out-at-high-zoom-or-in-a-narrow-browser-window-2-1-2-c6933ec7.gif)

Below the desktop breakpoint, **"Open zoekbalk"** opens the search as a full-screen overlay (`div.search-overlay`, `position: fixed`, `z-index: 999`) that covers the whole page, header included. In a desktop browser that happens from 853 px wide, so for anyone who zooms a 1280 px window to 150 % or more, and in any narrow window.

In that overlay the text field is the only thing that can take focus. Tab, Shift+Tab and Escape all leave focus in the field. The cross that appears after typing only empties the field, and clicking the grey area does nothing. There is no close button. The only ways out are running a search or following a suggestion, which both leave the page. The site does ship a close control, but it picks it by user agent: an iPhone gets "Sluiten" and an Android phone gets "Back", and a desktop browser gets neither.

This is a keyboard trap, and it also means that the zoomed layout loses a function the 1280 px layout has: closing the search and going back to the page. That is why it also fails 1.4.4 (at 200 %) and 1.4.10 (at 320 px). Reproduced on page-1, page-4 (at 800 × 900, a 1280 px window at 160 %), page-13, page-14, page-16, page-18, page-19, page-22, page-23, page-24 and page-26: it is the shared header, so it is on every page.

#### Recommendation

Render the close button for every visitor, based on the layout rather than the user agent, and let Escape close the overlay too. Both must return focus to "Open zoekbalk":

    <div class="search-overlay">
      <input id="search-input-overlay" type="search" …>
      <button type="button" class="search-overlay-close">Sluiten</button>
    </div>

    overlay.addEventListener('keydown', e => { if (e.key === 'Escape') closeOverlay() })
    function closeOverlay() { overlay.hidden = true; openSearchButton.focus() }

See [G21](https://www.w3.org/WAI/WCAG22/Techniques/general/G21) and the [ARIA dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).
