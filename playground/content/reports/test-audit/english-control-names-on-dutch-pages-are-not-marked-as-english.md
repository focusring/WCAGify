---
title: English control names on Dutch pages are not marked as English
sc: 3.1.2
severity: Low
type: Content
difficulty: Low
sample: page-10
---

![The cookie statement with the ⓘ after the word "Cookies" opened, showing a popover headed "Cookies" with an empty square in its corner where the close button is.](/api/uploads/test-audit/english-control-names-on-dutch-pages-are-not-marked-as-english-3-1-2-79a33578.webp)

The pages are Dutch (`lang="nl"`), but a number of shared components carry **English accessible names**, and no element sets `lang="en"` on them. A Dutch speech synthesiser reads them with Dutch pronunciation, so a screen-reader user hears words like "Close" or "selected" mangled, in controls whose visible text, if any, is Dutch.

- the ⓘ glossary button **"Information"** and the popover's **"Close"** button (on this page beside "Cookies"; also page-8, page-12 and page-25)
- `aria-label="Privé selected"` on the current segment in the header, `aria-label="breadcrumb"` on the breadcrumb and `aria-label="newsletter"` on the footer newsletter link (page-8, page-10, page-22)
- the off-screen live-preview button **"Edit"** (every page)
- in the chat: the launcher **"Chat button"**, the message list **"Chat messages"** and the menu item **"Taal / Language"**, whose English half is visible text (page-25, page-14)
- the status text **"1 items selected"** of the energy-label chooser in the mortgage calculator (page-14)
- **"Back"**, the name of the back arrow in the search overlay on Android phones (page-13)

Brand names and adopted words such as "Home", "app" and "cookies" are not counted. The "English" language link has the same problem and is reported separately.

#### Recommendation

Translate the strings in the components: "Informatie", "Sluiten", "Privé geselecteerd" (or better `aria-current="true"` on the link), "kruimelpad", "nieuwsbrief", "Chat openen", "Chatberichten", "1 item geselecteerd", "Terug". Where the English word is meant, mark it:

    Taal / <span lang="en">Language</span>

See [H58](https://www.w3.org/WAI/WCAG22/Techniques/html/H58).
