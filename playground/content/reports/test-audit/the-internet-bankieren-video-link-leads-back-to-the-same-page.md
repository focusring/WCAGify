---
title: 'The "Internet Bankieren" video link leads back to the same page'
sc: 2.4.4
severity: Low
type: Content
difficulty: Low
sample: page-24
---

![The section "Cursussen over online bankieren" with the sentence "Bekijk onze korte video's over Internet Bankieren en de ABN AMRO app."; the link "Internet Bankieren" in it is outlined in red.](/api/uploads/test-audit/the-internet-bankieren-video-link-leads-back-to-the-same-page-2-4-4-db447a69.webp)

In the section "Cursussen over online bankieren" the sentence reads "Bekijk onze korte video's over **Internet Bankieren** en de ABN AMRO app." Together with its sentence, the link "Internet Bankieren" promises short videos about Internet Bankieren.

Its `href` is the page the reader is already on (`…/senioren/online-bankieren/index.html`), and that page has no video. Activating the link reloads the page and jumps to the top, and nothing says it is the current page. The purpose the link states and what it does do not match.

This page is written for seniors who are less confident online. A link that silently goes nowhere is exactly the kind of dead end that makes them give up.

#### Recommendation

Point the link at the page that actually holds the Internet Bankieren videos (probably the Internet Bankieren manual or the courses page that "Bekijk alle cursussen" leads to), or reword the sentence so the link names what it opens ([G91](https://www.w3.org/WAI/WCAG22/Techniques/general/G91), [G53](https://www.w3.org/WAI/WCAG22/Techniques/general/G53)).
