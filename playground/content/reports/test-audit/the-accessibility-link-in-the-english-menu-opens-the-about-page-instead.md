---
title: The Accessibility link in the English menu opens the About page instead
sc: 2.4.4
severity: Medium
type: Content
difficulty: Low
sample: page-2
---

![The English mega-menu open at "App and Internet Banking", "Help with online banking", with the link "Accessibility" outlined under "Help using the ABN AMRO app" and "Help using Internet Banking".](/api/uploads/test-audit/the-accessibility-link-in-the-english-menu-opens-the-about-page-instead-2-4-4-1631e127.webp)

In the English header, the mega-menu panel **App and Internet Banking → Help with online banking** has a link named **"Accessibility"**. It opens `/en/personal/overabnamro/index.html`, the general page "Our organisation, contact details and more", not the accessibility page.

The link text and its place under "Help with online banking" both promise information about accessibility, so a user who follows it lands on a page that does not have it. The English accessibility page exists, at `/en/personal/overabnamro/accessibility/index.html`, and the footer links "Accessibility" and "Accessibility: banking" open it correctly. Its tracking parameter (`nav_topnav_im_hulp_toegankelijkheid-EN`) suggests a menu entry whose English target was never updated.

#### Recommendation

Point the menu entry at the page its text names:

    <a href="/en/personal/overabnamro/accessibility/index.html?pos=nav_topnav_im_hulp_toegankelijkheid-EN">Accessibility</a>

([G91](https://www.w3.org/WAI/WCAG22/Techniques/general/G91)).
