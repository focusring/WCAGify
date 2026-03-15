<p align="center">
  <picture>
    <source media="(prefers-color-scheme: light)" srcset="../../docs/public/wcagify-dark.svg" />
    <source media="(prefers-color-scheme: dark)" srcset="../../docs/public/wcagify-light.svg" />
    <img src="../../docs/public/wcagify.svg" alt="WCAGify logo" width="240" height="120" />
  </picture>
</p>

# @wcagify/browser-extension

Browser extension for WCAGify.

## Development

```bash
pnpm ext:dev
```

## Build & Install

```bash
pnpm ext:build
```

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select `packages/browser-extension/dist`

## License

[MIT](../../LICENSE)
