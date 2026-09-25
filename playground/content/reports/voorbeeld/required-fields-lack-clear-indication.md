---
title: Verplichte velden zijn niet aangegeven
sc: 3.3.2
severity: Medium
type: Design
difficulty: Medium
sample: page-2
---

Het contactformulier heeft velden die ingevuld moeten worden, maar niets vertelt gebruikers welke dat zijn. Pas na het verzenden blijkt dat naam en e-mailadres verplicht waren. Dat is verwarrend voor iedereen, en zeker voor mensen met een cognitieve beperking.

De velden zijn zo opgemaakt:

```html
<div class="input-field">
  <label for="fullname">Fullname:</label>
  <input type="text" id="fullname" required />
</div>
<div class="input-field">
  <label for="email">Email:</label>
  <input type="email" id="email" required />
</div>
```

#### Aanbeveling

Zet in het label welke velden verplicht zijn, zodat de instructie zichtbaar is voordat het veld wordt gebruikt en schermlezers hem samen met het label voorlezen:

```html
<div class="input-field">
  <label for="fullname">Fullname (required)</label>
  <input type="text" id="fullname" required />
</div>
<div class="input-field">
  <label for="email">Email (required)</label>
  <input type="email" id="email" required />
</div>
```

Wordt er een sterretje gebruikt, leg de betekenis daarvan dan één keer uit bovenaan het formulier.
