# Getting Started

WCAGify is a WCAG accessibility audit tool built with Nuxt 4. It turns markdown content into structured, navigable accessibility reports.

## Prerequisites

- [Node.js](https://nodejs.org/) 22 or higher
- [pnpm](https://pnpm.io/) package manager

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/focusring/WCAGify.git
cd wcagify
pnpm install
```

## Development

Start the development server:

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`.

## Building for Production

```bash
pnpm build
```

Preview the production build:

```bash
pnpm preview
```

## Project Structure

```
wcagify/
├── app/              # Vue app (pages, components, assets)
├── content/          # Markdown content files
│   ├── reports/      # Audit reports
│   └── shared/       # Shared content (per language)
├── i18n/locales/     # Translation files (nl.json, en.json)
├── content.config.ts # Content collection definitions
└── nuxt.config.ts    # Nuxt configuration
```

## Next Steps

- Learn how to [create reports](/guide/reports)
- Understand how [issues](/guide/issues) are structured
- Explore the [configuration reference](/reference/configuration)
