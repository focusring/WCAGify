---
title: A time-of-day greeting is the heading of the search block
sc: 2.4.6
severity: Low
type: Content
difficulty: Low
sample: page-1
---

![The top of the home page. In the dark-green card at the right the heading "Goedenavond," stands above the line "Waarmee kunnen we je vooruit helpen?" and the search field, with the shortcut tiles below.](/api/uploads/test-audit/a-time-of-day-greeting-is-the-heading-of-the-search-block-2-4-6-fe5c3e07.webp)

The search block at the top of the home page is headed **"Goedenavond,"** (in the morning "Goedemorgen,", in the afternoon "Goedemiddag,"). The heading introduces the question "Waarmee kunnen we je vooruit helpen?", the site search and the eight shortcut tiles, but a greeting names none of that.

Screen-reader users often move through a page by its headings. In that list this block, the busiest one on the page, is called "Goedenavond,", so nothing tells them the search starts here.

The same greeting is the heading of the search block on the English home page (page-2, "Good evening,") and of the service page (page-4, "Goedemiddag,").

#### Recommendation

Make the question the heading and show the greeting as ordinary text above it:

    <p class="greeting">Goedenavond,</p>
    <h2>Waarmee kunnen we je vooruit helpen?</h2>

The block looks the same, and its heading now says what it is for ([G130](https://www.w3.org/WAI/WCAG22/Techniques/general/G130)).
