---
title: 'The "Inclusief" list in the account price panel is broken markup'
sc: 1.3.1
severity: Low
type: Technical
difficulty: Low
sample: page-30
---

![The account application page with, in the right-hand column, the green price panel "Je betaalt per maand € 4,30" and under "Inclusief:" a list of six features with check marks, the last being "Veilig bankieren tips en hulp".](/api/uploads/test-audit/the-inclusief-list-in-the-account-price-panel-is-broken-markup-1-3-1-3c06a1de.webp)

The price panel beside step 1 of the application lists what the account includes under **"Inclusief:"**. The sixth item, "Veilig bankieren tips en hulp", is wrapped in a Mendix container `div` inside the `ul`, so the list has a `div` child and that item has no list parent:

    <ul class="… mx-name-hTMLElement18">
      <li>Betaalrekening</li> … <li>Apple Pay en Google Pay</li>
      <div class="mx-name-container5"><li>Veilig bankieren tips en hulp</li></div>
    </ul>

axe reports `list` and `listitem` violations in every state that shows the panel, including the phone-width price sheet. Chrome repairs it into six items, but other browsers and screen readers may report a list of five followed by a stray item.

#### Recommendation

Put the condition on the `li` itself instead of wrapping it in a container, so every item is a direct child of the `ul` ([H48](https://www.w3.org/WAI/WCAG22/Techniques/html/H48)).
