---
title: 'Two choosers in the mortgage-rate tool are both announced as "Button"'
sc: 4.1.2
severity: High
type: Technical
sample: page-15
---

![The filters of the mortgage-rate tool with the "Energielabel" chooser open. Its list runs from "A++++ met Energie Prestatie Garantie" down to a highlighted A. Beside it, the "Kies een hypotheeksoort" chooser shows "Budget Hypotheek".](/api/uploads/test-audit/two-choosers-in-the-mortgage-rate-tool-are-both-announced-as-button-4-1-2-a630429f.webp)

The mortgage-rate tool embedded on this page sets the rates in its table with two `aab-select` choosers, **"<span lang="nl">Kies een hypotheeksoort</span>"** and **"Energielabel"**. Inside the component, both buttons carry `aria-label="Button"` plus an `aria-labelledby=" aab-select-target"` that points at the button itself, so the accessibility tree reads `button "Button"` for both. Their lists are named `aria-label="Dropdown"`.

A screen-reader user tabbing through the filters hears "Button" twice and cannot tell what either one chooses. The `aria-label` also overrides the button's text, so the chosen value ("<span lang="nl">Budget Hypotheek</span>", "A") is not exposed while the list is closed. The visible labels do not help, because their `for` points at the `aab-select` host element, which a label cannot name. Speech-input users cannot say "<span lang="nl">Kies een hypotheeksoort</span>" or "Energielabel" to reach the controls either, since neither word is in the name (this also fails 2.5.3).

With a list open, the arrow keys move a visible highlight, but `aria-activedescendant` is set on the list (`ul tabindex="-1"`), which never has focus, instead of on the focused button. Nobody is told which option the highlight is on until Enter commits it. The same `aab-select` leaves the active option unexposed in the mortgage wizard's "<span lang="nl">Wat is uw werksituatie?</span>" chooser (page-31), whose button has no `aria-controls` either. There the button has no `aria-label`, but its `aria-labelledby=" aab-select-target"` points at itself, so its name is only the chosen value, "<span lang="nl">Vast contract</span>", without the question, and its list is again named "Dropdown".

#### Recommendation

Remove the hard-coded `aria-label="Button"` and `"Dropdown"` defaults from `aab-select`. Render the visible label inside the component, or pass its text in, and follow the select-only combobox pattern:

    <span id="energy-label">Energielabel</span>
    <button role="combobox" aria-labelledby="energy-label" aria-expanded="true"
            aria-controls="energy-list" aria-activedescendant="energy-option-a">A</button>
    <ul id="energy-list" role="listbox" aria-labelledby="energy-label">…</ul>

The value stays the button's content, and `aria-activedescendant` belongs on the element that has focus ([ARIA16](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA16), [G208](https://www.w3.org/WAI/WCAG22/Techniques/general/G208), [APG select-only combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/)).
