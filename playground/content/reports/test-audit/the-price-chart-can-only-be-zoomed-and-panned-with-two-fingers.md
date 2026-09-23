---
title: The price chart can only be zoomed and panned with two fingers
sc: 2.5.1
severity: Medium
type: Technical
sample: page-17
---

![The AEX chart after a two-finger spread on a touchscreen, now showing only 3 to 8 September. A Reset zoom button has appeared; there is no button to zoom in or to move the window.](/api/uploads/test-audit/the-price-chart-can-only-be-zoomed-and-panned-with-two-fingers-2-5-1-64f9769d.webp)

On a touchscreen the price chart (Highstock, `pinchType: 'x'`, panning enabled) zooms in on any stretch with a **two-finger spread**, and the zoomed window moves with a **two-finger pan**. Measured: a spread took the month view from 24 August–22 September to 2–8 September, and a pan moved it to 31 August–7 September. One finger only moves the tooltip. There is no control that does the same: the navigator, scrollbar and range selector are switched off, the seven period links always show a window ending today, and "Reset zoom" only zooms back out.

So a past stretch, for example one month in the 10-year chart where 2,607 points share 438 pixels, can be enlarged only with two fingers. People who operate a touchscreen with one finger, a stylus or a head pointer cannot do it.

There is no keyboard route either (2.1.1): the chart cannot be focused and the arrow keys do nothing, because Highstock's accessibility module is not loaded. The chart on the page of each share has the same settings. The chart is part of the supplier's application (`beursinfo.abnamro.nl`), shown inside the page.

#### Recommendation

Give every gesture outcome a single-pointer, keyboard-operable control, for example Highstock's range selector with its date fields:

    rangeSelector: { enabled: true, inputEnabled: true }

or "Inzoomen", "Uitzoomen", "Eerder" and "Later" buttons that call `chart.xAxis[0].setExtremes()`. Do not use the navigator as the only route, since it is a drag. If zooming is not meant to be a feature, switch the gesture off with `chart: { pinchType: '' }` ([G215](https://www.w3.org/WAI/WCAG22/Techniques/general/G215), [G202](https://www.w3.org/WAI/WCAG22/Techniques/general/G202)).
