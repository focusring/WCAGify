---
title: Focusstijl ontbreekt op interactieve elementen
sc: 2.4.7
severity: Medium
type:
sample: page-1
---

![Zoekresultaatkaart voor een vlucht van LOT Polish Airlines, met een vlucht van AMS naar WAW om 07:00 en van WAW naar ZRH om 17:00, beide gemarkeerd als Direct.](/api/uploads/voorbeeld/focus-style-missing-2-4-7-4fd52680.png)

Op de homepage ontbreekt een zichtbare focusstijl op meerdere interactieve elementen, waaronder navigatielinks en knoppen. Daardoor is het voor toetsenbordgebruikers onduidelijk welk element de focus heeft.

#### Aanbeveling

Voeg een duidelijk zichtbare focusstijl toe aan alle interactieve elementen. Gebruik CSS `:focus-visible` om een focusindicator te tonen met een contrastverhouding van minimaal 3:1 ten opzichte van de achtergrond.
