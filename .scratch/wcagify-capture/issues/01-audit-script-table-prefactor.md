# 01: Audit-script table prefactor

**What to build:** One machine-readable table inside the evaluate skill that describes the audit script: every viewport, device preset with its user agent, media mode and injected variant the skill performs per page, in order. The group reference and the criterion files point at the table instead of repeating the numbers, and device preset names are ones agent-browser accepts. A script prints the sequence, so the skills and, later, the extension share a single source.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] A single table in the evaluate skill lists every viewport, device preset, media mode and injected variant with its order and purpose
- [ ] The group reference and every criterion file that lists a viewport or device refer to the table; none contradicts it
- [ ] Device preset names match what agent-browser accepts (the current phone-preset mismatch is gone)
- [ ] A script prints the sequence as JSON and a unit test covers it
- [ ] The existing plan, axe and check-report scripts behave exactly as before
