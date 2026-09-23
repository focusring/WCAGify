---
title: 'The "Lees ook" article cards are named by their title alone'
sc: 2.5.3
severity: Low
type: Technical
difficulty: Low
sample: page-27
---

![The three "Lees ook" article cards on the energy-saving tips page. Each shows a photo, a title, the tag chips "Top 5" and "Voor huiseigenaren" or "Duurzaam wonen", and a publication date.](/api/uploads/test-audit/the-lees-ook-article-cards-are-named-by-their-title-alone-2-5-3-6a39179e.webp)

Under **"Lees ook"** on the energy-saving tips page, each related article is one link card that shows a title, two tag chips and a date, for example "Bescherm je huis tegen inbraak · Top 5 · Voor huiseigenaren · 20-11-2025". The link's `aria-label` holds only the title, "Bescherm je huis tegen inbraak", so the chips and the date that are visibly part of the link are not in its name. The same goes for the other two cards ("Lars verduurzaamde zijn huis van energielabel E naar A+++", "4 tips voor een koel huis zonder airco"). axe's experimental rule `label-content-name-mismatch` flags all three.

Because the name starts with the title, "click Bescherm je huis tegen inbraak" still works by voice. A speech-input user who speaks the words they see on the card, such as a tag or the date, reaches nothing. The `aria-label` also hides the tags and the date from screen-reader users. This applies at desktop width. Below 768 px the chips and date are not shown at all.

#### Recommendation

Remove the `aria-label` so the link takes its name from its content. Or keep only the title inside the link and place the chips and date beside it, outside the link:

    <a class="news-article-card-component-link" href="…">
      <h3>Bescherm je huis tegen inbraak</h3>
      <div class="chips">Top 5 · Voor huiseigenaren</div>
      <p class="meta-data">20-11-2025</p>
    </a>

([G208](https://www.w3.org/WAI/WCAG22/Techniques/general/G208), [F96](https://www.w3.org/WAI/WCAG22/Techniques/failures/F96))
