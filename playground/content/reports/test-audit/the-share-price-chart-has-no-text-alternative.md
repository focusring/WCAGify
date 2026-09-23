---
title: The share price chart has no text alternative
sc: 1.1.1
severity: High
type: Technical
sample: page-17
---

![The AEX price chart for the last month, a line from 24 August to 21 September between 1,090 and 1,125. Nothing on or around it describes the course the line shows.](/api/uploads/test-audit/the-share-price-chart-has-no-text-alternative-1-1-1-8ef23434.webp)

The price chart under "Grafieken" is an `<svg>` drawn by Highstock 7.0.3 with **no role, no `aria-label` and no `<title>`**; its only `<desc>` is "Created with Highstock 7.0.3". A screen reader finds the axis labels only, a list of dates ("24 aug" … "21 sep") and prices ("1.090,00" … "1.125,00"), and nothing about the line itself: how the AEX moved over the chosen period.

The values of single points appear only in the tooltip on mouse hover. The chart cannot be focused, so neither keyboard nor screen-reader users can reach them, and there is no summary or data table beside it. The chart on the page of each share is built the same way. Highstock's accessibility module, which would describe the series and make its points navigable, is not loaded.

The chart is part of the supplier's application (`beursinfo.abnamro.nl`), shown inside the page.

#### Recommendation

Give the chart a short name that says what it shows, and put the information in text next to it: a one-line summary of start, end, high and low, and the figures as a table.

    <div id="grafiek" role="img" aria-label="Koersverloop AEX, afgelopen maand"></div>
    <p>Van … op 24 aug naar … op 22 sep; hoogste …, laagste ….
       <a href="#koerstabel">Bekijk de koersen als tabel</a></p>

Loading the [Highcharts accessibility module](https://www.highcharts.com/docs/accessibility/accessibility-module) generates the name, a description and keyboard navigation of the points in one step ([G95](https://www.w3.org/WAI/WCAG22/Techniques/general/G95), [G92](https://www.w3.org/WAI/WCAG22/Techniques/general/G92)).
