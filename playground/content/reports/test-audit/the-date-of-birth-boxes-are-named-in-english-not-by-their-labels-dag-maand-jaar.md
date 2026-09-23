---
title: 'The date-of-birth boxes are named in English, not by their labels Dag, Maand, Jaar'
sc: 2.5.3
severity: Medium
type: Technical
difficulty: Low
sample: page-30
---

![The date-of-birth question on step 2 of the account application, outlined in red, with three boxes and the small labels "Dag", "Maand" and "Jaar" underneath them.](/api/uploads/test-audit/the-date-of-birth-boxes-are-named-in-english-not-by-their-labels-dag-maand-jaar-2-5-3-3122ddd8.webp)

On step 2 of the application ("Je gegevens"), the question **"Geboortedatum"** has three boxes with the labels "Dag", "Maand" and "Jaar" underneath. Those words are plain `span` text tied to nothing. The boxes take their names from `aria-label` instead: "date of birth, day", "date of birth, month" and "date of birth, year".

- Speech-input users who say "klik Dag" reach nothing, because the visible word is not in the name.
- The relationship the eye reads, that this box is the day, reaches assistive technology only as different words in another language. This also fails 1.3.1.
- On this Dutch page the English names have no `lang="en"`, so a Dutch voice mispronounces them (3.1.2, also listed in "English control names on Dutch pages are not marked as English").

#### Recommendation

Make the visible words the labels and drop the English `aria-label`s. The legend "Geboortedatum" already gives the group its context:

    <fieldset><legend>Geboortedatum</legend>
      <input id="dob-day" inputmode="numeric"> <label for="dob-day">Dag</label>
      …
    </fieldset>

`aria-labelledby` pointing at the existing spans works too ([H44](https://www.w3.org/WAI/WCAG22/Techniques/html/H44), [H71](https://www.w3.org/WAI/WCAG22/Techniques/html/H71), [G208](https://www.w3.org/WAI/WCAG22/Techniques/general/G208)).
