---
title: The share price disappears from the tables on a narrow screen
sc: 1.4.10
severity: High
type: Design
sample: page-17
---

![The "Top 5 stijgers" table at a narrow viewport, showing only the company name and a percentage; the price and change columns are gone.](/api/uploads/test-audit/the-share-price-disappears-from-the-tables-on-a-narrow-screen-1-4-10-2dd5acfc.webp)

As the viewport narrows, the "<span lang="nl">Top 5 stijgers</span>" and "<span lang="nl">Top 5 dalers</span>" tables **remove columns instead of reflowing them**:

- the absolute-change column goes `display:none` below about **560 px**
- **"Huidig" — the share price itself — goes below about 440 px**

At 320 CSS pixels the table shows only the company name and a percentage. There is **no disclosure control, no horizontal scroll container of its own, and no other route to the price anywhere on the view**. The information is not rearranged; it is deleted.

WCAG 1.4.10 requires content to be presentable at 320 pixels without loss of information or functionality. Anyone using a phone, or a desktop at 400% zoom, is shown a market data table that no longer contains the market data.

The news list in the same application loses its time column the same way.

A second, separate reflow problem sits in the news frame: it **scrolls in two dimensions** at 320 px — `scrollWidth` 350 against a 320 px viewport, caused by `table#nieuwsSearch` computing to 344.7 px and a 5 px offset on `div#nieuws` pushing every headline cell past the edge. It is clean at 640 px and the overflow returns at 400×900 portrait.

Both are inside the market data application supplied on `beursinfo.abnamro.nl`.

#### Recommendation

Keep every column and let the table reflow. The usual pattern for narrow screens is to stack each row into its own block with the column heading beside each value:

    @media (max-width: 560px) {
      #tableTop thead { position: absolute; left: -10000px; }
      #tableTop td { display: block; }
      #tableTop td::before { content: attr(data-label) ": "; font-weight: 700; }
    }

If columns genuinely cannot all be shown, give the table its own horizontal scroll container so the data is still reachable, rather than hiding it. For the news frame, remove the fixed widths and the 5 px offset so it fits within 320 px ([C32](https://www.w3.org/WAI/WCAG22/Techniques/css/C32), [SCR34](https://www.w3.org/WAI/WCAG22/Techniques/client-side-script/SCR34)).
