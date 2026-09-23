---
title: 'A decorative illustration in the menu is announced as "icoon"'
sc: 1.1.1
severity: Low
type: Content
difficulty: Low
sample: page-1
---

![The promo block inside the "App en Internet Bankieren" menu panel, with a large illustration beside the text "Alledaagse bankzaken regelen?".](/api/uploads/test-audit/a-decorative-illustration-in-the-menu-is-announced-as-icoon-1-1-1-a134121b.webp)

The illustration in the **"Alledaagse bankzaken regelen?"** promo inside the "App en Internet Bankieren" menu panel (`pr-general-tip_tcm16-25245.svg`, 294 by 232 pixels) carries `alt="icoon"`.

The image is decorative: the promo's heading and link already say everything it conveys. Giving it the alt text "icoon" describes the file rather than the content, so a screen-reader user is interrupted by a word that adds nothing and suggests they have missed something.

This is in the shared header mega-menu, so it appears on every page in the audit. It was seen on page-1, page-6, page-7, page-8, page-16, page-23 and page-24.

#### Recommendation

Mark it as decorative with an empty alt so assistive technology skips it:

    <img src="pr-general-tip_tcm16-25245.svg" alt="">

Use a real description only if the illustration ever carries information the surrounding text does not ([H67](https://www.w3.org/WAI/WCAG22/Techniques/html/H67), [F30](https://www.w3.org/WAI/WCAG22/Techniques/failures/F30)).
