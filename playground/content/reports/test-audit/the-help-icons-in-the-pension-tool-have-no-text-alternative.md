---
title: The help icons in the pension tool have no text alternative
sc: 1.1.1
severity: High
type: Technical
sample: page-21
---

![The result step of the pension tool, showing nine rows of figures each followed by a small round information icon.](/api/uploads/test-audit/the-help-icons-in-the-pension-tool-have-no-text-alternative-1-1-1-6e8ab9b9.webp)

The pension tool shown on this page offers an information icon next to each figure it asks for and each figure it returns. Every one of them is an `<img src="/abnamro/img/sy-others-info.svg">` **with no `alt` attribute**, and the link that wraps it carries no `title` and no text either.

There are **two on the first step** (next to "startkapitaal" and "inlegMnd") and **nine more on the result step**. On the first step the wrapping link at least carries `title="Klik voor meer uitleg"`; on the result step it carries no title either, so **nine controls are completely nameless** — and those nine are the only route to the explanation of each figure the tool returns.

The control is also the wrong element for the job. Each one is `<a type="button" class="btn">` with **no `href`, no `role` and no `tabindex`**, so it exposes no control role and **is not in the tab order at all**: a keyboard user cannot reach any of the eleven, and clicking one leaves focus on `<body>`. Automated testing does not catch the missing name here, because axe's `link-name` rule only applies to links that have an `href`.

The tool is run by an outside supplier on `rekentools.webbridge.nl` and is shown inside this page. The host page itself has no violations of this kind.

#### Recommendation

Give each icon a name that says which figure it explains, and make it a real button:

    <button type="button" aria-label="What is starting capital?">
      <img src="/abnamro/img/sy-others-info.svg" alt="">
    </button>

A real `<button>` fixes three things at once: it gives the control a name, a role, and a place in the tab order. The `alt=""` keeps the decorative image out of the accessibility tree once the button carries the name ([H37](https://www.w3.org/WAI/WCAG22/Techniques/html/H37), [ARIA6](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA6), [F42](https://www.w3.org/WAI/WCAG22/Techniques/failures/F42)).
