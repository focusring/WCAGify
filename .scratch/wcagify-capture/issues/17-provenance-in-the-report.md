# 17: Provenance in the report

**What to build:** An optional capture block in the report frontmatter lists the packages the evaluation used (identity, kind, round, date, hash) and the replay tool version. The report schema validates it, the report header and cover page show that the report was evaluated on a capture with its dates, the PDF export carries it, and the evaluate skill's hand-over step writes the block from the package manifests.

**Blocked by:** 10 Capture package format and validation

**Status:** ready-for-agent

- [ ] The schema accepts the block and reports without it are unchanged
- [ ] The report header shows that the report was evaluated on a capture, with the capture dates
- [ ] The hand-over step of the evaluate skill writes the block from the manifests
- [ ] The PDF export shows the provenance
- [ ] Tests follow the existing report and PDF test patterns
