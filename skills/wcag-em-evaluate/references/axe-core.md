# axe-core in this skill

[axe-core](https://github.com/dequelabs/axe-core) is the deterministic part of the evaluation:
the same page state gives the same result every run. agent-browser vendors the engine and runs it
through CDP across the frame tree, so no script is injected into the page and a strict CSP does
not block it. Version at the time of writing: **axe-core 4.12.1** (agent-browser 0.37.1); the
`--json` result carries the exact version in `axeVersion`, and `scripts/axe-page.mjs` records it in
every result file. Rule pages: <https://dequeuniversity.com/rules/axe/4.12/> (`4.12` in the URL
matches the engine's major.minor).

## The rule

Where a rule below decides a criterion, its result stands: a **violation** from a rule whose
"Reports" column includes `failure` is a failure of that criterion with certainty 100, and the
evaluator does not re-test what axe already settled. Everything a rule cannot decide (the
"Leaves open" list in each criterion file) is tested by hand. axe never proves a pass: a clean run
means only that the automatable part found nothing.

## Running it

`scripts/axe-page.mjs` wraps `agent-browser a11y --json`. It reads the target level and version
from the report's `index.md`, selects the matching tags, runs the audit on the page currently open
in the session, writes the full result to `.notes/audit/axe/<sample>[--<state>].json`, and prints
one line per criterion with the rule ids and node counts:

```bash
node <skill-dir>/scripts/axe-page.mjs --report <report-dir> --sample page-3 [--state cookie-dialog]
```

Tags per target (rules tagged with any of them run; `best-practice`, `experimental` and
`deprecated` never run):

| Target                | Tags                                            |
| --------------------- | ----------------------------------------------- |
| WCAG 2.0 A / AA / AAA | `wcag2a`, `wcag2aa`, `wcag2aaa` up to the level |
| WCAG 2.1 A / AA / AAA | the 2.0 tags plus `wcag21a`, `wcag21aa`         |
| WCAG 2.2 A / AA / AAA | the 2.1 tags plus `wcag22aa`                    |

Run it on every state of a sample that shows different content: the page as loaded, then each
dialog, expanded menu, opened disclosure, form error state and step of an in-page wizard that the
manual passes reach. A state that was never audited by axe was not evaluated.

## Reading the result

- `violations`: rules that failed, each with `impact`, `help`, `helpUrl`, `tags`, `nodeCount` and up
  to 10 `nodes` (`target` selector path, `html`, `failureSummary`). When `nodeCount` is above 10,
  the notes record the count and the report's issue names the pattern with the first occurrences;
  `--selector <css>` scopes a rerun to a subtree when more occurrences are needed.
- `incomplete`: rules that could not decide ("needs review"). Each is a manual check, listed in the
  criterion file's axe table with the step that settles it. An `incomplete` result is never a fail
  on its own.
- `counts.passes` and `counts.inapplicable`: numbers only; the nodes are not returned.
- Rule tags `wcagNNN` give the criterion (`wcag131` = 1.3.1, `wcag1412` = 1.4.12). A rule tagged
  with two criteria fails both.
- Iframes: same-origin and cross-origin frames are audited; a node inside a frame has a `target`
  with one entry per frame boundary.

## Rules by success criterion (axe-core 4.12.1)

"Reports" is what the rule can produce: `failure` = violations, `needs review` = incomplete
results. "Default" says whether `a11y` runs the rule at all; rules marked off by default are
never run by this skill, so their criterion is tested by hand.

| Criterion    | Rule                                                                                                      | Reports               | Default                       | What it decides                                                                                                                                      |
| ------------ | --------------------------------------------------------------------------------------------------------- | --------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1.1        | [`aria-meter-name`](https://dequeuniversity.com/rules/axe/4.12/aria-meter-name)                           | failure, needs review | runs                          | Ensure every ARIA meter node has an accessible name                                                                                                  |
| 1.1.1        | [`aria-progressbar-name`](https://dequeuniversity.com/rules/axe/4.12/aria-progressbar-name)               | failure, needs review | runs                          | Ensure every ARIA progressbar node has an accessible name                                                                                            |
| 1.1.1        | [`image-alt`](https://dequeuniversity.com/rules/axe/4.12/image-alt)                                       | failure, needs review | runs                          | Ensure <img> elements have alternative text or a role of none or presentation                                                                        |
| 1.1.1, 4.1.2 | [`input-image-alt`](https://dequeuniversity.com/rules/axe/4.12/input-image-alt)                           | failure, needs review | runs                          | Ensure <input type="image"> elements have alternative text                                                                                           |
| 1.1.1        | [`object-alt`](https://dequeuniversity.com/rules/axe/4.12/object-alt)                                     | failure, needs review | runs                          | Ensure <object> elements have alternative text                                                                                                       |
| 1.1.1        | [`role-img-alt`](https://dequeuniversity.com/rules/axe/4.12/role-img-alt)                                 | failure, needs review | runs                          | Ensure [role="img"] elements have alternative text                                                                                                   |
| 1.1.1        | [`svg-img-alt`](https://dequeuniversity.com/rules/axe/4.12/svg-img-alt)                                   | failure, needs review | runs                          | Ensure <svg> elements with an img, graphics-document or graphics-symbol role have accessible text                                                    |
| 1.2.1        | [`audio-caption`](https://dequeuniversity.com/rules/axe/4.12/audio-caption)                               | needs review          | off by default (deprecated)   | Ensure <audio> elements have captions                                                                                                                |
| 1.2.2        | [`video-caption`](https://dequeuniversity.com/rules/axe/4.12/video-caption)                               | needs review          | runs                          | Ensure <video> elements have captions                                                                                                                |
| 1.3.1, 4.1.2 | [`aria-hidden-body`](https://dequeuniversity.com/rules/axe/4.12/aria-hidden-body)                         | failure               | runs                          | Ensure aria-hidden="true" is not present on the document body.                                                                                       |
| 1.3.1        | [`aria-required-children`](https://dequeuniversity.com/rules/axe/4.12/aria-required-children)             | failure, needs review | runs                          | Ensure elements with an ARIA role that require child roles contain them                                                                              |
| 1.3.1        | [`aria-required-parent`](https://dequeuniversity.com/rules/axe/4.12/aria-required-parent)                 | failure               | runs                          | Ensure elements with an ARIA role that require parent roles are contained by them                                                                    |
| 1.3.1        | [`definition-list`](https://dequeuniversity.com/rules/axe/4.12/definition-list)                           | failure               | runs                          | Ensure <dl> elements are structured correctly                                                                                                        |
| 1.3.1        | [`dlitem`](https://dequeuniversity.com/rules/axe/4.12/dlitem)                                             | failure               | runs                          | Ensure <dt> and <dd> elements are contained by a <dl>                                                                                                |
| 1.3.1        | [`list`](https://dequeuniversity.com/rules/axe/4.12/list)                                                 | failure               | runs                          | Ensure that lists are structured correctly                                                                                                           |
| 1.3.1        | [`listitem`](https://dequeuniversity.com/rules/axe/4.12/listitem)                                         | failure               | runs                          | Ensure <li> elements are used semantically                                                                                                           |
| 1.3.1        | [`p-as-heading`](https://dequeuniversity.com/rules/axe/4.12/p-as-heading)                                 | failure, needs review | off by default (experimental) | Ensure bold, italic text and font-size is not used to style <p> elements as a heading                                                                |
| 1.3.1        | [`table-fake-caption`](https://dequeuniversity.com/rules/axe/4.12/table-fake-caption)                     | failure               | off by default (experimental) | Ensure that tables with a caption use the <caption> element.                                                                                         |
| 1.3.1        | [`td-has-header`](https://dequeuniversity.com/rules/axe/4.12/td-has-header)                               | failure               | off by default (experimental) | Ensure that each non-empty data cell in a <table> larger than 3 by 3 has one or more table headers                                                   |
| 1.3.1        | [`td-headers-attr`](https://dequeuniversity.com/rules/axe/4.12/td-headers-attr)                           | failure, needs review | runs                          | Ensure that each cell in a table that uses the headers attribute refers only to other <th> elements in that table                                    |
| 1.3.1        | [`th-has-data-cells`](https://dequeuniversity.com/rules/axe/4.12/th-has-data-cells)                       | failure, needs review | runs                          | Ensure that <th> elements and elements with role=columnheader/rowheader have data cells they describe                                                |
| 1.3.4        | [`css-orientation-lock`](https://dequeuniversity.com/rules/axe/4.12/css-orientation-lock)                 | failure, needs review | off by default (experimental) | Ensure content is not locked to any specific display orientation, and the content is operable in all display orientations                            |
| 1.3.5        | [`autocomplete-valid`](https://dequeuniversity.com/rules/axe/4.12/autocomplete-valid)                     | failure, needs review | runs                          | Ensure the autocomplete attribute is correct and suitable for the form field                                                                         |
| 1.4.1        | [`link-in-text-block`](https://dequeuniversity.com/rules/axe/4.12/link-in-text-block)                     | failure, needs review | runs                          | Ensure links are distinguished from surrounding text in a way that does not rely on color                                                            |
| 1.4.2        | [`no-autoplay-audio`](https://dequeuniversity.com/rules/axe/4.12/no-autoplay-audio)                       | needs review          | runs                          | Ensure <video> or <audio> elements do not autoplay audio for more than 3 seconds without a control mechanism to stop or mute the audio               |
| 1.4.3        | [`color-contrast`](https://dequeuniversity.com/rules/axe/4.12/color-contrast)                             | failure, needs review | runs                          | Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds                                       |
| 1.4.4        | [`meta-viewport`](https://dequeuniversity.com/rules/axe/4.12/meta-viewport)                               | failure               | runs                          | Ensure <meta name="viewport"> does not disable text scaling and zooming                                                                              |
| 1.4.6        | [`color-contrast-enhanced`](https://dequeuniversity.com/rules/axe/4.12/color-contrast-enhanced)           | failure, needs review | runs                          | Ensure the contrast between foreground and background colors meets WCAG 2 AAA enhanced contrast ratio thresholds                                     |
| 1.4.12       | [`avoid-inline-spacing`](https://dequeuniversity.com/rules/axe/4.12/avoid-inline-spacing)                 | failure               | runs                          | Ensure that text spacing set through style attributes can be adjusted with custom stylesheets                                                        |
| 2.1.1        | [`frame-focusable-content`](https://dequeuniversity.com/rules/axe/4.12/frame-focusable-content)           | failure, needs review | runs                          | Ensure <frame> and <iframe> elements with focusable content do not have tabindex=-1                                                                  |
| 2.1.1, 2.1.3 | [`scrollable-region-focusable`](https://dequeuniversity.com/rules/axe/4.12/scrollable-region-focusable)   | failure               | runs                          | Ensure elements that have scrollable content are accessible by keyboard in Safari                                                                    |
| 2.1.1        | [`server-side-image-map`](https://dequeuniversity.com/rules/axe/4.12/server-side-image-map)               | needs review          | runs                          | Ensure that server-side image maps are not used                                                                                                      |
| 2.2.1        | [`meta-refresh`](https://dequeuniversity.com/rules/axe/4.12/meta-refresh)                                 | failure               | runs                          | Ensure <meta http-equiv="refresh"> is not used for delayed refresh                                                                                   |
| 2.2.2        | [`blink`](https://dequeuniversity.com/rules/axe/4.12/blink)                                               | failure               | runs                          | Ensure <blink> elements are not used                                                                                                                 |
| 2.2.2        | [`marquee`](https://dequeuniversity.com/rules/axe/4.12/marquee)                                           | failure               | runs                          | Ensure <marquee> elements are not used                                                                                                               |
| 2.2.4, 3.2.5 | [`meta-refresh-no-exceptions`](https://dequeuniversity.com/rules/axe/4.12/meta-refresh-no-exceptions)     | failure               | runs                          | Ensure <meta http-equiv="refresh"> is not used for delayed refresh                                                                                   |
| 2.4.1        | [`bypass`](https://dequeuniversity.com/rules/axe/4.12/bypass)                                             | needs review          | runs                          | Ensure each page has at least one mechanism for a user to bypass navigation and jump straight to the content                                         |
| 2.4.2        | [`document-title`](https://dequeuniversity.com/rules/axe/4.12/document-title)                             | failure               | runs                          | Ensure each HTML document contains a non-empty <title> element                                                                                       |
| 2.4.4, 4.1.2 | [`area-alt`](https://dequeuniversity.com/rules/axe/4.12/area-alt)                                         | failure, needs review | runs                          | Ensure <area> elements of image maps have alternative text                                                                                           |
| 2.4.4, 4.1.2 | [`link-name`](https://dequeuniversity.com/rules/axe/4.12/link-name)                                       | failure, needs review | runs                          | Ensure links have discernible text                                                                                                                   |
| 2.4.9        | [`identical-links-same-purpose`](https://dequeuniversity.com/rules/axe/4.12/identical-links-same-purpose) | needs review          | runs                          | Ensure that links with the same accessible name serve a similar purpose                                                                              |
| 2.5.3        | [`label-content-name-mismatch`](https://dequeuniversity.com/rules/axe/4.12/label-content-name-mismatch)   | failure               | off by default (experimental) | Ensure that elements labelled through their content must have their visible text as part of their accessible name                                    |
| 2.5.8        | [`target-size`](https://dequeuniversity.com/rules/axe/4.12/target-size)                                   | failure, needs review | runs                          | Ensure touch targets have sufficient size and space                                                                                                  |
| 3.1.1        | [`html-has-lang`](https://dequeuniversity.com/rules/axe/4.12/html-has-lang)                               | failure               | runs                          | Ensure every HTML document has a lang attribute                                                                                                      |
| 3.1.1        | [`html-lang-valid`](https://dequeuniversity.com/rules/axe/4.12/html-lang-valid)                           | failure               | runs                          | Ensure the lang attribute of the <html> element has a valid value                                                                                    |
| 3.1.1        | [`html-xml-lang-mismatch`](https://dequeuniversity.com/rules/axe/4.12/html-xml-lang-mismatch)             | failure               | runs                          | Ensure that HTML elements with both valid lang and xml:lang attributes agree on the base language of the page                                        |
| 3.1.2        | [`valid-lang`](https://dequeuniversity.com/rules/axe/4.12/valid-lang)                                     | failure               | runs                          | Ensure lang attributes have valid values                                                                                                             |
| 3.3.2        | [`form-field-multiple-labels`](https://dequeuniversity.com/rules/axe/4.12/form-field-multiple-labels)     | needs review          | runs                          | Ensure form field does not have multiple label elements                                                                                              |
| 4.1.1        | [`duplicate-id`](https://dequeuniversity.com/rules/axe/4.12/duplicate-id)                                 | failure               | off by default (deprecated)   | Ensure every id attribute value is unique                                                                                                            |
| 4.1.1        | [`duplicate-id-active`](https://dequeuniversity.com/rules/axe/4.12/duplicate-id-active)                   | failure               | off by default (deprecated)   | Ensure every id attribute value of active elements is unique                                                                                         |
| 4.1.2        | [`aria-allowed-attr`](https://dequeuniversity.com/rules/axe/4.12/aria-allowed-attr)                       | failure, needs review | runs                          | Ensure an element's role supports its ARIA attributes                                                                                                |
| 4.1.2        | [`aria-braille-equivalent`](https://dequeuniversity.com/rules/axe/4.12/aria-braille-equivalent)           | needs review          | runs                          | Ensure aria-braillelabel and aria-brailleroledescription have a non-braille equivalent                                                               |
| 4.1.2        | [`aria-command-name`](https://dequeuniversity.com/rules/axe/4.12/aria-command-name)                       | failure, needs review | runs                          | Ensure every ARIA button, link and menuitem has an accessible name                                                                                   |
| 4.1.2        | [`aria-conditional-attr`](https://dequeuniversity.com/rules/axe/4.12/aria-conditional-attr)               | failure               | runs                          | Ensure ARIA attributes are used as described in the specification of the element's role                                                              |
| 4.1.2        | [`aria-deprecated-role`](https://dequeuniversity.com/rules/axe/4.12/aria-deprecated-role)                 | failure               | runs                          | Ensure elements do not use deprecated roles                                                                                                          |
| 4.1.2        | [`aria-hidden-focus`](https://dequeuniversity.com/rules/axe/4.12/aria-hidden-focus)                       | failure, needs review | runs                          | Ensure aria-hidden elements are not focusable nor contain focusable elements                                                                         |
| 4.1.2        | [`aria-input-field-name`](https://dequeuniversity.com/rules/axe/4.12/aria-input-field-name)               | failure, needs review | runs                          | Ensure every ARIA input field has an accessible name                                                                                                 |
| 4.1.2        | [`aria-prohibited-attr`](https://dequeuniversity.com/rules/axe/4.12/aria-prohibited-attr)                 | failure, needs review | runs                          | Ensure ARIA attributes are not prohibited for an element's role                                                                                      |
| 4.1.2        | [`aria-required-attr`](https://dequeuniversity.com/rules/axe/4.12/aria-required-attr)                     | failure               | runs                          | Ensure elements with ARIA roles have all required ARIA attributes                                                                                    |
| 4.1.2        | [`aria-roledescription`](https://dequeuniversity.com/rules/axe/4.12/aria-roledescription)                 | failure, needs review | off by default (deprecated)   | Ensure aria-roledescription is only used on elements with an implicit or explicit role                                                               |
| 4.1.2        | [`aria-roles`](https://dequeuniversity.com/rules/axe/4.12/aria-roles)                                     | failure               | runs                          | Ensure all elements with a role attribute use a valid value                                                                                          |
| 4.1.2        | [`aria-tab-name`](https://dequeuniversity.com/rules/axe/4.12/aria-tab-name)                               | failure, needs review | runs                          | Ensure every ARIA tab node has an accessible name                                                                                                    |
| 4.1.2        | [`aria-toggle-field-name`](https://dequeuniversity.com/rules/axe/4.12/aria-toggle-field-name)             | failure, needs review | runs                          | Ensure every ARIA toggle field has an accessible name                                                                                                |
| 4.1.2        | [`aria-tooltip-name`](https://dequeuniversity.com/rules/axe/4.12/aria-tooltip-name)                       | failure, needs review | runs                          | Ensure every ARIA tooltip node has an accessible name                                                                                                |
| 4.1.2        | [`aria-valid-attr`](https://dequeuniversity.com/rules/axe/4.12/aria-valid-attr)                           | failure               | runs                          | Ensure attributes that begin with aria- are valid ARIA attributes                                                                                    |
| 4.1.2        | [`aria-valid-attr-value`](https://dequeuniversity.com/rules/axe/4.12/aria-valid-attr-value)               | failure, needs review | runs                          | Ensure all ARIA attributes have valid values                                                                                                         |
| 4.1.2        | [`button-name`](https://dequeuniversity.com/rules/axe/4.12/button-name)                                   | failure, needs review | runs                          | Ensure buttons have discernible text                                                                                                                 |
| 4.1.2        | [`duplicate-id-aria`](https://dequeuniversity.com/rules/axe/4.12/duplicate-id-aria)                       | needs review          | runs                          | Ensure every id attribute value used in ARIA and in labels is unique                                                                                 |
| 4.1.2        | [`frame-title`](https://dequeuniversity.com/rules/axe/4.12/frame-title)                                   | failure, needs review | runs                          | Ensure <iframe> and <frame> elements have an accessible name                                                                                         |
| 4.1.2        | [`frame-title-unique`](https://dequeuniversity.com/rules/axe/4.12/frame-title-unique)                     | needs review          | runs                          | Ensure <iframe> and <frame> elements contain a unique title attribute                                                                                |
| 4.1.2        | [`input-button-name`](https://dequeuniversity.com/rules/axe/4.12/input-button-name)                       | failure, needs review | runs                          | Ensure input buttons have discernible text                                                                                                           |
| 4.1.2        | [`label`](https://dequeuniversity.com/rules/axe/4.12/label)                                               | failure, needs review | runs                          | Ensure every form element has a label                                                                                                                |
| 4.1.2        | [`nested-interactive`](https://dequeuniversity.com/rules/axe/4.12/nested-interactive)                     | failure, needs review | runs                          | Ensure interactive controls are not nested as they are not always announced by screen readers or can cause focus problems for assistive technologies |
| 4.1.2        | [`select-name`](https://dequeuniversity.com/rules/axe/4.12/select-name)                                   | failure, needs review | runs                          | Ensure select element has an accessible name                                                                                                         |
| 4.1.2        | [`summary-name`](https://dequeuniversity.com/rules/axe/4.12/summary-name)                                 | failure, needs review | runs                          | Ensure summary elements have discernible text                                                                                                        |

## Best-practice rules (not WCAG)

These rules are tagged `best-practice` only and do not run under the WCAG tags. They never decide
an outcome; a finding from one of them is at most a note or a tip (`sc: none`), never an issue.

| Rule                                  | Reports               | What it decides                                                                                                                               |
| ------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `accesskeys`                          | failure               | Ensure every accesskey attribute value is unique                                                                                              |
| `aria-allowed-role`                   | failure, needs review | Ensure role attribute has an appropriate value for the element                                                                                |
| `aria-dialog-name`                    | failure, needs review | Ensure every ARIA dialog and alertdialog node has an accessible name                                                                          |
| `aria-text`                           | failure, needs review | Ensure role="text" is used on elements with no focusable descendants                                                                          |
| `aria-treeitem-name`                  | failure, needs review | Ensure every ARIA treeitem node has an accessible name                                                                                        |
| `empty-heading`                       | failure, needs review | Ensure headings have discernible text                                                                                                         |
| `empty-table-header`                  | failure, needs review | Ensure table headers have discernible text                                                                                                    |
| `frame-tested`                        | failure, needs review | Ensure <iframe> and <frame> elements contain the axe-core script                                                                              |
| `heading-order`                       | failure, needs review | Ensure the order of headings is semantically correct                                                                                          |
| `image-redundant-alt`                 | failure               | Ensure image alternative is not repeated as text                                                                                              |
| `label-title-only`                    | failure               | Ensure that every form element has a visible label and is not solely labeled using hidden labels, or the title or aria-describedby attributes |
| `landmark-banner-is-top-level`        | failure               | Ensure the banner landmark is at top level                                                                                                    |
| `landmark-contentinfo-is-top-level`   | failure               | Ensure the contentinfo landmark is at top level                                                                                               |
| `landmark-main-is-top-level`          | failure               | Ensure the main landmark is at top level                                                                                                      |
| `landmark-no-duplicate-banner`        | failure               | Ensure the document has at most one banner landmark                                                                                           |
| `landmark-no-duplicate-contentinfo`   | failure               | Ensure the document has at most one contentinfo landmark                                                                                      |
| `landmark-no-duplicate-main`          | failure               | Ensure the document has at most one main landmark                                                                                             |
| `landmark-one-main`                   | failure               | Ensure the document has a main landmark                                                                                                       |
| `landmark-unique`                     | failure               | Ensure landmarks are unique                                                                                                                   |
| `meta-viewport-large`                 | failure               | Ensure <meta name="viewport"> can scale a significant amount                                                                                  |
| `page-has-heading-one`                | failure               | Ensure that the page, or at least one of its frames contains a level-one heading                                                              |
| `presentation-role-conflict`          | failure               | Ensure elements marked as presentational do not have global ARIA or tabindex so that all screen readers ignore them                           |
| `region`                              | failure               | Ensure all page content is contained by landmarks                                                                                             |
| `scope-attr-valid`                    | failure               | Ensure the scope attribute is used correctly on tables                                                                                        |
| `skip-link`                           | failure, needs review | Ensure all skip links have a focusable target                                                                                                 |
| `tabindex`                            | failure               | Ensure tabindex attribute values are not greater than 0                                                                                       |
| `table-duplicate-name`                | failure, needs review | Ensure the <caption> element does not contain the same text as the summary attribute                                                          |
| `focus-order-semantics`               | failure               | Ensure elements in the focus order have a role appropriate for interactive content                                                            |
| `hidden-content`                      | failure, needs review | Inform users about hidden content.                                                                                                            |
| `landmark-complementary-is-top-level` | failure               | Ensure the complementary landmark or aside is at top level                                                                                    |

## Criteria with no axe-core rule

No rule is tagged with: 1.2.3, 1.2.4, 1.2.5, 1.2.6, 1.2.7, 1.2.8, 1.2.9, 1.3.2, 1.3.3, 1.3.6,
1.4.5, 1.4.7, 1.4.8, 1.4.9, 1.4.10, 1.4.11, 1.4.13, 2.1.2, 2.1.4, 2.2.3, 2.2.5, 2.2.6, 2.3.1,
2.3.2, 2.3.3, 2.4.3, 2.4.5, 2.4.6, 2.4.7, 2.4.8, 2.4.10, 2.4.11, 2.4.12, 2.4.13, 2.5.1, 2.5.2,
2.5.4, 2.5.5, 2.5.6, 2.5.7, 3.1.3, 3.1.4, 3.1.5, 3.1.6, 3.2.1, 3.2.2, 3.2.3, 3.2.4, 3.2.6, 3.3.1,
3.3.3, 3.3.4, 3.3.5, 3.3.6, 3.3.7, 3.3.8, 3.3.9, 4.1.3. These are evaluated entirely by hand,
with the probes in `scripts/probes/` where a measurement helps.

## Keeping this file current

Source: `doc/rule-descriptions.md` in the axe-core repository at the vendored version's tag
(<https://github.com/dequelabs/axe-core/blob/v4.12.1/doc/rule-descriptions.md>). When
`agent-browser a11y --json` reports another `axeVersion`, regenerate the tables from that tag's
file, then re-check the axe tables in `criteria/` against the new mapping.
