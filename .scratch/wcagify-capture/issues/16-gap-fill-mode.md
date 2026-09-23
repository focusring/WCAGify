# 16: Gap-fill mode and addendum packages

**What to build:** The commissioner loads a gap list. The extension fetches every entry in the target's logged-in session under the recorded conditions (viewport, user agent, media mode), lists failures, and exports an addendum package that names its parent package with kind gap-fill and a round number. The ingest merges the addendum into the existing collection so the previously missing request is served. The end-to-end test performs the full round trip.

**Blocked by:** 04 Gap-list collector, 10 Capture package format and validation, 14 Audit script during walk-list capture

**Status:** ready-for-agent

- [ ] A gap list produced by the collector loads; entries are fetched and failures listed in the panel
- [ ] The addendum manifest carries kind gap-fill, the round number and the parent package identity
- [ ] The ingest merges the addendum and the missing URL is served afterwards
- [ ] The end-to-end test omits a resource on purpose, runs the collector, loads the gap list, ingests the addendum and finds the resource served
