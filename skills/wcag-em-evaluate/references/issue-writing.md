# Writing an issue for a WCAGify report

An issue is one markdown file in `content/reports/<slug>/`, one defect per file, written for the
developer or editor who will fix it. The commissioner reads it too. Everything an evaluator needs
but a developer does not (certainty, the probe output, the reasoning, other candidates) stays in
`.notes/audit/`.

## File

`scripts/add-issue.mjs` writes it from a draft (`--from`), validates the frontmatter against the
package's `issueSchema`, places the images, and prints the anchor of the issue in the report
(`#issue-reports-<report-slug>-<issue-slug>`). Write drafts to `.notes/audit/drafts/<slug>.md`.

```markdown
---
title: Focus style missing on interactive elements
sc: 2.4.7
sample: page-1
severity: Medium
type: Design
images:
  - file: ../evidence/page-1-nav-focus.png
    alt: The main navigation with the "Products" link focused; it looks the same as the other links.
---

The homepage has no visible focus style on the navigation links, the search button and the
"Log in" button: `:focus` styles are reset with `outline: none` and nothing replaces them.
Keyboard users cannot see which element will activate when they press Enter.

#### Recommendation

Give every interactive element a focus indicator, for example with `:focus-visible`:

    a:focus-visible, button:focus-visible { outline: 3px solid #005fcc; outline-offset: 2px; }

The indicator needs a contrast of at least 3:1 against the surrounding colours
([C40](https://www.w3.org/WAI/WCAG22/Techniques/css/C40), [G195](https://www.w3.org/WAI/WCAG22/Techniques/general/G195)).
```

| Field        | Value                                                                                                                                                                                                                                                                                                                                                                        |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`      | The defect in plain words, at most 80 characters, in the report's `language`. Names the component and what is wrong ("Form fields in the checkout have no label"), never the criterion.                                                                                                                                                                                      |
| `sc`         | The criterion the defect fails. A defect that fails two criteria is one file under the criterion whose requirement it breaks most directly, with the other named in the text; a second file only when the fix or the audience differs.                                                                                                                                       |
| `sample`     | The id from `index.md` of the sample where the evidence was taken. Recurrences on other samples are named in the description ("Also on the contact page (page-2) and the search results (page-5)").                                                                                                                                                                          |
| `severity`   | `High`: blocks a task or hides content for a group of users (keyboard trap, unlabelled fields in a purchase flow, no captions on a required video, any non-interference criterion). `Medium`: makes a task markedly harder or affects the whole product (no focus indicator, low contrast on body text, missing headings). `Low`: a minor hindrance with an easy workaround. |
| `type`       | `Technical`: fixed in markup, script or configuration. `Content`: fixed in the editorial content (alt text, captions, link text, language of a passage, wording). `Design`: fixed in the visual design (contrast, size, spacing, focus style, layout).                                                                                                                       |
| `difficulty` | Optional; only when the fix is obviously trivial (`Low`) or needs a rebuild of a component (`High`).                                                                                                                                                                                                                                                                         |
| `images`     | Evidence first: one screenshot, or a GIF for anything that moves or is a sequence. Every image has an alt text that describes what is seen, in the report's language.                                                                                                                                                                                                        |

## Body

1. **The problem**, one to three short paragraphs: which component, on which page, what is wrong,
   and who is affected how. Concrete: the element by its visible name, the state it was in, the
   measured value where there is one ("contrast 2.9:1 against the required 4.5:1"). Inline code
   for attribute, element and property names; bold for the one element the reader must find; a
   short list when several elements share the defect. Steps to reproduce only when the state is
   not obvious ("Open the menu, press Tab twice").
2. `#### Recommendation`, always this exact heading, then the fix: one concrete way to solve it,
   with a minimal code example when it makes the fix unambiguous, and the W3C technique(s) it
   follows as links. Options only when the choice really is the developer's to make.

Length: the whole body fits on one screen. Rich text serves clarity: code spans, a list, a
snippet, bold on the subject. Headings other than the recommendation, tables and long quotes do
not belong in an issue.

## Evidence

- Screenshot of the element in the failing state, with the subject drawn: `agent-browser
highlight "<css>"` then `agent-browser screenshot .notes/audit/evidence/<sample>-<slug>.png`.
  An element screenshot (`screenshot "<css>" <path>`) when the page around it adds nothing.
- Before/after states as two images, or one GIF when the sequence is the point: `record start
<path>.webm`, perform the steps, `record stop`; the script converts it to a GIF (10 fps, at most
  800 px wide). Keep recordings under ten seconds.
- Alt text describes the evidence for a reader who cannot see it: what is shown and what is wrong
  in it ("The date field with the error 'Invalid' shown in red only, without text explaining the
  expected format").
- Never a certainty, a probe dump or a selector path in the image or its alt text.

## Language

Issues are written in the report's `language` (`nl` or `en`), including titles, alt texts and the
recommendation. The recommendation heading stays `#### Recommendation` in both languages
(`check-audit.mjs` also accepts `#### Aanbeveling`). Technique links keep their English titles.

## Tips

A finding that is not a failure of any criterion but worth passing on (a best-practice axe rule, an
AAA criterion outside the target, a usability observation) is a tip: `sc: none`, same file format,
no severity. Tips never change the conformance outcome.
