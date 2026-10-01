# WCAGify

WCAG accessibility audit tool — pnpm monorepo.

## Stack

- **Nuxt 4** with TypeScript (playground)
- **Nuxt UI v4** (components, includes Tailwind CSS 4 + color mode)
- **Nuxt Content v3** (markdown-driven content, SQLite-backed)
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
- `pnpm --filter @focusring/wcagify-reporter build` — build the report package (before the core package)
- `pnpm --filter @focusring/wcagify build` — build core package
- `pnpm --filter create-wcagify build` — build CLI package

## Project Structure (Nuxt Layer Architecture)

The core package (`@focusring/wcagify`) is a Nuxt layer. The playground extends it via `defineWcagifyConfig()`, which sets `extends: ['@focusring/wcagify/layer']`. This means the layer provides the full app, modules, and config — the playground only adds content. The core layer itself extends `@focusring/wcagify-reporter/layer`, the render-only report layer, and re-exports its root API. Both packages are released with the same version. See `docs/contributing/report-package.md`.

- `packages/wcagify-reporter/` — report schemas, scoring and render-only Nuxt layer (@focusring/wcagify-reporter); no pages, no server routes, no Nuxt Content
  - `packages/wcagify-reporter/nuxt.config.ts` — layer config: Nuxt UI (prose), i18n locales, fonts, prose component registration
  - `packages/wcagify-reporter/app/` — report components, prose overrides, report composables, `app.config.ts`, `report.css`
  - `packages/wcagify-reporter/src/` — framework-free API: schemas, types, WCAG data, scoring, teaser
  - `packages/wcagify-reporter/locales/` — the `report` and `codeBlock` translations
- `packages/wcagify/` — core Nuxt layer + module (@focusring/wcagify), extends the report layer
  - `packages/wcagify/nuxt.config.ts` — layer config: Nuxt Content, a11y, its own module, CSS, i18n routing
  - `packages/wcagify/app/` — layer app: pages, layouts, admin/share/import components, assets
  - `packages/wcagify/server/` — API routes (PDF export, shares, uploads, EARL)
  - `packages/wcagify/src/` — build-time code: Nuxt module, content collections, PDF, EARL, CLIs
  - `packages/wcagify/locales/` — the app's translation files (en.ts, nl.ts)
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
- Locale files live in `packages/wcagify-reporter/locales/` (report texts) and `packages/wcagify/locales/` (the rest), `.ts` files registered via each layer's `nuxt.config.ts`
- Use `$t('key')` in templates, `useI18n()` in scripts (Nuxt layers only — `packages/wcagify/`, `packages/wcagify-reporter/` and `playground/`; the browser extension uses a custom `useI18n()` with no global `$t`, so `t()` in templates is correct there)
- Use `NuxtLinkLocale` for locale-aware internal links

## Conventions

- Node >= 24, pnpm 11
- Linter: OXlint (plugins: typescript, import, unicorn, vue)
- Formatter: oxfmt
- Components use `U` prefix (Nuxt UI)
- The packages use tsdown for building (ESM, dts generation)

## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/<feature-slug>/` (spec plus one file per ticket). See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` at the repo root plus ADRs in `docs/adr/`. See `docs/agents/domain.md`.
