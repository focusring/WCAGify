---
title: 'The lock icon under "Veilig bankieren" has two quotation marks as its alt text'
sc: 1.1.1
severity: Low
type: Content
difficulty: Low
sample: page-29
---

![The three cards under "Daarom een bankrekening bij ABN AMRO", with the lock icon of the third card, "Veilig bankieren", outlined in red.](/api/uploads/test-audit/the-lock-icon-under-veilig-bankieren-has-two-quotation-marks-as-its-alt-text-1-1-1-c805ffa5.webp)

On the "Klant worden" page, the third card under **"Daarom een bankrekening bij ABN AMRO"**, "Veilig bankieren", has a lock icon (`pr-lock-closed-original.svg`) with `alt='" "'`: two straight quotation marks around a space. That is not an empty alt, so the icon stays in the accessibility tree as an image named `" "`, between the heading "Veilig bankieren" and the sentence "Altijd veilig bankieren. …".

The icon is decorative. The heading and the text say everything it shows, and the icons of the two sibling cards have `alt=""`. Depending on their punctuation setting, screen-reader users hear "graphic", "quote quote" or nothing, which suggests they are missing something. The alt field was meant to be empty and got the quotation marks by mistake.

#### Recommendation

Empty the alt field in the CMS so the icon is ignored, as its two neighbours are:

    <img src="pr-lock-closed-original.svg" alt="">

([H67](https://www.w3.org/WAI/WCAG22/Techniques/html/H67), [F39](https://www.w3.org/WAI/WCAG22/Techniques/failures/F39))
