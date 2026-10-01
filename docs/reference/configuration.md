# Configuration

WCAGify is configured through standard Nuxt configuration files.

## Nuxt Config

The main configuration file is `nuxt.config.ts` in the project root.

```ts
export default defineNuxtConfig({
  modules: ['@nuxt/content', '@nuxt/ui', '@nuxtjs/i18n']
})
```

## Content Collections

Content collections are defined in `content.config.ts`. WCAGify uses three collections:

| Collection | Path                              | Description           |
| ---------- | --------------------------------- | --------------------- |
| `reports`  | `content/reports/{slug}/index.md` | Report metadata       |
| `issues`   | `content/reports/{slug}/*.md`     | Individual findings   |
| `shared`   | `content/shared/{lang}/*.md`      | Shared content blocks |

## Internationalization

Language settings are configured through `@nuxtjs/i18n`:

| Setting   | Value          |
| --------- | -------------- |
| Default   | `en` (English) |
| Secondary | `nl` (Dutch)   |
| Strategy  | `no_prefix`    |

Translation files live in two layers, which `@nuxtjs/i18n` merges. The report's own texts are in the report layer, the rest of the app's in the WCAGify layer:

```text
packages/wcagify-reporter/locales/   # report, codeBlock
├── en.ts
└── nl.ts
packages/wcagify/locales/            # app, import, share, admin, settings, error
├── en.ts
└── nl.ts
```

## Linting and Formatting

| Tool   | Command     | Config file        |
| ------ | ----------- | ------------------ |
| OXlint | `pnpm lint` | `oxlint.config.ts` |
| oxfmt  | `pnpm fmt`  | —                  |

## Commands Reference

| Command           | Description                   |
| ----------------- | ----------------------------- |
| `pnpm dev`        | Start development server      |
| `pnpm build`      | Production build              |
| `pnpm preview`    | Preview production build      |
| `pnpm lint`       | Run OXlint                    |
| `pnpm typecheck`  | Run type checking             |
| `pnpm docs:dev`   | Start docs development server |
| `pnpm docs:build` | Build documentation site      |
