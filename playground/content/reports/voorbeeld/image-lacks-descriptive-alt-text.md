---
title: Afbeelding heeft geen beschrijvende alt-tekst
sc: 1.1.1
severity: Medium
type: Content
difficulty: Low
sample: page-4
---

De afbeelding in het artikel heeft een leeg `alt`-attribuut. Een leeg `alt` markeert een afbeelding als decoratief, waardoor schermlezers haar overslaan. Hier draagt de afbeelding betekenis, dus gebruikers van een schermlezer missen de informatie die ziende lezers eruit halen.

De afbeelding is zo opgemaakt:

```html
<img src="awesome_cat.jpg" alt="" />
```

#### Aanbeveling

Geef een beschrijvende `alt`-tekst. De tekst moet de inhoud en functie van de afbeelding in de context van het artikel weergeven:

```html
<img src="awesome_cat.jpg" alt="Een schattige kat die ontspannen ligt te luieren" />
```

Gebruik een leeg `alt` alleen voor afbeeldingen die puur decoratief zijn en niets toevoegen aan de inhoud.
