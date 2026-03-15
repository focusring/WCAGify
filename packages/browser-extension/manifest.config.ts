import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: 'WCAGify',
  description: 'WCAG accessibility audit tool',
  version: '0.3.4',
  icons: {
    '16': 'src/assets/wcagify-16.png',
    '48': 'src/assets/wcagify-48.png',
    '128': 'src/assets/wcagify-128.png'
  },
  action: {
    default_icon: {
      '16': 'src/assets/wcagify-16.png',
      '48': 'src/assets/wcagify-48.png'
    }
  },
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module'
  },
  permissions: ['activeTab', 'tabs', 'scripting', 'storage', 'sidePanel'],
  host_permissions: ['http://localhost:*/*', 'http://127.0.0.1:*/*', 'https://*/*'],
  content_security_policy: {
    extension_pages:
      "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; img-src 'self' data: http://localhost:* http://127.0.0.1:* https://*;"
  },
  side_panel: {
    default_path: 'src/popup/index.html'
  },
  content_scripts: [
    {
      matches: ['http://*/*', 'https://*/*'],
      js: ['src/content/element-picker.ts'],
      run_at: 'document_idle'
    }
  ]
})
