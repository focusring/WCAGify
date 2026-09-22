---
title: The price ticker never stops and cannot be paused
sc: 2.2.2
severity: High
type: Technical
sample: page-17
---

![The share price ticker at the top of the market data panel, scrolling prices steadily from right to left without stopping.](/api/uploads/test-audit/the-price-ticker-never-stops-and-cannot-be-paused-2-2-2-aa68eeab.gif)

The full-width price ticker at the top of the market data panel (`#tickercontainer`) **scrolls continuously for as long as the page is open**. Measured once a second for 25 seconds, it advances at about 80 pixels per second and never stops: `jquery.ticker.js` drives it with a `setInterval(…, 25)` that is never cleared.

WCAG allows moving content that lasts more than five seconds only if the user can pause, stop or hide it. **There is no such control.** The frame contains no `button`, `input`, `role="button"`, `role="switch"` or `role="checkbox"` element at all in any state, and no pause, stop, hide, speed or frequency wording anywhere in it.

Two things that look like mitigations but are not:

- **Hovering pauses it, and that is all.** The plugin binds `mouseover` to pause and `mouseout` to resume, with no keyboard equivalent. A mouse user can hold the movement still by keeping the pointer on it; a keyboard user has nothing. Worse, focus placed on a ticker link is destroyed when the items recycle and falls back to `<body>` within about six seconds.
- **`prefers-reduced-motion` has no effect.** With the setting emulated and `matchMedia` confirming it is on, the ticker still advances; none of the frame's 24 scripts or stylesheets contains the string `prefers-reduced-motion`.

Continuous movement beside the content a user is trying to read is a serious obstacle for people with attention or vestibular disorders, and it cannot be escaped without leaving the page.

This is the supplier's application (`beursinfo.abnamro.nl`), shown inside the page. The host page itself has nothing that moves in any state.

#### Recommendation

Add a visible pause/play control to the ticker that is reachable by keyboard and stays available while the ticker runs:

    <button type="button" aria-pressed="false" onclick="ticker.toggle()">Pauzeer koersen</button>

Remember the choice for the session, and honour the operating-system setting as well, so the ticker starts stopped for users who have asked for reduced motion:

    @media (prefers-reduced-motion: reduce) { /* start paused, no auto-scroll */ }

See [G4](https://www.w3.org/WAI/WCAG22/Techniques/general/G4) and [F16](https://www.w3.org/WAI/WCAG22/Techniques/failures/F16).
