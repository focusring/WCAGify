# Reports

Reports are the core output of WCAGify. Each report represents a WCAG accessibility audit for a specific website or application.

## Report Structure

A report lives in `content/reports/{slug}/` and consists of:

- **`index.md`** — The report metadata and summary (frontmatter with evaluation details)
- **Individual issue files** — One markdown file per finding (e.g. `focus-style-missing.md`)

## Report Sections

Reports follow a defined section order:

1. Header and metadata
2. Executive summary
3. Scorecard
4. About this report
5. Scope: evaluated product, scope items, additional requirements, baseline and technologies
6. Representative sample set
7. Issues
8. Tips and recommendations

## Creating a Report

Create a new directory under `content/reports/` with a descriptive slug:

```
content/reports/my-audit/
├── index.md
├── missing-alt-text.md
├── low-contrast.md
└── keyboard-trap.md
```

### Report Frontmatter

The `index.md` file uses frontmatter to define report metadata. The fields follow the
[WCAG Evaluation Methodology (WCAG-EM) 2.0](https://www.w3.org/TR/wcag-em-2/): the
evaluation scope (Step 1), the technologies relied upon (Step 2), the representative
sample set (Step 3) and the outcome per success criterion (Step 4).

```yaml
---
title: Accessibility audit Example Website
description: Accessibility audit for Example Website according to WCAG 2.2 level AA.
language: en
evaluation:
  evaluator: Your Name
  commissioner: Client Name
  target: Example Website, including the web shop on shop.example.com
  targetLevel: AA
  targetWcagVersion: '2.2'
  date: '2026-01-15'
  specialRequirements: Report every occurrence of an issue, not only representative examples.
scope:
  - https://example.com
outOfScope:
  - https://example.com/legacy
baseline:
  - Windows 11 with Chrome and NVDA
  - macOS with Safari and VoiceOver
technologies:
  - HTML
  - CSS
  - JavaScript
  - WAI-ARIA
sample:
  - title: Homepage
    id: page-1
    url: https://example.com
    description: The homepage of the website
scStatuses:
  passed:
    - '1.1.1'
    - '1.3.1'
  not-present:
    - '1.2.1'
---
```

| Field                            | Description                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------- |
| `evaluation.target`              | Definition of the evaluated digital product (WCAG-EM Step 1.1)                                  |
| `evaluation.targetLevel`         | Conformance target: `A`, `AA` or `AAA` (Step 1.2)                                               |
| `evaluation.targetWcagVersion`   | WCAG version evaluated against: `'2.0'`, `'2.1'` or `'2.2'`                                     |
| `evaluation.specialRequirements` | Additional evaluation requirements agreed with the commissioner (Step 1.4)                      |
| `scope` / `outOfScope`           | What is and is not part of the evaluated product                                                |
| `baseline`                       | Accessibility support baseline: operating system, browser and assistive technology combinations |
| `technologies`                   | Technologies relied upon (Step 2.4)                                                             |
| `sample`                         | The representative sample set. Issues refer to a sample by its `id`.                            |
| `scStatuses`                     | Outcome per success criterion without issues: `passed` or `not-present`                         |

### Scoring

The scorecard and the conformance result count a success criterion as met only when it
has a recorded outcome:

- A criterion with one or more issues counts as **failed**.
- A criterion listed under `scStatuses.passed` or `scStatuses.not-present` counts as **met**.
- A criterion without issues and without a recorded outcome counts as **not tested** and
  is not counted as met.

Record an outcome for every criterion you evaluated. A report that only lists issues shows
all remaining criteria as not tested.

## EARL Export

Reports can also be downloaded as machine-readable EARL (JSON-LD), the format recommended by
WCAG-EM Step 5.5 and used by the W3C WCAG-EM Report Tool. EARL documents from other tools can be
imported as reports through the UI, the `wcagify-import-earl` CLI or `POST /api/earl/import`. See
the [EARL reference](/reference/earl).

## PDF Export

Reports can be exported as accessible PDFs with:

- Cover page with report metadata
- Running headers and page numbers
- Proper heading structure for assistive technologies
