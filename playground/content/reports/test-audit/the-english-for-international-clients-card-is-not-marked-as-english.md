---
title: 'The English "For international clients" card is not marked as English'
sc: 3.1.2
severity: Medium
type: Content
difficulty: Low
sample: page-12
---

![A row of three product cards. The middle one, outlined in red, is in English, "For international clients. Welcome to the Netherlands, welcome to ABN AMRO…", with the buttons "Open your bank account now" and "Read more"; the cards beside it are in Dutch.](/api/uploads/test-audit/the-english-for-international-clients-card-is-not-marked-as-english-3-1-2-8971506d.webp)

The account-opening page is declared Dutch (`<html lang="nl">`), but it holds a whole English card: **"For international clients"**, with the text "Welcome to the Netherlands, welcome to ABN AMRO. Open your bank account and get everything you need to do your banking in the Netherlands.", the button "Open your bank account now" and the link "Read more". Neither the card nor any ancestor carries `lang="en"`.

A screen reader therefore reads these English sentences with Dutch pronunciation rules, which makes them hard to understand, exactly for the international visitors the card is aimed at. These are full sentences, not names or loan words, so no exception applies.

The link **"International clients"** in the "<span lang="nl">Ook handig</span>" list of the same page is the same case in two words, and so is the "International client" link in the "<span lang="nl">Ook handig</span>" block of the payment-account page (page-13).

#### Recommendation

Mark the card and the English links with their language:

    <div id="tcm-52479" role="region" lang="en" …>…</div>
    <a href="/en/personal/payments/open-an-account/index.html" lang="en">International clients</a>

If the CMS has a language field for a block, use it, so editors can set this themselves ([H58](https://www.w3.org/WAI/WCAG22/Techniques/html/H58)).
