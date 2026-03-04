# WCAGify

WCAG accessibility audit tool built with Nuxt 4. Turns markdown content into structured, navigable accessibility reports.

## Packages

| Package | Description |
|---|---|
| [@focusring/wcagify](packages/wcagify/) | Core engine — WCAG data, Nuxt layer, PDF export |
| [create-wcagify](packages/create-wcagify/) | CLI scaffolding tool |

## Development

```bash
pnpm install
pnpm dev
```

## Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start playground dev server |
| `pnpm build` | Production build |
| `pnpm lint` | Run OXlint |
| `pnpm typecheck` | Run type checking |
| `pnpm docs:dev` | Start docs dev server |
| `pnpm docs:build` | Build docs |

## License

[MIT](LICENSE)
