// A report as Nuxt Content stores it: frontmatter plus a minimark body whose
// code blocks are already highlighted. The image points at WCAGify's upload
// route, which this app does not have, so it answers 404.

const shikiStyle =
  'html pre.shiki code .swRb2, html code.shiki .swRb2{--shiki-light:#24292E;--shiki-default:#24292E;--shiki-dark:#E6EDF3}html pre.shiki code .srI7n, html code.shiki .srI7n{--shiki-light:#1A7F37;--shiki-default:#1A7F37;--shiki-dark:#7EE787}html pre.shiki code .stUee, html code.shiki .stUee{--shiki-light:#6F42C1;--shiki-default:#6F42C1;--shiki-dark:#79C0FF}html pre.shiki code .s2YLD, html code.shiki .s2YLD{--shiki-light:#032F62;--shiki-default:#032F62;--shiki-dark:#A5D6FF}html .shiki span {color: var(--shiki-default);background: var(--shiki-default-bg);font-style: var(--shiki-default-font-style);font-weight: var(--shiki-default-font-weight);text-decoration: var(--shiki-default-text-decoration);}html .dark .shiki span {color: var(--shiki-dark);background: var(--shiki-dark-bg);font-style: var(--shiki-dark-font-style);font-weight: var(--shiki-dark-font-weight);text-decoration: var(--shiki-dark-text-decoration);}'

const toc = { title: '', searchDepth: 2, depth: 2, links: [] }

export const report = {
  title: 'WCAG audit Fixture Website',
  description: 'Accessibility audit of Fixture Website against WCAG 2.2 level AA.',
  path: '/reports/fixture',
  language: 'en',
  evaluation: {
    evaluator: 'Focusring',
    commissioner: 'Fixture Organisation',
    target: 'Fixture Website',
    targetLevel: 'AA',
    targetWcagVersion: '2.2',
    date: '2026-10-01',
    specialRequirements: 'None'
  },
  scope: ['https://fixture.example'],
  baseline: ['macOS with Safari and VoiceOver'],
  technologies: ['HTML', 'CSS'],
  sample: [
    {
      title: 'Homepage',
      id: 'page-1',
      url: 'https://fixture.example',
      description: 'The homepage'
    }
  ],
  scStatuses: { 'not-present': ['1.2.1'] },
  body: {
    type: 'minimark',
    value: [['p', {}, 'The homepage of Fixture Website has one issue.']],
    toc
  }
}

export const issues = [
  {
    title: 'The search button has no accessible name',
    path: '/reports/fixture/search-button-has-no-name',
    sc: '4.1.2',
    severity: 'High',
    type: 'Technical',
    difficulty: 'Low',
    sample: 'page-1',
    body: {
      type: 'minimark',
      value: [
        ['p', {}, 'The search button contains only an emoji.'],
        [
          'p',
          {},
          [
            'img',
            {
              src: '/api/uploads/fixture/search-button-4-1-2-0a1b2c3d.png',
              alt: 'The search button'
            }
          ]
        ],
        [
          'pre',
          {
            className:
              'language-html shiki shiki-themes github-light-a11y github-light-a11y github-dark-default',
            code: '<button class="btn">🔎</button>\n',
            language: 'html',
            meta: '',
            style: ''
          },
          [
            'code',
            { __ignoreMap: '' },
            [
              'span',
              { class: 'line', line: 1 },
              ['span', { class: 'swRb2' }, '<'],
              ['span', { class: 'srI7n' }, 'button'],
              ['span', { class: 'stUee' }, ' class'],
              ['span', { class: 'swRb2' }, '='],
              ['span', { class: 's2YLD' }, '"btn"'],
              ['span', { class: 'swRb2' }, '>🔎</'],
              ['span', { class: 'srI7n' }, 'button'],
              ['span', { class: 'swRb2' }, '>\n']
            ]
          ]
        ],
        ['h4', { id: 'recommendation' }, 'Recommendation'],
        ['p', {}, 'Give the button a name with ', ['code', {}, 'aria-label'], '.'],
        ['style', {}, shikiStyle]
      ],
      toc
    }
  },
  {
    title: 'Underline the links in the footer',
    path: '/reports/fixture/underline-footer-links',
    sc: 'none',
    sample: 'page-1',
    body: {
      type: 'minimark',
      value: [['p', {}, 'The footer links are recognisable by colour alone.']],
      toc
    }
  }
]
