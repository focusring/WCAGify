# 14: Audit script during walk-list capture

**What to build:** For each page item, and again for each recorded state, the extension performs the audit script from the shared table: a real reload under each viewport, each device preset with its user-agent override, each media mode, and the text-spacing and reflow variants, applied through the debugger's emulation domain before navigation. The audit-script log records per page which variants ran and which failed, and goes into the manifest. The end-to-end test asserts that variant-specific responses replay.

**Blocked by:** 13 Walk-list mode, 01 Audit-script table prefactor

**Status:** ready-for-agent

- [ ] The sequence is read from the shared table, not duplicated in the extension
- [ ] Every variant is a real reload with emulation applied first; user-agent-specific responses are recorded separately from desktop ones
- [ ] Reflow and text-spacing variants are captured with their injected styles applied after load
- [ ] The manifest's audit-script log lists per page which variants succeeded and which failed
- [ ] The end-to-end test finds a responsive image or media-query stylesheet of the playground in the replay at the small viewport, and the evaluate skill's resize and orientation steps hit recorded responses
