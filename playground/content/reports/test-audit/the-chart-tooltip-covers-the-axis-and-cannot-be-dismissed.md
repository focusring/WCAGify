---
title: The chart tooltip covers the axis and cannot be dismissed
sc: 1.4.13
severity: Low
type: Technical
sample: page-17
---

![The price chart with a tooltip open over a data point, covering the price label on the vertical axis behind it.](/api/uploads/test-audit/the-chart-tooltip-covers-the-axis-and-cannot-be-dismissed-1-4-13-cd3164b8.webp)

Hovering the price chart opens a tooltip (`g.highcharts-tooltip`) showing the value at that point. It **covers the y-axis label "1.105,00" and part of the plot line**, and there is no way to dismiss it without moving the pointer: pressing **Escape does not remove it**.

WCAG 1.4.13 asks three things of content that appears on hover or focus. Two of them are met here: the tooltip is **persistent** (unchanged after five seconds) and **hoverable** (the pointer can move onto it, though it re-points at the nearest data point rather than staying put). **Dismissible fails** — the content it obscures cannot be revealed again without moving the pointer away.

The cause is that Highstock 7.0.3 is loaded **without its accessibility module**, which is what would otherwise provide keyboard handling for the tooltip.

#### Recommendation

Load the Highcharts accessibility module, which adds Escape handling along with keyboard navigation of the series:

    <script src="highcharts/modules/accessibility.js"></script>

If the module cannot be added, bind Escape to hide the tooltip directly ([SCR39](https://www.w3.org/WAI/WCAG22/Techniques/client-side-script/SCR39), and the [Highcharts accessibility module](https://www.highcharts.com/docs/accessibility/accessibility-module)).
