# WCAGify agent skills

Skills that let a coding agent (Claude Code, Cursor, Codex, ...) carry out parts of a WCAG-EM
audit inside a WCAGify project. Each skill covers one step of the methodology and lives in its own
folder as `skills/<name>/SKILL.md`, with `references/` for source excerpts and `scripts/` for the
tools it runs.

| Skill                                  | Does                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [wcag-em-sample](./wcag-em-sample)     | Fixes the evaluation scope and selects the representative sample set (WCAG-EM 2.0 Steps 1.1, 2 and 3) by exploring the target with agent-browser, then writes it into the report's `index.md` and the evaluator notes into `.notes/sample.md` beside it.                                                                                                    |
| [wcag-em-evaluate](./wcag-em-evaluate) | Evaluates the sample set (WCAG-EM 2.0 Step 4) with axe-core for everything it decides and agent-browser for the rest, one reference file per Level A and AA success criterion, and writes the failures as issues with screenshots or GIFs placed the way the app's upload flow does. Built for a multi-agent runtime: one worker per sample and test group. |

## Installation

Into any project with the [`skills`](https://skills.sh) CLI:

```bash
npx skills add focusring/WCAGify
```

Inside this repository nothing needs installing: `.claude/skills/` symlinks every skill, so Claude
Code loads them in any session started here (`/wcag-em-sample`, `/wcag-em-evaluate`). To add a new skill, create it
under `skills/<name>/` and link it with `ln -s ../../skills/<name> .claude/skills/<name>`.

To load the same skills as the `wcagify` plugin from a checkout of this repository, for instance
from another project:

```bash
claude --plugin-dir /path/to/WCAGify
```

Plugin skills are namespaced, so the skill above is then `/wcagify:wcag-em-sample`.

## Requirements

- [agent-browser](https://github.com/vercel-labs/agent-browser): `npm i -g agent-browser && agent-browser install`
  (0.37 or later; it vendors the axe-core engine that `wcag-em-evaluate` relies on)
- `ffmpeg` on the PATH for recordings and GIFs (`brew install ffmpeg`); `agent-browser doctor` checks it
- A WCAGify project (`npm create wcagify@latest`, or the `playground/` of this repository) with
  its dependencies installed, so the scripts can validate against `@focusring/wcagify`.

## Example prompts

```
Select the WCAG-EM sample for the report "gemeente-portal" from https://portal.example.nl
```

```
Re-run the sampling for content/reports/webshop: keep half of the current sample, the app now runs on http://localhost:3000
```

```
Evaluate the report "gemeente-portal" with wcag-em-evaluate; run every unit of the plan as its own subagent and stop before anything that submits a real form
```

```
Resume the evaluation of content/reports/webshop: only the units still marked todo, then consolidate and write the issues
```

## Sources and maintenance

The skills paraphrase nothing from memory: every methodological rule is quoted from its source in
the skill's `references/` folder, with a link to the section it comes from.

| Skill            | Source                                                                                                                                                                      | Version used                                                        |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| wcag-em-sample   | [WCAG Evaluation Methodology (WCAG-EM) 2.0](https://www.w3.org/TR/wcag-em-2/), W3C Group Note, Accessibility Guidelines WG                                                  | [23 July 2026](https://www.w3.org/TR/2026/NOTE-wcag-em-2-20260723/) |
| wcag-em-sample   | [agent-browser](https://github.com/vercel-labs/agent-browser) `skills get core`                                                                                             | 0.37                                                                |
| wcag-em-sample   | Report frontmatter: `packages/wcagify/src/schemas.ts` (`reportSchema`)                                                                                                      | this repository                                                     |
| wcag-em-evaluate | [WCAG-EM 2.0](https://www.w3.org/TR/wcag-em-2/) Steps 4 and 5                                                                                                               | [23 July 2026](https://www.w3.org/TR/2026/NOTE-wcag-em-2-20260723/) |
| wcag-em-evaluate | [WCAG 2.2](https://www.w3.org/TR/WCAG22/) normative text, glossary and techniques (W3C `wcag.json`), [Understanding WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/) | fetched 22 September 2026                                           |
| wcag-em-evaluate | [ACT Rules](https://www.w3.org/WAI/standards-guidelines/act/rules/) (W3C)                                                                                                   | fetched 22 September 2026                                           |
| wcag-em-evaluate | [axe-core rule descriptions](https://github.com/dequelabs/axe-core/blob/v4.12.1/doc/rule-descriptions.md), as vendored by agent-browser                                     | 4.12.1 (agent-browser 0.37.1)                                       |
| wcag-em-evaluate | [WCAG in plain English](https://aaardvarkaccessibility.com/wcag-plain-english/) (aaardvark accessibility), secondary source for plain wording                               | fetched 22 September 2026                                           |
| wcag-em-evaluate | Issue frontmatter and image naming: `packages/wcagify/src/schemas.ts` (`issueSchema`), `src/content-utils.ts` (`buildIssueImageName`), `server/api/issues/`                 | this repository                                                     |

When W3C publishes a new version of WCAG-EM 2.0, diff it against the dated version above
(<https://www.w3.org/standards/history/wcag-em-2/>), update the quotes in each skill's
`references/wcag-em-2.md` and the steps in its `SKILL.md` that depend on them, and record the new
date here. When `reportSchema` changes, update the field table in `wcag-em-sample/SKILL.md` step 4
and `scripts/check-report.mjs`; when `issueSchema` or the upload flow changes, update
`wcag-em-evaluate/references/issue-writing.md` and `scripts/add-issue.mjs`. When
`agent-browser a11y --json` reports a new `axeVersion`, regenerate the tables in
`wcag-em-evaluate/references/axe-core.md` from that tag's `doc/rule-descriptions.md` and re-check
the axe tables in `references/criteria/`. The criteria files quote the WCAG 2.2 text verbatim; a
WCAG errata or a new Understanding edition is applied file by file.
