import { defineManifest } from '@crxjs/vite-plugin'
import { version } from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: 'WCAGify',
  description: 'WCAG accessibility audit tool',
  version,
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
  permissions: ['activeTab', 'tabs', 'storage', 'sidePanel'],
  host_permissions: ['http://localhost/*'],
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'; img-src 'self' data: https://*;"
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
