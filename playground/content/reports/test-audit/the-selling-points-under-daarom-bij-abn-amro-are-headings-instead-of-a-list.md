---
title: 'The selling points under "Daarom bij ABN AMRO" are headings instead of a list'
sc: 1.3.1
severity: Low
type: Technical
sample: page-12
---

![The section "Daarom bij ABN AMRO" with three short bold lines beside small icons, "Altijd en overal online", "Jij bepaalt hoe je betaalt" and "Al jouw geld op één veilige plek", each outlined in red. Nothing follows them before the next section, "Kosten bankrekening".](/api/uploads/test-audit/the-selling-points-under-daarom-bij-abn-amro-are-headings-instead-of-a-list-1-3-1-db2e3a65.webp)

Under the heading "<span lang="nl">Daarom bij ABN AMRO</span>" on the account-opening page, the eye reads three short selling points side by side: **"<span lang="nl">Altijd en overal online</span>"**, "<span lang="nl">Jij bepaalt hoe je betaalt</span>" and "<span lang="nl">Al jouw geld op één veilige plek</span>". In the markup each point is an `h3` inside its own `role="region"` card, and the card's content container is empty.

The accessibility tree is therefore one `h2`, three regions that hold nothing but a heading, and then the next section. Heading markup is used for three slogans that title no content, and the grouping of the three points as one list is missing. A reader moving by headings is sent to three sections that do not exist, which also fails 2.4.6 (Headings and Labels): each heading "describes" only the next heading.

The same pattern is in the "<span lang="nl">Jij bepaalt hoe je betaalt</span>" block on the payment-account page (page-13): the three checkmark lines "<span lang="nl">Snel contactloos betalen</span>", "<span lang="nl">Met Google Pay, Apple Pay of wearable</span>" and "<span lang="nl">Tot € 50 zonder pincode</span>" are `h3` elements with no content after them and no list around them.

#### Recommendation

Mark the points up as a list, keep the `h2` as the section title, and drop `role="region"` from cards that have no body:

    <h2>Daarom bij ABN AMRO</h2>
    <ul class="usp-list">
      <li><img src="…" alt=""> Altijd en overal online</li>
      <li><img src="…" alt=""> Jij bepaalt hoe je betaalt</li>
      <li><img src="…" alt=""> Al jouw geld op één veilige plek</li>
    </ul>

The bold style can stay on the list item ([H48](https://www.w3.org/WAI/WCAG22/Techniques/html/H48), [F43](https://www.w3.org/WAI/WCAG22/Techniques/failures/F43)).
