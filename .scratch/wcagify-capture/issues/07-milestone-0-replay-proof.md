# 07: Milestone 0: replay proof on the customer SPA

**What to build:** The proof that gates everything after the recorder spike. With the customer app and test account named at claim, produce an exploratory capture and an audit-shaped capture with off-the-shelf tooling (pywb's recording proxy driven by agent-browser performing the audit script from the shared table, or ArchiveWeb.page). Ingest, run the sample skill and the full evaluate skill in replay mode, collect the gap list, fill it by hand through recording mode, re-run, and take a second round if needed. Measure against the pass bar. Human in the loop: the app, the account and the go or no-go come from the user.

**Blocked by:** 01 Audit-script table prefactor, 02 Replay ingest and proxy command, 03 Replay mode in the skills, 04 Gap-list collector

**Status:** ready-for-agent

- [ ] Credentials enter only through agent-browser's auth store; the capture's storage location is recorded in the answer
- [ ] The sample skill completes on the exploratory replay and selects a sample
- [ ] The full evaluate run completes every unit and walks every process to its last safe step
- [ ] After at most two gap-fill rounds no criterion is cannot-tell because of the capture
- [ ] The answer records what worked, what bounced to login or errored, user-agent variance seen, whether stripped cookies mattered, and wall-clock per round
- [ ] A go or no-go is stated; on no-go the remaining tickets stay blocked and the user decides how to proceed
