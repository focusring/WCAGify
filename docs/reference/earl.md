# EARL export and import

Every report can be downloaded as a machine-readable EARL report, as recommended in
[WCAG-EM 2.0 Step 5.5](https://www.w3.org/TR/wcag-em-2/#step5e). EARL is the
[Evaluation and Report Language](https://www.w3.org/WAI/standards-guidelines/earl/) of the W3C.
WCAGify serialises it as JSON-LD.

## Downloading

- In the app, use **Download EARL** on a report page or on a shared report.
- Over HTTP, request `/api/earl/{slug}` (admin session) or
  `/api/share/{token}/jsonld` (share link). Both respond with `application/ld+json`.

## Format

The document follows the data format of the
[W3C WCAG-EM Report Tool](https://github.com/w3c/wcag-em-report-tool/blob/master/docs/EARL+JSON-LD.md),
so it can be loaded into that tool and processed by anything that understands EARL 1.0.

```json
{
  "@context": { "...": "see below" },
  "@graph": [
    {
      "type": "Evaluation",
      "id": "https://audit.example/reports/example",
      "lang": "en",
      "title": "WCAG audit Example Website",
      "date": "2026-01-15",
      "creator": "_:evaluator",
      "commissioner": "Example Organisation",
      "wcagVersion": "2.2",
      "evaluationScope": {
        "type": "EvaluationScope",
        "conformanceTarget": "wai:WCAG2AA-Conformance",
        "accessibilitySupportBaseline": "Windows 11 with Chrome and NVDA",
        "additionalEvalRequirement": "None",
        "website": {
          "type": ["TestSubject", "WebSite"],
          "id": "_:website",
          "siteName": "Example Website",
          "siteScope": "https://example.com"
        }
      },
      "reliedUponTechnology": [
        { "type": "Technology", "id": "http://www.w3.org/TR/html5/", "title": "HTML" }
      ],
      "structuredSample": {
        "type": "Sample",
        "webpage": [
          {
            "type": ["TestSubject", "WebPage"],
            "id": "_:sample-page-1",
            "title": "Homepage",
            "description": "The homepage of the website",
            "source": "https://example.com",
            "tested": true
          },
          {
            "type": ["TestSubject", "WebPage"],
            "id": "_:sample-page-2",
            "title": "Contact page",
            "description": "Page with contact form",
            "source": "https://example.com/contact",
            "tested": true
          }
        ]
      },
      "auditResult": [
        {
          "type": "Assertion",
          "test": "WCAG2:keyboard",
          "assertedBy": "_:evaluator",
          "subject": "_:website",
          "mode": "earl:manual",
          "result": {
            "type": "TestResult",
            "outcome": "earl:failed",
            "description": "Dropdown not keyboard operable"
          },
          "hasPart": [
            {
              "type": "Assertion",
              "test": "WCAG2:keyboard",
              "assertedBy": "_:evaluator",
              "subject": ["_:sample-page-2"],
              "mode": "earl:manual",
              "result": {
                "type": "TestResult",
                "outcome": "earl:failed",
                "title": "Dropdown not keyboard operable",
                "description": "The contact form contains a custom dropdown...",
                "severity": "High"
              }
            }
          ]
        }
      ],
      "scorecard": { "conforming": 53, "failed": 2, "notTested": 0, "total": 55 }
    },
    { "id": "_:evaluator", "type": "Person", "name": "Jane Evaluator" }
  ]
}
```

### Mapping to WCAG-EM

| WCAG-EM step                           | Report field                                   | EARL property                                      |
| -------------------------------------- | ---------------------------------------------- | -------------------------------------------------- |
| 1.1 Scope of the digital product       | `evaluation.target`, `scope`, `outOfScope`     | `evaluationScope.website.siteName` and `siteScope` |
| 1.2 Conformance target                 | `evaluation.targetLevel`                       | `evaluationScope.conformanceTarget`                |
| 1.3 Accessibility support baseline     | `baseline`                                     | `evaluationScope.accessibilitySupportBaseline`     |
| 1.4 Additional evaluation requirements | `evaluation.specialRequirements`               | `evaluationScope.additionalEvalRequirement`        |
| 2.4 Technologies relied upon           | `technologies`                                 | `reliedUponTechnology`                             |
| 3.1 Structured sample set              | `sample`                                       | `structuredSample.webpage`                         |
| 4 Evaluation outcomes                  | issues and `scStatuses`                        | `auditResult` assertions                           |
| 5.1 About the evaluation               | `evaluation.evaluator`, `commissioner`, `date` | `creator`, `commissioner`, `date`                  |

### Assertions

`auditResult` holds one `earl:Assertion` per success criterion of the evaluated WCAG version at
the target conformance level, in specification order, plus one for every other criterion that has
issues. The subject is the whole product (`_:website`). The outcome follows the scoring rules of
the report:

| Report state                          | `earl:outcome`      |
| ------------------------------------- | ------------------- |
| One or more issues                    | `earl:failed`       |
| Listed under `scStatuses.passed`      | `earl:passed`       |
| Listed under `scStatuses.not-present` | `earl:inapplicable` |
| No recorded outcome                   | `earl:untested`     |

Each issue becomes a nested assertion in `hasPart`, asserted against the sample page it was found
on (`_:sample-{id}`). Its result carries the issue title, the issue body as text, and the WCAGify
fields `severity`, `issueType` and `difficulty`. Tips (issues with `sc: none`) are not exported.

### Success criterion identifiers

Criteria are identified by their anchor in the WCAG specification the report was evaluated
against, through the `WCAG2` prefix:

| `targetWcagVersion` | `WCAG2` prefix                  | Example                  |
| ------------------- | ------------------------------- | ------------------------ |
| `2.2`               | `http://www.w3.org/TR/WCAG22/#` | `WCAG2:non-text-content` |
| `2.1`               | `http://www.w3.org/TR/WCAG21/#` | `WCAG2:non-text-content` |
| `2.0`               | `http://www.w3.org/TR/WCAG20/#` | `WCAG2:text-equiv-all`   |

### WCAGify terms

Terms that are not part of EARL or the WCAG-EM Report Tool format live in the `wcagify`
namespace (`https://github.com/focusring/WCAGify/blob/main/docs/reference/earl.md#`):

| Term          | Meaning                                                                      |
| ------------- | ---------------------------------------------------------------------------- |
| `severity`    | Impact of an issue: `Low`, `Medium` or `High`                                |
| `issueType`   | Cause of an issue: `Content`, `Design` or `Technical`                        |
| `difficulty`  | Effort to fix an issue: `Low`, `Medium` or `High`                            |
| `wcagVersion` | WCAG version the report was evaluated against                                |
| `scorecard`   | Counts of criteria met, failed, not tested and the total at the target level |

## Importing EARL

EARL documents from WCAGify, the W3C WCAG-EM Report Tool, or automated testing tools that emit
EARL (axe-core, for example) can be imported as a report. The importer expands the JSON-LD, so
any context works. It reads:

- the WCAG-EM evaluation metadata when present (title, evaluator, commissioner, date, scope,
  conformance target, baseline, additional requirements, technologies, sample set);
- every `earl:Assertion`, mapping its `earl:test` to a success criterion through a WCAG 2.0, 2.1
  or 2.2 specification anchor, a quickref or Understanding URL, or a test case that is
  `dct:isPartOf` such a criterion (the axe-core convention);
- outcomes per criterion: `earl:failed` assertions become issues, `earl:passed` and
  `earl:inapplicable` outcomes become `scStatuses.passed` and `scStatuses.not-present`, while
  `earl:cantTell` and `earl:untested` leave the criterion not tested;
- subjects: web pages become samples, identified by their source URL, and findings against the
  product as a whole go to a synthetic `product` sample.

Tests that cannot be mapped to a criterion are skipped and listed as warnings.

All findings that map to a criterion are imported by default, and every channel lets you hand-pick: the dialog shows the
findings with checkboxes, the CLI lists them in `--dry-run --json` and takes `--skip-issues`, and
the API returns an `issueList` on a dry run and accepts `skipIssues` with the indices to leave out.
A criterion whose findings are all left out has no recorded outcome and stays not tested.

Two modes are available:

| Mode     | Effect                                                                                               |
| -------- | ---------------------------------------------------------------------------------------------------- |
| `create` | Creates `content/reports/{slug}/index.md` and one markdown file per issue. Fails if the slug exists. |
| `merge`  | Adds issues and recorded outcomes to an existing report and adds samples that new issues refer to.   |

In `merge` mode a criterion that gains issues loses any recorded pass, so the scorecard stays
consistent.

### UI

Use **Import EARL** on the reports overview. The file is parsed first and a preview shows the
title, WCAG version, number of samples, issues and recorded outcomes, and any warnings. Then choose
a new slug or an existing report to merge into.

### CLI

```bash
# Create a new report from an export
wcagify-import-earl audit.jsonld --slug my-audit

# Merge axe-core results into an existing report, machine-readable output
wcagify-import-earl axe-results.json --slug my-audit --merge --json

# Check what would happen without writing; lists every finding with its index
wcagify-import-earl audit.jsonld --dry-run --json

# Import everything except findings 2 and 5
wcagify-import-earl axe-results.json --slug my-audit --merge --skip-issues 2,5
```

Options: `--slug`, `--merge`, `--content-dir` (default `content`), `--language en|nl`, `--dry-run`,
`--skip-issues`, `--json`. Projects scaffolded with `create-wcagify` expose it as `pnpm earl:import`.

### API

`POST /api/earl/import` with an admin session. The body is JSON:

```json
{
  "earl": { "...": "the EARL document, or a JSON string" },
  "slug": "my-audit",
  "mode": "create",
  "language": "en",
  "dryRun": false,
  "skipIssues": [2, 5]
}
```

`slug` defaults to a slug of the evaluation title, `mode` to `create`. With `dryRun: true` nothing
is written and the response contains the summary plus `issueList`, every finding with its `index`,
title, criterion and sample; pass the indices to leave out as `skipIssues` on the real import. The response lists the slug, title, WCAG
version, counts, warnings and the files created or updated.

```bash
curl -X POST https://audit.example/api/earl/import \
  -H 'content-type: application/json' \
  -b 'wcagify-admin=...' \
  -d "{\"earl\": $(cat audit.jsonld), \"slug\": \"my-audit\"}"
```

This is the intended path for agents and integrations: export from another tool, post the EARL
document, read the summary. `GET /api/earl/{slug}` returns the report again as EARL.

## Programmatic use

```ts
import { buildEarlReport } from '@focusring/wcagify/earl'

const earl = buildEarlReport(report, issues, {
  baseUrl: 'https://audit.example',
  version: '0.5.1'
})
```

`report` and `issues` are the report and issue documents as stored by Nuxt Content. Markdown bodies
are converted to plain text for the EARL descriptions.

```ts
import { parseEarlReport, writeImportedReport } from '@focusring/wcagify/earl/import'

const imported = await parseEarlReport(document)
await writeImportedReport(imported, { contentDir: 'content', slug: 'my-audit', mode: 'merge' })
```

`parseEarlReport` returns the report frontmatter, the issues, warnings and statistics without
touching the file system. `writeImportedReport` writes them as content files.
