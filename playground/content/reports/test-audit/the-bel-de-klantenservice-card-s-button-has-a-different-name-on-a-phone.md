---
title: 'The "Bel de klantenservice" card''s button has a different name on a phone'
sc: 3.2.4
severity: Low
type: Content
difficulty: Low
sample: page-4
---

![The "Bel de klantenservice" card on the service page at phone width, with the text "Bekijk alle telefoonnummers en openingstijden" and a button reading "Bel ons via de app", outlined in red.](/api/uploads/test-audit/the-bel-de-klantenservice-card-s-button-has-a-different-name-on-a-phone-3-2-4-e5ba5e1c.webp)

![The same "Bel de klantenservice" card on the pension check page at phone width. Its button reads "Alle telefoonnummers", outlined in red.](/api/uploads/test-audit/the-bel-de-klantenservice-card-s-button-has-a-different-name-on-a-phone-3-2-4-4b8dcdfa.webp)

Several pages end with the same help block. One of its cards, **"Bel de klantenservice"**, says "Bekijk alle telefoonnummers en openingstijden" and has a button to the overview of all phone numbers (`/nl/prive/service-en-contact/overzicht-alle-telefoonnummers.html`). On the pension check page (page-21), the brochure page (page-7) and the service page (page-4) at desktop width, that button is called **"Alle telefoonnummers"**.

On the service page from 853 px down, which includes phones and a 150 % zoom, the site shows a separate small-screen copy of the card (`#tcm-33374-1`). There the same button to the same page is called **"Bel ons via de app"**. The two names have no word in common, and the phone name points to a different channel (the app) than the page it opens. People who recognise the button by its name, or say its name to speech software, have to learn it again.

#### Recommendation

Give the small-screen copy of the card the same button text as every other copy, "Alle telefoonnummers", or render one copy of the card for all widths ([G197](https://www.w3.org/WAI/WCAG22/Techniques/general/G197)).
