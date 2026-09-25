---
title: Call-to-action werkt niet met het toetsenbord
sc: 2.1.1
severity: High
type: Technical
difficulty: Low
sample: page-1
---

De call-to-action in de header reageert alleen op een muisklik. Het is een `div` met een klik-handler, dus hij zit niet in de tabvolgorde en reageert niet op Enter of spatie. Toetsenbordgebruikers en schermlezergebruikers kunnen hem helemaal niet bereiken.

De call-to-action is zo opgemaakt:

```html
<div class="link" onClick="navigateCallToAction()">Get a Quote!</div>
```

#### Aanbeveling

Gebruik een `a`-element voor navigatie en zet de bestemming in het `href`-attribuut:

```html
<a class="link" href="/request-a-quote">Get a Quote!</a>
```

Een link is standaard focusbaar en met het toetsenbord te bedienen, werkt zonder JavaScript en vertelt hulptechnologie en zoekmachines wat hij doet.
