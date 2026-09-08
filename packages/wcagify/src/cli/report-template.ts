const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function generateReportMarkdown(slug: string): string {
  const [today] = new Date().toISOString().split('T')

  return `---
title: ${slug}
baseline:
  - Windows 11 with Chrome and NVDA
  - macOS with Safari and VoiceOver
  - Android with Chrome and TalkBack
description: ''
evaluation:
  evaluator: ''
  commissioner: ''
  target: ''
  targetLevel: AA
  targetWcagVersion: '2.2'
  date: ${today}
  specialRequirements: None
language: nl
sample:
  - title: Homepage
    id: page-1
    url: https://example.com
    description: ''
scope:
  - https://example.com
technologies:
  - HTML
  - CSS
  - JavaScript
  - WAI-ARIA
# List every success criterion without issues under "passed" or "not-present".
# Criteria that appear in neither list count as not tested.
scStatuses:
  passed: []
  not-present: []
---
`
}

export { generateReportMarkdown, slugPattern }
