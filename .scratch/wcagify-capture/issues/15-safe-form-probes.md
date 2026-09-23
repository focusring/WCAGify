# 15: Safe form probes

**What to build:** For every form on a walk-list page marked safe, the extension submits it with empty required fields and with invalid values in typed fields and records the responses. For forms marked unsafe it performs the submit with the request aborted at the network layer and records the abort. Forms without a mark are treated as unsafe. Page state is restored after each probe, and probes appear in the audit-script log per form.

**Blocked by:** 14 Audit script during walk-list capture

**Status:** ready-for-agent

- [ ] The playground's issue form, marked safe, has its invalid-submit response recorded and replays with the same status and body (end-to-end test)
- [ ] An unsafe form's request never reaches the server (end-to-end test checks the server saw nothing)
- [ ] Probes are recorded in the audit-script log per form with the values used
- [ ] Forms without a mark are never submitted for real
