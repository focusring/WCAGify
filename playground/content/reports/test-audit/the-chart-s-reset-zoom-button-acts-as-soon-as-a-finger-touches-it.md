---
title: "The chart's Reset zoom button acts as soon as a finger touches it"
sc: 2.5.2
severity: Low
type: Technical
sample: page-17
---

![The zoomed AEX chart on a touchscreen showing 3 to 8 September, with the Reset zoom button in the top right corner.](/api/uploads/test-audit/the-chart-s-reset-zoom-button-acts-as-soon-as-a-finger-touches-it-2-5-2-5884fc8e.webp)

![The same chart while the finger is still resting on Reset zoom. The full month from 24 August is already back and the button is gone, before the finger has been lifted.](/api/uploads/test-audit/the-chart-s-reset-zoom-button-acts-as-soon-as-a-finger-touches-it-2-5-2-5eeb46c7.webp)

After a two-finger zoom on a touchscreen, the price chart shows a **"Reset zoom"** button. Highcharts 7.0.3 binds its action to `touchstart`, so it fires the moment a finger lands on it. Measured with the finger held on the button: the zoomed view was already gone before any up-event, and sliding the finger off before lifting did not bring it back.

A user who touches the button by accident, for instance while trying to pan, loses the zoomed view with no undo; the only way back is to repeat the two-finger gesture, which some users cannot make at all. The button only appears on touch devices. It is also not a button to assistive technology: the SVG group that draws it has no role and no `tabindex`, so a screen reader does not announce it as a button and Tab skips it (4.1.2). Enter on any period link resets the zoom, so keyboard users do have another way back. The chart is part of the supplier's application (`beursinfo.abnamro.nl`), shown inside the page.

#### Recommendation

Hide the built-in button and offer an HTML button, which acts on the up-event and can be cancelled by sliding off:

    chart: { resetZoomButton: { theme: { style: { display: 'none' } } } }

    <button type="button" onclick="chart.zoomOut()">Zoom herstellen</button>

Or upgrade Highcharts and check that its reset button no longer fires on `touchstart` ([G212](https://www.w3.org/WAI/WCAG22/Techniques/general/G212), [F101](https://www.w3.org/WAI/WCAG22/Techniques/failures/F101)).
