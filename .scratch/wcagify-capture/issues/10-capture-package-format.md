# 10: Capture package format and validation

**What to build:** Export produces the capture package: a zip holding the WACZ, a manifest, a README for humans and the storage snapshots. The manifest carries the format version, extension and browser versions, capture kind (exploratory, walk-list or gap-fill), round number, parent package if any, start and end, target origins, placeholders for walk-list status, audit-script log and redaction report, and content hashes. The file name is target host, kind, round and date. The ingest validates structure, hashes and format version, refuses a broken package with the reason, and merges several packages of one target into one collection with later records winning.

**Blocked by:** 06 WACZ export and first end-to-end test, 07 Milestone 0: replay proof on the customer SPA

**Status:** ready-for-agent

- [ ] The package format is documented with a version number, in the skills documentation or the package README
- [ ] The ingest accepts a package or a bare WACZ; a package with a wrong hash or a missing manifest is refused with the reason
- [ ] Ingesting an exploratory package and then a second package yields one replay containing both
- [ ] Unit tests cover the manifest schema, hash verification and merge order
- [ ] The end-to-end test exports a package rather than a bare WACZ
