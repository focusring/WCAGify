---
title: The share prices application is marked as English although it is Dutch
sc: 3.1.2
severity: High
type: Technical
difficulty: Low
sample: page-17
---

![The share prices panel with the price ticker, the Koersoverzicht links, the Grafieken chart and the Top 5 stijgers and Top 5 dalers tables, all in Dutch.](/api/uploads/test-audit/the-share-prices-application-is-marked-as-english-although-it-is-dutch-3-1-2-8e9ca87d.webp)

The whole market data application is Dutch: the ticker, "Koersoverzicht", "Grafieken", both Top 5 tables, "Financieel nieuws", headlines such as "Beursupdate: AEX komt nauwelijks van zijn plaats", and the page of each share. Yet its documents (`startpage.aspx`, `details.aspx`) start with **`<html lang="en">`**, and the nested news document `nieuws_overzicht.aspx` has no `lang` at all, so it inherits the English of its frame. The host page around it is correctly marked `nl`.

A screen reader therefore reads the main content of this page with English pronunciation, and braille displays switch to English tables. Dutch words such as "stijgers", "dalers" and "Koersgegevens" become hard or impossible to follow. Automated checkers do not catch this, because `en` is a valid value.

The application is the supplier's (`beursinfo.abnamro.nl`), shown inside the page.

#### Recommendation

Declare the language the documents are written in, in every beursinfo document: the start page, the pages of the shares and the news list:

    <html lang="nl" xmlns="http://www.w3.org/1999/xhtml">

If the application also serves an English version, take the value from the page's locale ([H57](https://www.w3.org/WAI/WCAG22/Techniques/html/H57), [H58](https://www.w3.org/WAI/WCAG22/Techniques/html/H58)).
