# 13: Walk-list mode

**What to build:** The commissioner loads a walk-list file in the panel. Items are grouped by sample page and process, each with its instruction. Page items are opened and recorded automatically; state and process items are guided step by step and recorded when the commissioner confirms. Each item shows done, partial or missing, computed from the requests recorded for it, and missing items are listed with a warning at export. The walk-list with per-item status is written to the manifest. The end-to-end test grows to load a walk-list and complete it.

**Blocked by:** 10 Capture package format and validation, 12 Walk-list emitter

**Status:** ready-for-agent

- [ ] Loading the walk-list emitted for the playground shows every item with its instruction in the commissioner's locale
- [ ] Page items open and record; an item becomes done when its document and sub-resources are recorded
- [ ] Manual items show their instruction and a Done control; missing items are listed at export
- [ ] The manifest carries the walk-list with per-item status
- [ ] The end-to-end test loads a walk-list, completes it and finds every item done in the manifest
