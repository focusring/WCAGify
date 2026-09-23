---
title: Empty and nested headings garble the heading outline of the service page
sc: 1.3.1
severity: Medium
type: Technical
difficulty: Low
sample: page-4
---

![The service page with the hero "Service en Contact" and below it the white card with "Goedemiddag," outlined in red, the smaller line "Waarmee kunnen we je vooruit helpen?" and the search field.](/api/uploads/test-audit/empty-and-nested-headings-garble-the-heading-outline-of-the-service-page-1-3-1-e85a8ae3.webp)

The top of the Service en Contact page has three heading errors in one block:

- under the page heading "Service en Contact" sits an **empty** `<h2 class="emc-mt-2 emc-h3"></h2>`. It shows nothing, but a screen reader lists it as a level-2 heading with no text;
- the greeting is marked up as `<h1 class="greeting"><h2>Goedemiddag,</h2></h1>`: **a level-2 heading inside a level-1 heading**, so one line on screen becomes two headings with the same text;
- the small line "Waarmee kunnen we je vooruit helpen?" (20 px) is a third `<h1>`, beside headings drawn at 40 and 32 px.

Screen-reader users who move by headings get an outline that does not match what the page shows: a blank entry, a greeting twice and three level-1 headings. That the greeting is used as a heading at all is the separate issue "A time-of-day greeting is the heading of the search block".

The address-change page (page-22) has an empty heading too: the section widget "Of e-mail, telefoonnummer of naam" renders an empty `<h2>` between that title and "Adres wijzigen voor jezelf".

#### Recommendation

Remove the empty headings, give the page one `h1`, and mark the greeting and the question as what they look like:

    <h1>Service en Contact</h1>
    …
    <p class="greeting">Goedemiddag,</p>
    <h2>Waarmee kunnen we je vooruit helpen?</h2>

([H42](https://www.w3.org/WAI/WCAG22/Techniques/html/H42), [F43](https://www.w3.org/WAI/WCAG22/Techniques/failures/F43)).
