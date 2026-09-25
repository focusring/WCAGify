---
title: Error messages in the account application do not say what the right value looks like
sc: 3.3.3
severity: Medium
type: Content
sample: page-30
---

![The date-of-birth boxes on step 2 of the account application filled in as 15, 06 and 90, with the error "De ingevulde datum is ongeldig. Kies een andere datum." under them.](/api/uploads/test-audit/error-messages-in-the-account-application-do-not-say-what-the-right-value-looks--3-3-3-970d9d6d.webp)

On step 2 of the application several error messages say that a value is wrong, but not what the right one looks like, although the form knows:

- Geboortedatum "15-06-90": "<span lang="nl">De ingevulde datum is ongeldig. Kies een andere datum.</span>" The date is fine. Only the year needs four digits, which neither the message nor the label "Jaar" says.
- Postcode "abcd": "<span lang="nl">De postcode is onjuist. Vul een geldige postcode in.</span>" It gives no format (1234 AB).
- Belgian tax number "85.07.30-033.28": "<span lang="nl">Ongeldig nummer</span>", and nothing else.
- **Straat** and **Plaats** after an empty "Volgende": "<span lang="nl">Je hebt niets ingevuld. Vul een antwoord in om door te gaan.</span>" These two fields are disabled at that point, because the postcode lookup fills them, so the advice cannot be followed. The fix is to enter Postcode and Huisnummer.
- Postcode and house number not found: "<span lang="nl">We konden geen gegevens vinden met deze postcode/huisnummer combinatie.</span>" Straat and Plaats then become editable without a word, and the message does not say the address can now be typed in.

The same form shows it can be done: "<span lang="nl">We herkennen je BSN niet. Controleer of het klopt en uit 9 cijfers bestaat.</span>"

#### Recommendation

Put the correct form in each message: "<span lang="nl">Vul het jaar in met 4 cijfers, bijvoorbeeld 1990</span>", "<span lang="nl">Vul je postcode in als 1234 AB</span>", "<span lang="nl">Vul alleen de cijfers in, bijvoorbeeld 85073003328</span>". Show "<span lang="nl">Vul eerst je postcode en huisnummer in</span>" instead of an error on Straat and Plaats, and after a failed lookup "<span lang="nl">Controleer je postcode en huisnummer, of vul je straat en plaats zelf in</span>" ([G85](https://www.w3.org/WAI/WCAG22/Techniques/general/G85), [G177](https://www.w3.org/WAI/WCAG22/Techniques/general/G177)).
