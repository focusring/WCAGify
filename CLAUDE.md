# WCAGify

WCAG accessibility audit tool — pnpm monorepo.

## Stack

- **Nuxt 4** with TypeScript (playground)
- **Nuxt UI v4** (components, includes Tailwind CSS 4 + color mode)
- **Nuxt Content v3** (markdown-driven content, SQLite-backed)
- **Nuxt Studio** (visual content editing)
- **@nuxtjs/i18n v10** (Dutch default, English secondary)
- **@nuxt/a11y** (accessibility checks)
- **@nuxt/icon** (icon support)
- **Zod v4** (schema validation)
- **tsdown** (package builds)
- **VitePress** (documentation)

## Commands

- `pnpm dev` — start playground dev server
- `pnpm build` — production build
- `pnpm preview` — preview production build
- `pnpm lint` — run OXlint
- `pnpm fmt` — format with oxfmt
- `pnpm fmt:check` — check formatting
- `pnpm typecheck` — run type checking
- `pnpm docs:dev` — start docs dev server
- `pnpm docs:build` — build docs
- `pnpm --filter @focusring/wcagify build` — build core package
- `pnpm --filter create-wcagify build` — build CLI package

## Project Structure (Nuxt Layer Architecture)

The core package (`@focusring/wcagify`) is a Nuxt layer. The playground extends it via `defineWcagifyConfig()`, which sets `extends: ['@focusring/wcagify/layer']`. This means the layer provides the full app, modules, and config — the playground only adds content.

- `packages/wcagify/` — core Nuxt layer + module (@focusring/wcagify)
  - `packages/wcagify/nuxt.config.ts` — layer config: registers all modules, CSS, i18n, route rules
  - `packages/wcagify/app/` — layer app: pages, components, composables, assets
  - `packages/wcagify/server/` — API routes (PDF export)
  - `packages/wcagify/src/` — build-time code: Nuxt module, schemas, types, WCAG data
  - `packages/wcagify/locales/` — translation files (nl.json, en.json)
- `packages/create-wcagify/` — CLI scaffolding tool (create-wcagify)
- `playground/` — Nuxt app (@wcagify/playground), extends the wcagify layer
  - `playground/nuxt.config.ts` — uses `defineWcagifyConfig()` to extend the layer
  - `playground/content/reports/<slug>/` — one report per directory: `index.md` (report) plus one markdown file per issue
  - `playground/content.config.ts` — content collection definitions (uses `defineWcagifyCollections`)
- `docs/` — VitePress documentation site (@wcagify/docs)
- `skills/` — agent skills (`skills/<name>/SKILL.md`), one per WCAG-EM step; symlinked from `.claude/skills/` so they are active in this repo, exposed as the `wcagify` Claude Code plugin via `.claude-plugin/`, and installable elsewhere with `npx skills add focusring/WCAGify`. See `skills/README.md`.
- `test/` — tests (e2e)

## i18n

- Default locale: `en`
- Strategy: `no_prefix`
- Locale files live in `packages/wcagify/locales/` (`.ts` files), registered via `nuxt.config.ts`
- Use `$t('key')` in templates, `useI18n()` in scripts (Nuxt layer only — `packages/wcagify/` and `playground/`; the browser extension uses a custom `useI18n()` with no global `$t`, so `t()` in templates is correct there)
- Use `NuxtLinkLocale` for locale-aware internal links

## Conventions

- Node >= 24, pnpm 11
- Linter: OXlint (plugins: typescript, import, unicorn, vue)
- Formatter: oxfmt
- Components use `U` prefix (Nuxt UI)
- Both packages use tsdown for building (ESM, dts generation)

## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/<feature-slug>/` (spec plus one file per ticket). See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` at the repo root plus ADRs in `docs/adr/`. See `docs/agents/domain.md`.
