# 12: Walk-list emitter

**What to build:** A sample-skill script that turns the report's sample list and the evaluator's state and process notes into the walk-list file: one item per sample page, state and process step, each with an id, kind, URL, title, sample id and a plain-language instruction in the report's language, plus a safe or unsafe mark per form (unsafe by default; the evaluator marks safe ones). A readable copy is written alongside for humans.

**Blocked by:** 07 Milestone 0: replay proof on the customer SPA

**Status:** ready-for-agent

- [ ] Running on the test-audit report produces a walk-list with every sample page and every process step
- [ ] The format is documented; its fields are the ones the extension will read
- [ ] Instructions are in the report language, Dutch or English
- [ ] A unit test covers a fixture report
- [ ] The sample skill's text says when to emit the walk-list and how to send it
