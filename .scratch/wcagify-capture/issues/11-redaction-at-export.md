# 11: Redaction at export

**What to build:** Before export the panel shows a redaction review: what will be removed (Authorization, Cookie and Set-Cookie headers on every record, and the password field values of the recorded login request) and what stays but is listed (tokens in URLs, with counts). It reminds the commissioner to use a test account and a dedicated browser profile, and requires confirmation. Redaction runs at export, never during capture, and the redaction report is written into the manifest.

**Blocked by:** 10 Capture package format and validation

**Status:** ready-for-agent

- [ ] No record in an exported package contains a stripped header (unit test over a fixture archive; end-to-end test on the playground admin login)
- [ ] The login request's password value is replaced and the report names the request
- [ ] URL tokens are listed with counts in the report
- [ ] The review screen is in Dutch and English and requires confirmation before export
- [ ] The redacted playground package still replays its logged-in pages
