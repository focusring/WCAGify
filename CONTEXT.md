# WCAGify

WCAG-EM audit tooling: reports, issues and the agent skills that evaluate a target, plus the extensions that let a commissioner hand a closed target to the evaluator.

## Language

### Parties and target

**Commissioner**:
The organisation that orders the audit and owns the target.
_Avoid_: customer, client

**Evaluator**:
The party that runs the audit skills and writes the report.
_Avoid_: auditor

**Target**:
The website or web app being evaluated, as defined in WCAG-EM Step 1.1.
_Avoid_: site, product, app under test

### Capture and replay

**Capture**:
One recording session of the target in the commissioner's browser.
_Avoid_: recording, session

**Capture package**:
The zip a capture produces, holding the archive, its manifest and the redaction report.
_Avoid_: export, archive, upload, dump

**Replay**:
Serving a capture package so the skills browse it under the original absolute URLs as if it were live.
_Avoid_: mock, snapshot, playback

**Exploratory capture**:
The first capture, made before a sample exists, from which the evaluator selects the sample.

**Walk-list**:
The pages, states and processes the evaluator asks the commissioner to capture, derived from the sample.
_Avoid_: checklist, page list

**Walk-list capture**:
The capture driven by a walk-list, in which the extension performs the audit script on every item.

**Audit script**:
The deterministic browser work the evaluate skill performs per page: viewports, user agents, media modes, reflow, text spacing and safe form probes.
_Avoid_: test script, crawl

**Gap list**:
The requests and states the audit needed on replay that the capture lacked.
_Avoid_: missing list, 404 list

**Gap-fill round**:
A capture that fetches a gap list and exports an addendum package.
_Avoid_: re-capture

**Capture-caused cannot-tell**:
A criterion outcome the evaluator could not decide only because the capture lacked what the check needed.
_Avoid_: not recorded, missing
