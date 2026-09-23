# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## This repo

**Layout: single-context.** One `CONTEXT.md` at the repo root and system-wide ADRs in `docs/adr/`. The Nuxt layer (`packages/wcagify/`), the CLI (`packages/create-wcagify/`), the browser extension (`packages/browser-extension/`) and the playground all share one audit vocabulary (report, issue, sample, scope, success criterion, EARL), so they share one glossary. Neither file exists yet; `/domain-modeling` creates them lazily.

`docs/` is also the VitePress site root. `docs/agents/` and `docs/adr/` are kept out of the published site via `srcExclude` in `docs/.vitepress/config.mts`.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root, or
- **`CONTEXT-MAP.md`** at the repo root if it exists: it points at one `CONTEXT.md` per context. Read each one relevant to the topic.
- **`docs/adr/`**: read ADRs that touch the area you're about to work in. In multi-context repos, also check `src/<context>/docs/adr/` for context-scoped decisions.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## File structure

Single-context repo (this repo):

```
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-event-sourced-orders.md
│   └── 0002-postgres-for-write-model.md
└── src/
```

Multi-context repo (presence of `CONTEXT-MAP.md` at the root), for reference should the packages ever grow separate vocabularies:

```
/
├── CONTEXT-MAP.md
├── docs/adr/                          ← system-wide decisions
└── packages/
    ├── wcagify/
    │   ├── CONTEXT.md
    │   └── docs/adr/                  ← context-specific decisions
    └── browser-extension/
        ├── CONTEXT.md
        └── docs/adr/
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders), but worth reopening because…_
