---
title: 'The "Veilig bellen via onze app" card disappears when the page is zoomed'
sc: 1.4.4
severity: Medium
type: Design
sample: page-4
---

![The "Hulp nodig?" section at 1024 px wide with three cards, "Chatbot Anna", "Veilig bellen via onze app" with the tag "Minder wachttijd" and the button "Zo werkt het", and "Bel de klantenservice" with the tag "Houd rekening met een wachttijd".](/api/uploads/test-audit/the-veilig-bellen-via-onze-app-card-disappears-when-the-page-is-zoomed-1-4-4-facee266.webp)

![The same section at 853 px wide (150 % zoom) with only two cards, "Chatbot Anna" and "Bel de klantenservice". The app card and the waiting-time tag are gone, with empty space on the right.](/api/uploads/test-audit/the-veilig-bellen-via-onze-app-card-disappears-when-the-page-is-zoomed-1-4-4-5e9f2680.webp)

The "Hulp nodig?" section on the service page shows three contact cards at full width. From a viewport of 853 px down, which is a 1280 px window zoomed to 150 %, the whole **"Veilig bellen via onze app"** card is removed: its heading, the text "Bel ons via de ABN AMRO app en zie meteen of er wachttijd is. Kies het onderwerp van je vraag en krijg rechtstreeks de juiste persoon aan de lijn.", the tag "Minder wachttijd" and its "Zo werkt het" link. The "Houd rekening met een wachttijd" tag of the "Bel de klantenservice" card goes as well.

Nothing on the page reveals them at that width, and no other link on the page leads to the calling-through-the-app page. So a user who zooms in to read loses the information that calling through the app is faster and that the phone line has a wait. The loss starts at 150 %, with room for the third card still on screen. Because the narrow layout is the one a 320 px reflow shows, it fails 1.4.10 (Reflow) as well.

#### Recommendation

Keep the third card and both tags at every width, stacked in one column where there is no room for three, instead of switching to a reduced set of cards on smaller viewports ([G142](https://www.w3.org/WAI/WCAG22/Techniques/general/G142), [G179](https://www.w3.org/WAI/WCAG22/Techniques/general/G179)).
