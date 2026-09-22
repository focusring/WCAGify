---
title: Menu buttons are announced with the file name of their icon
sc: 1.1.1
severity: Medium
type: Content
sample: page-4
---

![The "Waarmee kunnen we je vooruit helpen?" topic chooser, showing six buttons each with an icon above a label such as "Passen" or "Overboeken".](/api/uploads/test-audit/menu-buttons-are-announced-with-the-file-name-of-their-icon-1-1-1-ae09c484.webp)

The six topic buttons in the "Waarmee kunnen we je vooruit helpen?" chooser each pair an icon with a visible label. The icons carry the **name of their image file** as their text alternative:

- `alt="sy-account-debitcard"` on **Passen**
- `alt="sy-account-transfer"` on Overboeken
- `alt="sy-tools-settings"`, `alt="sy-contact-mobiledevices"`, `alt="sy-tools-constellation"`, `alt="sy-buildings-office 2"` on the rest

Because the icon sits inside the button, its alt text becomes part of the button's accessible name. The accessibility tree reads `button "sy-account-debitcard Passen"`, so a screen-reader user hears a string of internal naming convention before every topic — and a speech-recognition user has to contend with it to activate the button.

The icons are decorative: the visible label beside each one already says what the topic is.

This is the entry point to the service desk, the route to almost every self-service task on the site.

#### Recommendation

Mark the icons as decorative so only the label is announced:

    <button>
      <img src="sy-account-debitcard.svg" alt="">
      Passen
    </button>

The same applies to the mega-menu promotion images that carry `alt="icoon"` and `alt="hypotheekafspraak"` ([H67](https://www.w3.org/WAI/WCAG22/Techniques/html/H67), [F30](https://www.w3.org/WAI/WCAG22/Techniques/failures/F30)).
