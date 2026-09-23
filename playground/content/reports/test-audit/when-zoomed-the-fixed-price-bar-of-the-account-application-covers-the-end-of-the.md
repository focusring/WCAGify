---
title: 'When zoomed, the fixed price bar of the account application covers the end of the footer'
sc: 1.4.4
severity: Medium
type: Technical
sample: page-30
---

![The account application at 640 px wide, scrolled to the very end. The footer stops at "Cookie-instellingen"; below it the fixed green bar "Je betaalt per maand € 4,30" fills the bottom of the screen.](/api/uploads/test-audit/when-zoomed-the-fixed-price-bar-of-the-account-application-covers-the-end-of-the-1-4-4-000c4829.webp)

![The same view with the price bar hidden, showing the facebook, linkedin, youtube and newsletter links and "© 2026 ABN AMRO" that the bar covers.](/api/uploads/test-audit/when-zoomed-the-fixed-price-bar-of-the-account-application-covers-the-end-of-the-1-4-4-c3964bd8.webp)

From 767 px wide down, so at 175 % and 200 % zoom of a 1280 window and on phones, the price summary of step 1 ("Je betaalt per maand € 4,30") becomes a **fixed bar, 104 px tall, at the bottom of the screen**. The page adds no space for it at its end, so when the page is scrolled all the way down, the last 104 px of the footer stay under the bar: the **facebook, linkedin, youtube and newsletter links** and **"© 2026 ABN AMRO"**.

They cannot be scrolled into view, seen or clicked, because a click lands on the bar. The bar cannot be dismissed, and opening it only raises a sheet over more of the page. Measured the same at 640 and at 320 px, so this also fails 1.4.10. At 1280, 1024 and 853 px the panel is static and the footer is complete.

#### Recommendation

Reserve the bar's height at the end of the page, for example with a bottom padding equal to the bar's height, or let the summary scroll with the content below 768 px:

    @media (max-width: 767px) { body { padding-bottom: 104px; } }

([C34](https://www.w3.org/WAI/WCAG22/Techniques/css/C34), [G142](https://www.w3.org/WAI/WCAG22/Techniques/general/G142))
