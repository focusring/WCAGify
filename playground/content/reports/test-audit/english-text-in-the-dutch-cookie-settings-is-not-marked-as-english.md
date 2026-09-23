---
title: English text in the Dutch cookie settings is not marked as English
sc: 3.1.2
severity: Low
type: Content
sample: page-10
---

![The Dutch cookie centre, titled "Cookie center", showing the cookie details of the vendor AWIN AG. The row "Type — Third party" is outlined in red, and the description beneath it is a whole English sentence, between Dutch labels such as "Naam", "Duur" and "Omschrijving".](/api/uploads/test-audit/english-text-in-the-dutch-cookie-settings-is-not-marked-as-english-3-1-2-f77abb11.webp)

The cookie settings on the Dutch pages carry `lang="nl"`, and nothing inside them is marked as another language. Yet several texts in them are English:

- the vendor-list cookie details: 7 of the 43 cookie descriptions are whole English sentences (for example AWIN's "This domain is owned by Awin, a global affiliate marketing network…"), and the "Type" of every cookie reads **"Third party"** or **"First party"**;
- the status message after each search in the vendor list, "1 host returned." / "8 hosts returned.", which is the only feedback a screen-reader user gets about the filtered list;
- the interface strings **"Powered by OneTrust"**, "Back" (the back button's name), "Back Button" and "Filter Button" (SVG titles), and the dialog title "Cookie center".

A Dutch speech synthesiser reads all of these with Dutch pronunciation, which makes the English sentences hard to follow. None of them is a proper name or an adopted Dutch term. "Cookie center" could pass as the tool's name, but the descriptions, the status message and "Powered by" cannot.

This is the OneTrust consent component, which is on every page. Also recorded on page-1, page-5, page-6, page-7, page-9, page-11, page-12, page-18, page-23 and page-24.

#### Recommendation

Translate the strings in OneTrust: the cookie descriptions and type values in the cookie database ("Cookie van derden" / "Eigen cookie"), and the interface and status texts in the Dutch language settings ("1 leverancier gevonden.", "Terug", "Filter"). Where a text must stay English, have the template mark it:

    <dd lang="en">This domain is owned by Awin, …</dd>

([H58](https://www.w3.org/WAI/WCAG22/Techniques/html/H58)).
