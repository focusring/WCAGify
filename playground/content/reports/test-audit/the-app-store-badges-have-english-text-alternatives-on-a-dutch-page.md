---
title: The app store badges have English text alternatives on a Dutch page
sc: 3.1.2
severity: Low
type: Content
difficulty: Low
sample: page-18
---

![The hero of the app page, "De ABN AMRO app – Altijd je bankzaken dichtbij", with two black badges outlined in red, reading "Download in de App Store" and "ONTDEK HET OP Google Play".](/api/uploads/test-audit/the-app-store-badges-have-english-text-alternatives-on-a-dutch-page-3-1-2-74b9e350.webp)

The app page shows two store badges twice, in the hero and in the "<span lang="nl">Al 3,7 miljoen klanten hebben de ABN AMRO app</span>" block. The badges themselves are Dutch ("<span lang="nl">Download in de App Store</span>", "<span lang="nl">ONTDEK HET OP Google Play</span>"), but their `alt` texts are English: **"Download on the App Store"** and **"Download on Google Play"**. No `lang` attribute marks them, so the page's Dutch applies.

Each badge is the only content of its link, so these English phrases are the link names. A screen reader reads "Download on the App Store" with Dutch pronunciation rules. "App Store" and "Google Play" are names, but "on the" makes it an English phrase.

The text alternative also does not match what the badge shows: "Download on Google Play" is not what the image says ("<span lang="nl">Ontdek het op Google Play</span>"), so a speech-input user who reads the badge aloud may not reach the link.

#### Recommendation

Write the text alternative in Dutch, the same as the badge text:

    <a href="…"><img src="apple-app-store-original.svg" alt="Download in de App Store"></a>
    <a href="…"><img src="google-play-store-original.svg" alt="Ontdek het op Google Play"></a>

That fixes both the language and the mismatch. If the English text has to stay, put `lang="en"` on the `img` ([H58](https://www.w3.org/WAI/WCAG22/Techniques/html/H58)).
