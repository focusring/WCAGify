---
title: 'The login page contains its cookie settings twice, with the same ids'
sc: 4.1.2
severity: Medium
type: Technical
sample: page-3
---

![The login page with the "Cookie center" dialog open over it, showing the tabs "Jouw privacy", "Functionele cookies", "Analytische cookies" and "Persoonlijke cookies" and the buttons "Akkoord", "Niet akkoord" and "Bevestig mijn keuzes".](/api/uploads/test-audit/the-login-page-contains-its-cookie-settings-twice-with-the-same-ids-4-1-2-6c9181ac.webp)

On the login page the OneTrust cookie settings ("Cookie center", supplied by OneTrust) are in the document **twice**. From page load, `div#onetrust-consent-sdk` holds two copies of `div#onetrust-pc-sdk`, drawn on top of each other at the same position, and 42 ids occur in both (`ot-pc-title`, `close-pc-btn-handler`, `ot-header-id-C0001`, `ot-desc-id-C0001`, …). axe flags twelve of them as duplicate ids used by ARIA, in every state, also after consent.

Every heading, tab, panel and switch of the dialog is therefore in the accessibility tree twice. The `aria-labelledby` and `aria-controls` references resolve to whichever copy comes first in the document, so a tab or switch in one copy can be named by, or point at, an element in the other. What a screen reader reports is then not what is on screen, and a screen-reader user who reads through the dialog meets all of it a second time. This also fails 1.3.1 (Info and Relationships). Only the login page shows the double copy; the preference centre on the other samples is loaded once.

#### Recommendation

Initialise the OneTrust script once on the login application, so the preference centre is rendered once and every id it refers to is unique. The `aria-labelledby` and `aria-controls` references then land on the element the user sees ([ARIA16](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA16)).
