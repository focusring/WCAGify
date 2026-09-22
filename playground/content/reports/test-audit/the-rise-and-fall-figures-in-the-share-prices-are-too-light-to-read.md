---
title: The rise and fall figures in the share prices are too light to read
sc: 1.4.3
severity: High
type: Design
sample: page-17
---

![The "Top 5 stijgers" table, with the change and percentage columns shown in a light green against a white and pale grey striped background.](/api/uploads/test-audit/the-rise-and-fall-figures-in-the-share-prices-are-too-light-to-read-1-4-3-cd26e99c.webp)

The market data panel signals rises in green and falls in red. Both are too light against their background, and so are two other pieces of text in the same application. Every value below was measured directly:

| Text                                    | Colour    | Background            | Ratio           | Needs |
| --------------------------------------- | --------- | --------------------- | --------------- | ----- |
| Rise cells, "Top 5 stijgers" (20 cells) | `#78a343` | `#f9f9f9` / `#ffffff` | **2.80 / 2.95** | 4.5   |
| Fall cells, "Top 5 dalers"              | `#db402c` | `#f9f9f9` / `#ffffff` | **4.17 / 4.39** | 4.5   |
| Rise percentage in the ticker           | `#608e28` | `#ffffff`             | **3.89**        | 4.5   |
| News pagination digits                  | `#00928e` | `#ffffff`             | **3.82**        | 4.5   |
| Chart axis labels                       | `#888888` | `#ffffff` / `#f9f9f9` | **3.54 / 3.37** | 4.5   |

All of it is 16–20 px regular weight, so the 4.5:1 threshold applies; none qualifies as large text. The neutral cells in the same tables measure 12.0:1, so the problem is specific to the coloured figures rather than to the design as a whole.

The rise green is the worst at **2.80:1** — barely above half the required contrast — and it is on the number a customer reads to decide whether to trade.

**Automated testing only catches part of this.** axe reports the 20 table cells, but returns _incomplete_ for the ticker (an arrow background image defeats it), for the pagination ("content is too short") and for the chart labels (inline SVG text it does not rate). Three of the five rows above were found only by measuring.

These are all inside the market data application supplied on `beursinfo.abnamro.nl`.

#### Recommendation

Darken the two signal colours until they clear 4.5:1 on both the white and the `#f9f9f9` striped rows. `#4a7020` for the rise green reaches 5.3:1 on white, and `#c62d1a` for the fall red reaches 5.1:1; keep the same hue so the visual language does not change.

The chart axis labels and the pagination digits need the same treatment — `#767676` and `#00706c` respectively clear the threshold ([G18](https://www.w3.org/WAI/WCAG22/Techniques/general/G18)).
