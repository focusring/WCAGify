---
title: 'The account application replaces its page title with just "ABN AMRO"'
sc: 2.4.2
severity: Medium
type: Technical
difficulty: Low
sample: page-30
---

The application page for a personal payment account is sent with a descriptive title, "Bankrekening voor uzelf openen - ABN AMRO". About 1.5 seconds after load, when the embedded Mendix form starts, its client rewrites `document.title` to **"ABN AMRO"**, the bank's name and nothing else. The value comes from the Mendix navigation profile (`uiconfig.profile.title`). At the same moment it changes `html lang` from `nl` to `nl-NL`. The title stays "ABN AMRO" on step 1, on step 2 "Je gegevens", in the error state and after going back.

Screen-reader users hear "ABN AMRO" when the tab gets focus. In the tab bar, the history and a bookmark, this page cannot be told apart from any other. It is the one step of the "Open a payment account" process where the visitor actually applies. The steps before it have their own titles: "Bankrekening openen - ABN AMRO", "Bankrekening openen voor jezelf - ABN AMRO", "Klant worden - ABN AMRO". No other sample loses its title this way, so the cause is the Mendix form host, not the CMS template.

#### Recommendation

Stop the Mendix client from setting `document.title`, or set its navigation profile title to the page's purpose. Better still, add the step:

    <title>Stap 2 van 5: Je gegevens – Betaalrekening voor jezelf openen – ABN AMRO</title>

([G88](https://www.w3.org/WAI/WCAG22/Techniques/general/G88), [H25](https://www.w3.org/WAI/WCAG22/Techniques/html/H25), [G127](https://www.w3.org/WAI/WCAG22/Techniques/general/G127))
