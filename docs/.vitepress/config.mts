import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Open Source WCAG accessibility audit tool - WCAGify',
  vite: {
    plugins: [tailwindcss()]
  },
  description: 'Documentation for WCAGify — the WCAG accessibility audit tool',
  lang: 'en-US',
  cleanUrls: true,

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/wcagify.svg' }],
    ['meta', { name: 'theme-color', content: '#16a34a' }],
    ['meta', { name: 'og:type', content: 'website' }]
  ],

  themeConfig: {
    logo: {
      light: '/wcagify-dark.svg',
      dark: '/wcagify-light.svg',
      alt: 'WCAGify'
    },

    siteTitle: false,
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Reference', link: '/reference/configuration' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Reports', link: '/guide/reports' },
            { text: 'Issues', link: '/guide/issues' },
            { text: 'Deployment', link: '/guide/deployment' }
          ]
        }
      ],
      '/reference/': [
        {
          text: 'Reference',
          items: [{ text: 'Configuration', link: '/reference/configuration' }]
        }
      ],
      '/legal/': [
        {
          text: 'Legal',
          items: [
            { text: 'Terms and Conditions', link: '/legal/terms-and-conditions' },
            { text: 'Privacy Policy', link: '/legal/privacy-policy' },
            { text: 'Security Policy', link: '/legal/security-policy' }
          ]
        }
      ]
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/focusring/wcagify' }],

    footer: {
      message:
        'Released under the MIT License. <a href="/legal/terms-and-conditions">Terms</a> · <a href="/legal/privacy-policy">Privacy</a> · <a href="/legal/security-policy">Security</a>',
      copyright:
        'Created with ❤️ by <a href="https://focusring.io" target="_blank" rel="noopener">focusring.io</a>'
    },

    search: {
      provider: 'local'
    }
  }
})
