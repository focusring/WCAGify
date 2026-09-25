---
title: 'The "English" link on the energy-saving article opens an unrelated English page'
sc: 2.4.4
severity: Medium
type: Technical
sample: page-27
---

![The header of the energy-saving tips article with the language link "English" highlighted in the row Privé, Zakelijk, Private banking, English.](/api/uploads/test-audit/the-english-link-on-the-energy-saving-article-opens-an-unrelated-english-page-2-4-4-72caf1af.webp)

In the header row "Privé / Zakelijk / Private banking / English", the link **"English"** reads as "this page, or this site, in English". On the energy-saving tips article it does neither. It opens an English page on an unrelated subject, and which page it is changes from one load to the next. In 11 loads of the article the server sent four different targets:

- "Current mortgage interest rate 2026" (`/en/personal/mortgages/interest-rates/index.html`), 5 times;
- "PIN blocked" (`/en/personal/payments/debit-card/pin-blocked.html`), 3 times;
- "How do you recognize and prevent investment fraud", 2 times;
- "Investment news", once.

The same link in the mobile "Taal - NL" popover has the same target. A visitor who wants the English site cannot know where the link leads, and lands on a page about something else. On the payments page (page-11) the link leads to the English payments page on every load, so the target is set per page. On this article it seems to be left over from whatever the server rendered before.

The same happens on other samples. On the accessibility statement (page-6) it opened "Submitting a complaint" on two loads and "Contactless payments" on a later one. On the seniors' online-banking page (page-24) it opened "Authorising someone to access your account", then "What is the maximum transfer amount". On the English home page (page-2) its counterpart "Nederlands" opened "<span lang="nl">Wijziging betaaltarieven en -voorwaarden 2025</span>", then "<span lang="nl">Jouw plan</span>" (Preferred Banking) and, in an earlier unit, the Dutch themes page.

#### Recommendation

Where a page has no English version, point "English" at the English home page (`/en/personal/index.html`) or at the English overview of the same section. Never use a target left over from another page. Give the link `lang="en"` and `hreflang="en"` as well ([G91](https://www.w3.org/WAI/WCAG22/Techniques/general/G91), [H58](https://www.w3.org/WAI/WCAG22/Techniques/html/H58)).
