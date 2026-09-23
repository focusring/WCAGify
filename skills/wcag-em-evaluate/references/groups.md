# Test groups: one pass through a sample in one mode

A group is the unit of manual work: the criteria that are settled by walking a sample once in one
browser mode. A worker takes one `(sample, group)` unit from the plan, sets the browser up as
described here, walks the sample, and records one outcome per criterion in
`.notes/audit/findings/<sample>--<group>.md` (format in SKILL.md).

Read the criterion files one at a time, each when the walk reaches its criterion, not all of them
at the start. A group's files run to tens of thousands of tokens together, and a worker needs that
room for snapshots, probe output and screenshots. The order below is the reading order. Criteria in scope
come from the plan (`plan-audit.mjs --unit <id>` lists them); a criterion above the target level or
newer than the target version is skipped without a row.

Common setup for every group, after the session variable from SKILL.md is set:

```bash
agent-browser set viewport 1280 900
agent-browser open <sample url>
agent-browser wait --load networkidle
agent-browser snapshot -i            # refs for what follows
```

Cookie banners and consent dialogs are part of the sample: evaluate them first, in the state the
visitor meets them, then accept or close them once and continue. Each additional state the walk
reaches (a dialog, an open menu, a step of an in-page wizard, an error state) gets its own axe run:

```bash
node <skill-dir>/scripts/axe-page.mjs --report <report-dir> --sample <id> --state <short-slug>
```

## `recon` (per sample, first)

Not a criterion pass: the automated layer and the inventory the other passes start from.

1. `axe-page.mjs --sample <id>` on the initial state.
2. Every probe once: `images`, `structure`, `forms`, `focusables`, `links`, `targets`, `media`,
   `motion`, `nontext-contrast`; save each output to `.notes/audit/recon/<id>-<probe>.json`.
3. `agent-browser screenshot --full .notes/audit/evidence/<id>-full.png` and
   `agent-browser snapshot > .notes/audit/recon/<id>-tree.txt`.
4. Inventory the states: which dialogs, menus, disclosures, tabs, wizard steps and error states
   exist (from the snapshot and the sample's description in `.notes/sample.md`). Write them as a
   list in `.notes/audit/recon/<id>-states.md`; every group pass walks that list.
5. From the probe counts, mark the group units that have nothing to evaluate:
   `plan-audit.mjs --skip <id>/media --note "no audio, video or embeds"`, and the same for
   `forms` when there is no form control, `pointer` when the target has no touch or drag
   interactions beyond plain links and buttons (targets are still measured in `recon`, so 2.5.8 is
   recorded from its numbers). Everything else stays `todo`.

## `structure`

Mode: read, do not operate. Sources: the accessibility tree (`agent-browser snapshot`, full and
`-i`), the `images`, `structure`, `links`, `forms` probe outputs from `recon`, and the axe result.
Criteria: 1.1.1, 1.3.1, 1.3.2, 1.3.3, 1.3.6, 2.4.2, 2.4.4, 2.4.6, 2.4.9, 2.4.10, 3.1.1, 3.1.2,
3.1.3, 3.1.4, 3.1.5, 3.1.6, 4.1.1, 4.1.2 (names and roles of what is on the page; states while
operating belong to `keyboard`). Order: 2.4.2 and 3.1.1 (page level) → 1.3.1 and 2.4.6 (headings,
landmarks, tables, lists, labels) → 1.1.1 (every image) → 2.4.4 and 4.1.2 (every link and control
name) → 1.3.2 and 1.3.3 (reading order, sensory references) → 3.1.2 (language changes) → the AAA
readability criteria when in scope. Reading order check: `agent-browser get text body` against
the visual order in the full-page screenshot.

## `keyboard`

Mode: keyboard only. Criteria: 2.1.1, 2.1.2, 2.1.3, 2.1.4, 2.4.1, 2.4.3, 2.4.7, 2.4.11, 2.4.12,
2.4.13, 3.2.1, 3.2.2, 4.1.2 (states and values while operating), 4.1.3, 1.4.13 (content that
appears on focus). Start from the `focusables` probe (order, elements without a focus style
change, obscured elements, clickable elements outside the tab order), then walk the page with
`press Tab` / `press Shift+Tab`, reading `eval "document.activeElement.outerHTML"` and taking a
screenshot at every stop where the probe flagged something, and operate every widget with Enter,
Space, arrows and Escape. Dialogs and menus: open them by keyboard, confirm focus moves in and
returns, confirm Escape closes them. A recorded tab walk (`record start`) is the evidence for
focus-order and focus-visibility failures.

## `visual`

Mode: look, at four viewports. Criteria: 1.3.4, 1.4.1, 1.4.3, 1.4.4, 1.4.5, 1.4.6, 1.4.8, 1.4.9,
1.4.10, 1.4.11, 1.4.12, 1.4.13. Sequence:

```bash
agent-browser set viewport 1280 900     # colour, contrast (axe + nontext-contrast probe), images of text, hover
agent-browser set viewport 640 900      # 200 % zoom of a 1280 window: 1.4.4 (content and functionality intact?)
agent-browser set viewport 320 900      # 400 % zoom / mobile: 1.4.10 with the reflow probe
agent-browser set viewport 900 400      # landscape phone: 1.3.4 (content usable in both orientations?)
agent-browser set viewport 1280 900     # back; then the text-spacing probe for 1.4.12, then reload
```

Screenshots at every viewport (`screenshot --full`) are the evidence. Hover content: `hover` each
element with a tooltip or menu, `screenshot`, `press Escape`, `mouse move 0 0`.

## `motion`

Mode: watch and listen. Criteria: 1.4.2, 2.2.1, 2.2.2, 2.2.4, 2.3.1, 2.3.2, 2.3.3. Start from the
`motion` and `media` probes (animations, auto-updating regions, carousels, autoplay), record five
seconds of the page as loaded (`record start`, `wait 5000`, `record stop`) for anything that
moves, then look for the pause/stop/hide control and for a time limit (session expiry messages,
countdowns, `metaRefresh`). Reduced motion: `set media reduced-motion`, `reload`, run the `motion`
probe again and compare.

## `pointer`

Mode: touch device and mouse. Criteria: 2.5.1, 2.5.2, 2.5.4, 2.5.5, 2.5.6, 2.5.7, 2.5.8. Target
sizes come from the `targets` probe at 1280 and again at `set device "iPhone 13"`. Gestures and
dragging: find every slider, carousel, map, sortable list and swipe area, and try the single-pointer
alternative (a button, an arrow key handler). Cancellation: `mouse down` on a control, `mouse move`
away, `mouse up`, confirm nothing fired. Motion actuation applies only when the page listens to
device motion; the probe cannot see that, so search the scripts (`eval` for `devicemotion` or
`deviceorientation` listeners) and the UI for shake/tilt features.

## `forms`

Mode: fill in, submit, break. Criteria: 1.3.5, 2.5.3, 3.2.2, 3.2.5, 3.3.1, 3.3.2, 3.3.3, 3.3.4,
3.3.5, 3.3.6, 3.3.7, 3.3.8, 3.3.9, 4.1.2 (form widgets), 4.1.3 (form status), 2.2.3, 2.2.5, 2.2.6.
Start from the `forms` probe, then: submit empty → run the probe again and screenshot the error
state → enter wrong values → correct them → go as far as the process allows without a real-world
effect (SKILL.md ground rules). Authentication pages: 3.3.8 on the login form itself. Time limits:
note what the page says about expiry and whether input survives it.

## `media`

Mode: play. Criteria: 1.2.1 to 1.2.9, 1.4.7, 1.4.2, 1.1.1 for the media element. Only on samples
whose `media` probe found audio, video or an embedded player. Play each item (`click` the play
control), read the tracks, open the caption menu of embedded players, look for a transcript or
audio-described version nearby. Whether the audio contains speech, and whether the video carries
information not in the audio, is decided from the content: watch enough of it to say, and record
`cannot-tell` with the reason when the content is inaccessible to the evaluator.

## `consistency` (once per report)

Criteria: 2.4.5, 2.4.8, 3.2.3, 3.2.4, 3.2.6, 3.3.7 across a process, 2.4.1 (the same mechanism on
every page). Inputs: the `structure` and `links` probe outputs of every sample in `recon/`, the
full-page screenshots, and the findings so far. Compare the repeated components across samples
(header, navigation, footer, search, help links, icons with the same function), and the ways to
find pages (sitemap, search, navigation). Outcomes are per report; the findings file is
`consistency.md` and its rows name the samples where a difference was seen.

## `process/<name>` (per complete process, Step 4.2)

Walk the default sequence and the critical branches recorded in `.notes/sample.md`, in order,
running the `forms` and `keyboard` procedures on the content that changes at each step and axe on
every step's state. Stop before the last step that has a real-world effect and record the
remaining steps as not walked. Findings file: `process--<slug>.md`, rows carry the sample id of the
step where the finding was seen.

## `compare` (Step 4.3, conductor)

After every other unit: for each random sample, list the content types and the findings that did
not occur on any structured sample. Empty lists close Step 4.3. Anything else goes to the hand-over
as a sampling gap (WCAG-EM sends the evaluator back to Step 3), and the consolidation step in
SKILL.md follows.
