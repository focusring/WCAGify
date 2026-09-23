---
title: The English mobile menu has no App and Internet Banking section
sc: 1.4.4
severity: Medium
type: Design
sample: page-2
---

![The English site's menu at 640 px wide, open, listing only Home, Products, Specially for and Service and Contact under the heading "Menu", with a Close button at the top.](/api/uploads/test-audit/the-english-mobile-menu-has-no-app-and-internet-banking-section-1-4-4-8a350b9b.webp)

On the English site, the header at full width offers five sections: Home, Products, Specially for, **App and Internet Banking**, and Service and Contact. Below about 900 px the header is replaced by a hamburger menu, which a 1280 px window reaches at about 142 % zoom, so every visitor at 200 % zoom gets it. That menu lists only four sections: **App and Internet Banking is missing**.

The missing section holds five categories (ABN AMRO app, Internet Banking, Help with online banking, More apps, Secure banking) with links to 16 pages. A walk through every other menu branch and the footer at 640 px found only 4 of them anywhere else. The other 12 cannot be reached at 200 % zoom, among them About the ABN AMRO app, Activate the app, Help using Internet Banking, E.dentifier, Tikkie and the pages on recognising, reporting and preventing fraud. The same is true at 320 px, so this also fails 1.4.10.

Moving the navigation into a hamburger menu is fine; leaving a whole section out of it is lost content. The Dutch menu is complete: "App en Internet Bankieren" is there (checked on page-8, page-11, page-12 and page-16). Seen on page-2 and page-26, so it affects the English build of the shared header.

#### Recommendation

Add the "App and Internet Banking" section, with its categories and links, to the English mobile menu, the way the Dutch menu already has it. The narrow layout must offer the same destinations as the wide one ([G142](https://www.w3.org/WAI/WCAG22/Techniques/general/G142), [G179](https://www.w3.org/WAI/WCAG22/Techniques/general/G179)).
