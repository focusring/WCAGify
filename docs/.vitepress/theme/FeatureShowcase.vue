<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useData } from 'vitepress'

const { lang } = useData()
const locale = computed<'en' | 'nl'>(() => (lang.value.startsWith('nl') ? 'nl' : 'en'))

const messages = {
  en: {
    // Tabs
    tabReports: 'Reports Overview',
    tabIssues: 'WCAG-EM Conform',
    tabPdf: 'Accessible PDF Export',
    tabMarkdown: 'Markdown Based',
    // Pause/play
    playAnimations: 'Play animations',
    pauseAnimations: 'Pause animations',
    featureShowcase: 'Feature showcase',
    // Reports panel — header
    reports: 'Reports',
    // Reports panel — table
    thTitle: 'Title',
    thCommissioner: 'Commissioner',
    thEvaluator: 'Evaluator',
    thDate: 'Date',
    thLevel: 'Level',
    // Reports panel — rows
    reportAcme: 'ACME Corp Homepage Audit',
    reportCity: 'City Portal Accessibility',
    reportEcommerce: 'E-commerce Platform',
    reportHealthcare: 'Healthcare Dashboard',
    commAcme: 'ACME Corp',
    commMunicipality: 'Municipality',
    commShopNow: 'ShopNow Inc',
    commMedTech: 'MedTech BV',
    evalJane: 'Jane Doe',
    evalJohn: 'John Smith',
    dateMar12: 'Mar 12, 2026',
    dateFeb28: 'Feb 28, 2026',
    dateFeb15: 'Feb 15, 2026',
    dateJan30: 'Jan 30, 2026',
    // Reports detail
    commissionedBy: 'Commissioned by',
    evaluatedBy: 'Evaluated by',
    date: 'Date',
    executiveSummary: 'Executive Summary',
    results: 'Results',
    passed: 'Passed',
    failed: 'Failed',
    notTested: 'Not tested',
    // Issues panel
    share: 'Share',
    downloadPdf: 'Download PDF',
    perceivable: '1. Perceivable',
    textAlternatives: '1.1 Text Alternatives',
    nonTextContent: '1.1.1 Non-text Content',
    adaptable: '1.3 Adaptable',
    operable: '2. Operable',
    understandable: '3. Understandable',
    robust: '4. Robust',
    statusFailed: 'Failed',
    operablePassed: '20/20 Passed',
    understandablePassed: '13/13 Passed',
    robustPassed: '2/2 Passed',
    issueMissingAlt: '#1 Missing alt text on hero image',
    issueDecorativeIcon: '#2 Decorative icon not hidden',
    severityHigh: 'High',
    severityLow: 'Low',
    // PDF panel
    pdfFileName: 'ACME_Corp_Audit.pdf',
    pdfTitle: 'ACME Corp',
    pdfTitleLine2: 'Homepage Audit',
    pdfEvaluator: 'Evaluator: Jane Doe',
    pdfDate: 'Date: Mar 12, 2026',
    pdfLevel: 'Level: AA',
    page2: 'Page 2',
    page3: 'Page 3',
    resultsPerPrinciple: 'Results Per Principle',
    principle: 'Principle',
    total: 'Total',
    perceivableShort: 'Perceivable',
    operableShort: 'Operable',
    understandableShort: 'Understandable',
    robustShort: 'Robust',
    // Markdown panel
    mdFileName: 'issues/missing-alt-text.md',
    preview: 'Preview',
    mdTitle: 'Missing alt text on hero',
    mdBodyLine1: 'The hero image does not have',
    mdBodyLine2: 'an',
    mdBodyLine2Suffix: 'attribute.',
    mdRecommendation: '## Recommendation',
    mdRecommendationText: 'Add a descriptive',
    mdAltValue: 'Team launch',
    previewNonTextContent: '1.1.1 Non-text Content',
    previewDifficulty: 'Difficulty: Low',
    previewMissingAlt: 'Missing alt text on hero',
    previewBody: 'The hero image does not have an',
    previewBodySuffix: 'attribute.',
    previewRecommendation: 'Recommendation',
    previewRecommendationText: 'Add a descriptive'
  },
  nl: {
    // Tabs
    tabReports: 'Rapportenoverzicht',
    tabIssues: 'WCAG-EM Conform',
    tabPdf: 'Toegankelijke PDF-export',
    tabMarkdown: 'Markdown gebaseerd',
    // Pause/play
    playAnimations: 'Animaties afspelen',
    pauseAnimations: 'Animaties pauzeren',
    featureShowcase: 'Functieoverzicht',
    // Reports panel — header
    reports: 'Rapporten',
    // Reports panel — table
    thTitle: 'Titel',
    thCommissioner: 'Opdrachtgever',
    thEvaluator: 'Beoordelaar',
    thDate: 'Datum',
    thLevel: 'Niveau',
    // Reports panel — rows
    reportAcme: 'ACME Corp Homepage Audit',
    reportCity: 'Gemeenteportaal Toegankelijkheid',
    reportEcommerce: 'E-commerce Platform',
    reportHealthcare: 'Zorgdashboard',
    commAcme: 'ACME Corp',
    commMunicipality: 'Gemeente',
    commShopNow: 'ShopNow Inc',
    commMedTech: 'MedTech BV',
    evalJane: 'Jane Doe',
    evalJohn: 'John Smith',
    dateMar12: '12 mrt 2026',
    dateFeb28: '28 feb 2026',
    dateFeb15: '15 feb 2026',
    dateJan30: '30 jan 2026',
    // Reports detail
    commissionedBy: 'Opdrachtgever',
    evaluatedBy: 'Beoordeeld door',
    date: 'Datum',
    executiveSummary: 'Samenvatting',
    results: 'Resultaten',
    passed: 'Geslaagd',
    failed: 'Gefaald',
    notTested: 'Niet getest',
    // Issues panel
    share: 'Delen',
    downloadPdf: 'PDF downloaden',
    perceivable: '1. Waarneembaar',
    textAlternatives: '1.1 Tekstalternatieven',
    nonTextContent: '1.1.1 Niet-tekstuele content',
    adaptable: '1.3 Aanpasbaar',
    operable: '2. Bedienbaar',
    understandable: '3. Begrijpelijk',
    robust: '4. Robuust',
    statusFailed: 'Gefaald',
    operablePassed: '20/20 Geslaagd',
    understandablePassed: '13/13 Geslaagd',
    robustPassed: '2/2 Geslaagd',
    issueMissingAlt: '#1 Ontbrekende alt-tekst op hero-afbeelding',
    issueDecorativeIcon: '#2 Decoratief icoon niet verborgen',
    severityHigh: 'Hoog',
    severityLow: 'Laag',
    // PDF panel
    pdfFileName: 'ACME_Corp_Audit.pdf',
    pdfTitle: 'ACME Corp',
    pdfTitleLine2: 'Homepage Audit',
    pdfEvaluator: 'Beoordelaar: Jane Doe',
    pdfDate: 'Datum: 12 mrt 2026',
    pdfLevel: 'Niveau: AA',
    page2: 'Pagina 2',
    page3: 'Pagina 3',
    resultsPerPrinciple: 'Resultaten per principe',
    principle: 'Principe',
    total: 'Totaal',
    perceivableShort: 'Waarneembaar',
    operableShort: 'Bedienbaar',
    understandableShort: 'Begrijpelijk',
    robustShort: 'Robuust',
    // Markdown panel
    mdFileName: 'issues/ontbrekende-alt-tekst.md',
    preview: 'Voorbeeld',
    mdTitle: 'Ontbrekende alt-tekst op hero',
    mdBodyLine1: 'De hero-afbeelding heeft geen',
    mdBodyLine2: 'een',
    mdBodyLine2Suffix: 'attribuut.',
    mdRecommendation: '## Aanbeveling',
    mdRecommendationText: 'Voeg een beschrijvend',
    mdAltValue: 'Teamlancering',
    previewNonTextContent: '1.1.1 Niet-tekstuele content',
    previewDifficulty: 'Moeilijkheid: Laag',
    previewMissingAlt: 'Ontbrekende alt-tekst op hero',
    previewBody: 'De hero-afbeelding heeft geen',
    previewBodySuffix: 'attribuut.',
    previewRecommendation: 'Aanbeveling',
    previewRecommendationText: 'Voeg een beschrijvend'
  }
} as const

type MessageKey = keyof (typeof messages)['en']

function t(key: MessageKey): string {
  return messages[locale.value][key]
}

interface Tab {
  id: string
  labelKey: MessageKey
}

const tabs: Tab[] = [
  { id: 'reports', labelKey: 'tabReports' },
  { id: 'issues', labelKey: 'tabIssues' },
  { id: 'pdf', labelKey: 'tabPdf' },
  { id: 'markdown', labelKey: 'tabMarkdown' }
]

const DURATION = 8000
const activeIndex = ref(0)
const progress = ref(0)
const paused = ref(false)
let startTime = 0
let elapsed = 0
let rafId = 0

function tick() {
  if (!paused.value) {
    const now = Date.now()
    elapsed = now - startTime
    progress.value = Math.min((elapsed / DURATION) * 100, 100)
    if (elapsed >= DURATION) {
      activeIndex.value = (activeIndex.value + 1) % tabs.length
      startTime = Date.now()
      elapsed = 0
      progress.value = 0
    }
  }
  rafId = requestAnimationFrame(tick)
}

function setTab(i: number) {
  activeIndex.value = i
  progress.value = 0
  startTime = Date.now()
  elapsed = 0
}

function togglePause() {
  paused.value = !paused.value
  if (!paused.value) {
    // Resume: adjust startTime so progress continues from where it was
    startTime = Date.now() - elapsed
  }
}

function onTabKeydown(event: KeyboardEvent) {
  let newIndex = activeIndex.value

  switch (event.key) {
    case 'ArrowRight': {
      newIndex = (activeIndex.value + 1) % tabs.length
      break
    }
    case 'ArrowLeft': {
      newIndex = (activeIndex.value - 1 + tabs.length) % tabs.length
      break
    }
    case 'Home': {
      newIndex = 0
      break
    }
    case 'End': {
      newIndex = tabs.length - 1
      break
    }
    default: {
      return
    }
  }

  event.preventDefault()
  setTab(newIndex)
  const tab = (event.currentTarget as HTMLElement)
    .closest('[role="tablist"]')
    ?.querySelector<HTMLElement>(`[data-index="${newIndex}"]`)
  tab?.focus()
}

onMounted(() => {
  startTime = Date.now()
  rafId = requestAnimationFrame(tick)
})

onUnmounted(() => cancelAnimationFrame(rafId))
</script>

<template>
  <section class="py-16">
    <div class="relative">
      <!-- Tab panels -->
      <div class="showcase-panels">
        <!-- Reports panel: table → click → report detail -->
        <div
          id="showcase-panel-reports"
          role="tabpanel"
          :aria-labelledby="`showcase-tab-reports`"
          :hidden="activeIndex !== 0"
          :tabindex="activeIndex === 0 ? 0 : undefined"
          class="showcase-panel"
        >
          <div v-if="activeIndex === 0" class="mockup anim-fade-in">
            <div class="mockup-header">
              <div class="mockup-dots"><span /><span /><span /></div>
              <div class="mockup-title">{{ t('reports') }}</div>
              <div class="mockup-actions">
                <div class="mockup-search" />
                <div class="mockup-btn-icon" />
                <div class="mockup-btn-icon" />
              </div>
            </div>
            <div class="mockup-body mockup-body-reports">
              <!-- Phase 1: Table with rows animating in -->
              <div class="reports-table-phase">
                <table class="mockup-table">
                  <thead>
                    <tr class="anim-row" style="--row: 0">
                      <th>{{ t('thTitle') }}</th>
                      <th>{{ t('thCommissioner') }}</th>
                      <th>{{ t('thEvaluator') }}</th>
                      <th>{{ t('thDate') }}</th>
                      <th>{{ t('thLevel') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="mockup-row-highlight anim-row mockup-row-clickable" style="--row: 1">
                      <td>
                        <span class="mockup-link">{{ t('reportAcme') }}</span>
                      </td>
                      <td>
                        <span class="mockup-text-muted">{{ t('commAcme') }}</span>
                      </td>
                      <td>
                        <span class="mockup-text-muted">{{ t('evalJane') }}</span>
                      </td>
                      <td>
                        <span class="mockup-text-muted">{{ t('dateMar12') }}</span>
                      </td>
                      <td><span class="mockup-badge-aa">AA</span></td>
                    </tr>
                    <tr class="anim-row" style="--row: 2">
                      <td>
                        <span class="mockup-link">{{ t('reportCity') }}</span>
                      </td>
                      <td>
                        <span class="mockup-text-muted">{{ t('commMunicipality') }}</span>
                      </td>
                      <td>
                        <span class="mockup-text-muted">{{ t('evalJohn') }}</span>
                      </td>
                      <td>
                        <span class="mockup-text-muted">{{ t('dateFeb28') }}</span>
                      </td>
                      <td><span class="mockup-badge-aa">AA</span></td>
                    </tr>
                    <tr class="anim-row" style="--row: 3">
                      <td>
                        <span class="mockup-link">{{ t('reportEcommerce') }}</span>
                      </td>
                      <td>
                        <span class="mockup-text-muted">{{ t('commShopNow') }}</span>
                      </td>
                      <td>
                        <span class="mockup-text-muted">{{ t('evalJane') }}</span>
                      </td>
                      <td>
                        <span class="mockup-text-muted">{{ t('dateFeb15') }}</span>
                      </td>
                      <td><span class="mockup-badge-aaa">AAA</span></td>
                    </tr>
                    <tr class="anim-row" style="--row: 4">
                      <td>
                        <span class="mockup-link">{{ t('reportHealthcare') }}</span>
                      </td>
                      <td>
                        <span class="mockup-text-muted">{{ t('commMedTech') }}</span>
                      </td>
                      <td>
                        <span class="mockup-text-muted">{{ t('evalJohn') }}</span>
                      </td>
                      <td>
                        <span class="mockup-text-muted">{{ t('dateJan30') }}</span>
                      </td>
                      <td><span class="mockup-badge-a">A</span></td>
                    </tr>
                  </tbody>
                </table>
                <!-- Cursor moves and clicks -->
                <div class="anim-cursor anim-cursor-reports" aria-hidden="true">
                  <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
                    <path
                      d="M1 1L1 14.5L4.5 11L8.5 18L11 17L7 10L12 10L1 1Z"
                      fill="var(--vp-c-text-1)"
                      stroke="var(--vp-c-bg)"
                      stroke-width="1.5"
                    />
                  </svg>
                </div>
              </div>
              <!-- Phase 2: Report detail view (appears after click) -->
              <div class="reports-detail-phase">
                <div class="report-detail-header">
                  <h3 class="report-detail-title">{{ t('reportAcme') }}</h3>
                  <span class="mockup-badge-aa">AA</span>
                </div>
                <div class="report-detail-meta">
                  <div class="report-meta-item">
                    <span class="report-meta-label">{{ t('commissionedBy') }}</span>
                    <span class="report-meta-value">{{ t('commAcme') }}</span>
                  </div>
                  <div class="report-meta-item">
                    <span class="report-meta-label">{{ t('evaluatedBy') }}</span>
                    <span class="report-meta-value">{{ t('evalJane') }}</span>
                  </div>
                  <div class="report-meta-item">
                    <span class="report-meta-label">{{ t('date') }}</span>
                    <span class="report-meta-value">{{ t('dateMar12') }}</span>
                  </div>
                </div>
                <div class="report-detail-section">
                  <div class="report-detail-heading">{{ t('executiveSummary') }}</div>
                  <div class="report-detail-line w-full" />
                  <div class="report-detail-line w-full" />
                  <div class="report-detail-line w-3/4" />
                </div>
                <div class="report-detail-section">
                  <div class="report-detail-heading">{{ t('results') }}</div>
                  <div class="report-detail-scorecard">
                    <div class="scorecard-item scorecard-pass">
                      <span class="scorecard-number">52</span>
                      <span class="scorecard-label">{{ t('passed') }}</span>
                    </div>
                    <div class="scorecard-item scorecard-fail">
                      <span class="scorecard-number">2</span>
                      <span class="scorecard-label">{{ t('failed') }}</span>
                    </div>
                    <div class="scorecard-item scorecard-na">
                      <span class="scorecard-number">1</span>
                      <span class="scorecard-label">{{ t('notTested') }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- WCAG Issues panel -->
        <div
          id="showcase-panel-issues"
          role="tabpanel"
          :aria-labelledby="`showcase-tab-issues`"
          :hidden="activeIndex !== 1"
          :tabindex="activeIndex === 1 ? 0 : undefined"
          class="showcase-panel"
        >
          <div v-if="activeIndex === 1" class="mockup anim-fade-in">
            <div class="mockup-header">
              <div class="mockup-dots"><span /><span /><span /></div>
              <div class="mockup-title">{{ t('reportAcme') }}</div>
              <div class="mockup-actions">
                <div class="mockup-btn">{{ t('share') }}</div>
                <div class="mockup-btn mockup-btn-primary">{{ t('downloadPdf') }}</div>
              </div>
            </div>
            <div class="mockup-body mockup-body-issues">
              <div class="mockup-principle anim-slide-up" style="--delay: 0.2s">
                <div class="mockup-principle-header">
                  <span class="mockup-principle-icon">&#128065;</span>
                  <span>{{ t('perceivable') }}</span>
                </div>
                <div class="mockup-guideline anim-expand" style="--delay: 0.8s">
                  <div class="mockup-guideline-header">
                    <span>{{ t('textAlternatives') }}</span>
                    <span class="mockup-chevron anim-rotate-chevron" style="--delay: 0.7s"
                      >&#9654;</span
                    >
                  </div>
                  <div class="mockup-criterion anim-slide-up" style="--delay: 1.4s">
                    <div class="mockup-criterion-header">
                      <span class="mockup-badge-a">A</span>
                      <span class="mockup-criterion-name">{{ t('nonTextContent') }}</span>
                      <span class="mockup-status-failed anim-pop" style="--delay: 1.8s">{{
                        t('statusFailed')
                      }}</span>
                    </div>
                    <div class="mockup-issue anim-slide-right" style="--delay: 2.4s">
                      <div class="mockup-issue-header">
                        <span class="mockup-issue-title">{{ t('issueMissingAlt') }}</span>
                        <span class="mockup-severity-high">{{ t('severityHigh') }}</span>
                      </div>
                    </div>
                    <div class="mockup-issue anim-slide-right" style="--delay: 3s">
                      <div class="mockup-issue-header">
                        <span class="mockup-issue-title">{{ t('issueDecorativeIcon') }}</span>
                        <span class="mockup-severity-low">{{ t('severityLow') }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="mockup-guideline anim-slide-up" style="--delay: 3.6s">
                  <div class="mockup-guideline-header">
                    <span>{{ t('adaptable') }}</span>
                    <span class="mockup-chevron">&#9654;</span>
                  </div>
                </div>
              </div>
              <div
                class="mockup-principle mockup-principle-collapsed anim-slide-up"
                style="--delay: 4.2s"
              >
                <div class="mockup-principle-header">
                  <span class="mockup-principle-icon">&#9995;</span>
                  <span>{{ t('operable') }}</span>
                  <span class="mockup-status-passed mockup-ml-auto">{{ t('operablePassed') }}</span>
                </div>
              </div>
              <div
                class="mockup-principle mockup-principle-collapsed anim-slide-up"
                style="--delay: 4.8s"
              >
                <div class="mockup-principle-header">
                  <span class="mockup-principle-icon">&#129504;</span>
                  <span>{{ t('understandable') }}</span>
                  <span class="mockup-status-passed mockup-ml-auto">{{
                    t('understandablePassed')
                  }}</span>
                </div>
              </div>
              <div
                class="mockup-principle mockup-principle-collapsed anim-slide-up"
                style="--delay: 5.4s"
              >
                <div class="mockup-principle-header">
                  <span class="mockup-principle-icon">&#9881;</span>
                  <span>{{ t('robust') }}</span>
                  <span class="mockup-status-passed mockup-ml-auto">{{ t('robustPassed') }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- PDF Export panel -->
        <div
          id="showcase-panel-pdf"
          role="tabpanel"
          :aria-labelledby="`showcase-tab-pdf`"
          :hidden="activeIndex !== 2"
          :tabindex="activeIndex === 2 ? 0 : undefined"
          class="showcase-panel"
        >
          <div v-if="activeIndex === 2" class="mockup anim-fade-in">
            <div class="mockup-header">
              <div class="mockup-dots"><span /><span /><span /></div>
              <div class="mockup-title">{{ t('pdfFileName') }}</div>
              <div class="mockup-actions">
                <div class="mockup-pdf-progress-bar" aria-hidden="true">
                  <div class="mockup-pdf-progress-fill" />
                </div>
              </div>
            </div>
            <div class="mockup-body mockup-body-pdf">
              <div class="mockup-pdf-pages">
                <div class="mockup-pdf-page mockup-pdf-cover anim-page-in" style="--delay: 0.6s">
                  <div class="mockup-pdf-cover-content">
                    <div class="mockup-pdf-logo anim-pop" style="--delay: 1.2s" />
                    <div class="mockup-pdf-title anim-fade-in-up" style="--delay: 1.6s">
                      {{ t('pdfTitle') }}<br />{{ t('pdfTitleLine2') }}
                    </div>
                    <div class="mockup-pdf-meta anim-fade-in-up" style="--delay: 2s">
                      <span>{{ t('pdfEvaluator') }}</span>
                      <span>{{ t('pdfDate') }}</span>
                      <span>{{ t('pdfLevel') }}</span>
                    </div>
                  </div>
                </div>
                <div class="mockup-pdf-page anim-page-in" style="--delay: 2.6s">
                  <div class="mockup-pdf-page-header anim-fade-in-up" style="--delay: 3s">
                    <span>{{ t('reportAcme') }}</span>
                    <span>{{ t('page2') }}</span>
                  </div>
                  <div class="mockup-pdf-heading anim-fade-in-up" style="--delay: 3.3s">
                    {{ t('executiveSummary') }}
                  </div>
                  <div class="mockup-pdf-line w-full anim-line-draw" style="--delay: 3.6s" />
                  <div class="mockup-pdf-line w-full anim-line-draw" style="--delay: 3.8s" />
                  <div class="mockup-pdf-line w-3/4 anim-line-draw" style="--delay: 4s" />
                  <div class="mockup-pdf-spacer" />
                  <div class="mockup-pdf-heading-sm anim-fade-in-up" style="--delay: 4.4s">
                    {{ t('resultsPerPrinciple') }}
                  </div>
                  <div class="mockup-pdf-table anim-fade-in-up" style="--delay: 4.8s">
                    <div class="mockup-pdf-table-row mockup-pdf-table-header">
                      <span>{{ t('principle') }}</span
                      ><span>A</span><span>AA</span><span>{{ t('total') }}</span>
                    </div>
                    <div class="mockup-pdf-table-row">
                      <span>{{ t('perceivableShort') }}</span
                      ><span>8/9</span><span>9/11</span><span>17/20</span>
                    </div>
                    <div class="mockup-pdf-table-row">
                      <span>{{ t('operableShort') }}</span
                      ><span>14/14</span><span>6/6</span><span>20/20</span>
                    </div>
                    <div class="mockup-pdf-table-row">
                      <span>{{ t('understandableShort') }}</span
                      ><span>7/7</span><span>6/6</span><span>13/13</span>
                    </div>
                    <div class="mockup-pdf-table-row">
                      <span>{{ t('robustShort') }}</span
                      ><span>1/1</span><span>1/1</span><span>2/2</span>
                    </div>
                  </div>
                </div>
                <div class="mockup-pdf-page anim-page-in" style="--delay: 5.4s">
                  <div class="mockup-pdf-page-header anim-fade-in-up" style="--delay: 5.8s">
                    <span>{{ t('reportAcme') }}</span>
                    <span>{{ t('page3') }}</span>
                  </div>
                  <div class="mockup-pdf-heading anim-fade-in-up" style="--delay: 6s">
                    {{ t('perceivable') }}
                  </div>
                  <div class="mockup-pdf-line w-full anim-line-draw" style="--delay: 6.2s" />
                  <div class="mockup-pdf-line w-full anim-line-draw" style="--delay: 6.4s" />
                  <div class="mockup-pdf-line w-5/6 anim-line-draw" style="--delay: 6.6s" />
                  <div class="mockup-pdf-spacer" />
                  <div class="mockup-pdf-line w-full anim-line-draw" style="--delay: 6.8s" />
                  <div class="mockup-pdf-line w-2/3 anim-line-draw" style="--delay: 7s" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Markdown panel: split editor + preview -->
        <div
          id="showcase-panel-markdown"
          role="tabpanel"
          :aria-labelledby="`showcase-tab-markdown`"
          :hidden="activeIndex !== 3"
          :tabindex="activeIndex === 3 ? 0 : undefined"
          class="showcase-panel"
        >
          <div v-if="activeIndex === 3" class="mockup anim-fade-in">
            <div class="mockup-header">
              <div class="mockup-dots"><span /><span /><span /></div>
              <div class="mockup-title">{{ t('mdFileName') }}</div>
              <div class="mockup-title mockup-title-preview">{{ t('preview') }}</div>
            </div>
            <div class="mockup-body mockup-body-split">
              <!-- Left: Markdown editor -->
              <div class="split-editor">
                <div class="mockup-code">
                  <div class="anim-type-line" style="--line: 0">
                    <span class="mockup-code-comment">---</span>
                  </div>
                  <div class="anim-type-line" style="--line: 1">
                    <span class="mockup-code-key">title</span
                    ><span class="mockup-code-punct">:</span>
                    <span class="mockup-code-string">{{ t('mdTitle') }}</span>
                  </div>
                  <div class="anim-type-line" style="--line: 2">
                    <span class="mockup-code-key">sc</span><span class="mockup-code-punct">:</span>
                    <span class="mockup-code-string">1.1.1</span>
                  </div>
                  <div class="anim-type-line" style="--line: 3">
                    <span class="mockup-code-key">severity</span
                    ><span class="mockup-code-punct">:</span>
                    <span class="mockup-code-string">{{ t('severityHigh').toLowerCase() }}</span>
                  </div>
                  <div class="anim-type-line" style="--line: 4">
                    <span class="mockup-code-key">difficulty</span
                    ><span class="mockup-code-punct">:</span>
                    <span class="mockup-code-string">{{ t('severityLow').toLowerCase() }}</span>
                  </div>
                  <div class="anim-type-line" style="--line: 5">
                    <span class="mockup-code-comment">---</span>
                  </div>
                  <div class="anim-type-line" style="--line: 6">&nbsp;</div>
                  <div class="anim-type-line" style="--line: 7">{{ t('mdBodyLine1') }}</div>
                  <div class="anim-type-line" style="--line: 8">
                    {{ t('mdBodyLine2') }} <span class="mockup-code-inline">`alt`</span>
                    {{ t('mdBodyLine2Suffix') }}
                  </div>
                  <div class="anim-type-line" style="--line: 9">&nbsp;</div>
                  <div class="anim-type-line" style="--line: 10">
                    <span class="mockup-code-heading">{{ t('mdRecommendation') }}</span>
                  </div>
                  <div class="anim-type-line" style="--line: 11">&nbsp;</div>
                  <div class="anim-type-line" style="--line: 12">
                    {{ t('mdRecommendationText') }} <span class="mockup-code-inline">`alt`</span>:
                  </div>
                  <div class="anim-type-line" style="--line: 13">&nbsp;</div>
                  <div class="anim-type-line" style="--line: 14">
                    <span class="mockup-code-fence">```html</span>
                  </div>
                  <div class="anim-type-line" style="--line: 15">
                    <span class="mockup-code-tag">&lt;img</span>
                    <span class="mockup-code-attr">alt</span>=<span class="mockup-code-string"
                      >"{{ t('mdAltValue') }}"</span
                    >
                    <span class="mockup-code-tag">/&gt;</span>
                  </div>
                  <div class="anim-type-line" style="--line: 16">
                    <span class="mockup-code-fence">```</span>
                  </div>
                </div>
                <div class="anim-text-cursor" aria-hidden="true" />
              </div>
              <!-- Right: Live HTML preview -->
              <div class="split-preview">
                <!-- Frontmatter parsed into header -->
                <div class="preview-header anim-preview" style="--pdelay: 1.5s">
                  <div class="preview-badge-row">
                    <span class="mockup-badge-aa">AA</span>
                    <span class="preview-sc">{{ t('previewNonTextContent') }}</span>
                  </div>
                  <div class="preview-meta-row">
                    <span class="preview-severity preview-severity-high">{{
                      t('severityHigh')
                    }}</span>
                    <span class="preview-difficulty">{{ t('previewDifficulty') }}</span>
                  </div>
                </div>
                <!-- Title from frontmatter -->
                <div class="preview-title anim-preview" style="--pdelay: 1.8s">
                  {{ t('previewMissingAlt') }}
                </div>
                <!-- Body text -->
                <div class="preview-body-text anim-preview" style="--pdelay: 2.3s">
                  {{ t('previewBody') }} <code>alt</code> {{ t('previewBodySuffix') }}
                </div>
                <!-- Heading -->
                <div class="preview-h2 anim-preview" style="--pdelay: 3s">
                  {{ t('previewRecommendation') }}
                </div>
                <!-- Body text -->
                <div class="preview-body-text anim-preview" style="--pdelay: 3.5s">
                  {{ t('previewRecommendationText') }} <code>alt</code>:
                </div>
                <!-- Code block -->
                <div class="preview-code-block anim-preview" style="--pdelay: 4s">
                  <code>&lt;img alt="{{ t('mdAltValue') }}" /&gt;</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab triggers with pause button and progress bar -->
      <div class="showcase-tablist-wrapper">
        <button
          class="showcase-pause-btn"
          :aria-label="paused ? t('playAnimations') : t('pauseAnimations')"
          @click="togglePause"
        >
          <!-- Pause icon -->
          <svg
            v-if="!paused"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
          >
            <rect x="2" y="1" width="3.5" height="12" rx="1" fill="currentColor" />
            <rect x="8.5" y="1" width="3.5" height="12" rx="1" fill="currentColor" />
          </svg>
          <!-- Play icon -->
          <svg v-else width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M3 1.5L12 7L3 12.5V1.5Z" fill="currentColor" />
          </svg>
        </button>
        <div role="tablist" :aria-label="t('featureShowcase')" class="showcase-tablist">
          <template v-for="(tab, i) in tabs" :key="tab.id">
            <div v-if="i > 0" class="showcase-divider" aria-hidden="true" />
            <button
              :id="`showcase-tab-${tab.id}`"
              role="tab"
              :aria-selected="activeIndex === i"
              :aria-controls="`showcase-panel-${tab.id}`"
              :tabindex="activeIndex === i ? 0 : -1"
              :data-index="i"
              class="showcase-tab"
              :class="activeIndex === i ? 'showcase-tab-active' : ''"
              @click="setTab(i)"
              @keydown="onTabKeydown"
            >
              <div class="showcase-progress" aria-hidden="true">
                <div
                  class="showcase-progress-fill"
                  :class="activeIndex === i ? '' : 'hidden'"
                  :style="{
                    transform: `translateX(-${100 - progress}%)`
                  }"
                />
              </div>
              <span class="showcase-tab-content">
                {{ t(tab.labelKey) }}
              </span>
            </button>
          </template>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ==============================
   Keyframe Animations
   ============================== */

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideRight {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes rowIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pop {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  70% {
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes expandDown {
  from {
    max-height: 0;
    opacity: 0;
  }
  to {
    max-height: 300px;
    opacity: 1;
  }
}

@keyframes rotateChevron {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(90deg);
  }
}

@keyframes pageIn {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes lineDraw {
  from {
    transform: scaleX(0);
    opacity: 0;
  }
  to {
    transform: scaleX(1);
    opacity: 1;
  }
}

@keyframes typeLine {
  from {
    opacity: 0;
    transform: translateX(-4px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}

@keyframes cursorMove {
  0% {
    opacity: 0;
    transform: translate(300px, -40px);
  }
  20% {
    opacity: 1;
    transform: translate(300px, -40px);
  }
  60% {
    transform: translate(40px, 4px);
  }
  72% {
    transform: translate(40px, 4px) scale(0.85);
  }
  78% {
    transform: translate(40px, 4px) scale(1);
  }
  100% {
    transform: translate(40px, 4px);
    opacity: 1;
  }
}

@keyframes pdfProgressFill {
  0% {
    width: 0;
  }
  60% {
    width: 85%;
  }
  90% {
    width: 100%;
  }
  100% {
    width: 100%;
    opacity: 0;
  }
}

/* Reports: table fades out, detail fades in */
@keyframes tableFadeOut {
  0%,
  55% {
    opacity: 1;
    transform: translateY(0);
  }
  70% {
    opacity: 0;
    transform: translateY(-10px);
  }
  100% {
    opacity: 0;
    transform: translateY(-10px);
  }
}

@keyframes detailFadeIn {
  0%,
  60% {
    opacity: 0;
    transform: translateY(15px);
  }
  80% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes previewIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ==============================
   Animation utility classes
   ============================== */

.anim-fade-in {
  animation: fadeIn 0.3s ease-out both;
}

.anim-row {
  animation: rowIn 0.4s ease-out both;
  animation-delay: calc(0.3s + var(--row) * 0.15s);
}

.anim-slide-up {
  animation: slideUp 0.5s ease-out both;
  animation-delay: var(--delay, 0s);
}

.anim-slide-right {
  animation: slideRight 0.4s ease-out both;
  animation-delay: var(--delay, 0s);
}

.anim-pop {
  animation: pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  animation-delay: var(--delay, 0s);
}

.anim-expand {
  animation: expandDown 0.5s ease-out both;
  animation-delay: var(--delay, 0s);
  overflow: hidden;
}

.anim-rotate-chevron {
  display: inline-block;
  animation: rotateChevron 0.3s ease-out both;
  animation-delay: var(--delay, 0s);
}

.anim-page-in {
  animation: pageIn 0.6s ease-out both;
  animation-delay: var(--delay, 0s);
}

.anim-fade-in-up {
  animation: fadeInUp 0.4s ease-out both;
  animation-delay: var(--delay, 0s);
}

.anim-line-draw {
  transform-origin: left center;
  animation: lineDraw 0.5s ease-out both;
  animation-delay: var(--delay, 0s);
}

.anim-type-line {
  animation: typeLine 0.15s ease-out both;
  animation-delay: calc(0.3s + var(--line) * 0.25s);
}

.anim-text-cursor {
  position: absolute;
  bottom: 1.25rem;
  width: 2px;
  height: 1rem;
  background: var(--vp-c-brand-1);
  animation: blink 1s step-end infinite;
  animation-delay: calc(0.3s + 16 * 0.25s);
  opacity: 0;
  left: 1.25rem;
}

.anim-cursor {
  position: absolute;
  pointer-events: none;
  z-index: 20;
}

.anim-cursor-reports {
  top: 30%;
  left: 15%;
  animation: cursorMove 3s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: 1s;
}

.anim-preview {
  animation: previewIn 0.35s ease-out both;
  animation-delay: var(--pdelay, 0s);
}

/* Reports two-phase animation */
.reports-table-phase {
  animation: tableFadeOut 5s ease-in-out both;
  animation-delay: 1s;
}

.reports-detail-phase {
  position: absolute;
  inset: 1rem;
  animation: detailFadeIn 5s ease-out both;
  animation-delay: 1s;
}

/* PDF progress bar */
.mockup-pdf-progress-bar {
  width: 6rem;
  height: 0.375rem;
  border-radius: 0.25rem;
  background: var(--vp-c-border);
  overflow: hidden;
}

.mockup-pdf-progress-fill {
  height: 100%;
  border-radius: 0.25rem;
  background: var(--vp-c-brand-1);
  animation: pdfProgressFill 5s ease-out both;
  animation-delay: 0.3s;
}

/* Reduce motion */
@media (prefers-reduced-motion: reduce) {
  .anim-fade-in,
  .anim-row,
  .anim-slide-up,
  .anim-slide-right,
  .anim-pop,
  .anim-expand,
  .anim-rotate-chevron,
  .anim-page-in,
  .anim-fade-in-up,
  .anim-line-draw,
  .anim-type-line,
  .anim-preview {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
    max-height: none !important;
  }

  .anim-text-cursor,
  .anim-cursor {
    display: none !important;
  }
  .mockup-pdf-progress-fill {
    animation: none !important;
    width: 100%;
  }
  .reports-table-phase {
    animation: none !important;
    opacity: 1 !important;
  }
  .reports-detail-phase {
    animation: none !important;
    opacity: 0 !important;
    position: static;
  }
}

/* ==============================
   Pause button + tablist wrapper
   ============================== */

.showcase-tablist-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.showcase-pause-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  border: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition:
    color 0.15s,
    border-color 0.15s;
  flex-shrink: 0;
}

.showcase-pause-btn:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.showcase-pause-btn:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

/* ==============================
   Tab list
   ============================== */

.showcase-tablist {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: 0.75rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  z-index: 10;
}

.showcase-divider {
  width: 1px;
  height: 1rem;
  background: var(--vp-c-border);
}

.showcase-tab {
  position: relative;
  overflow: hidden;
  border-radius: 0.5rem;
  min-width: fit-content;
  cursor: pointer;
  border: none;
  background: transparent;
  padding: 0;
}

.showcase-tab:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

.showcase-tab-active {
  background: var(--vp-c-brand-soft);
}

.showcase-progress {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: 0.5rem;
}

.showcase-progress-fill {
  width: 100%;
  height: 100%;
  background: var(--vp-c-brand-soft);
  transition: transform 80ms linear;
}

.showcase-tab-content {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  color: var(--vp-c-text-2);
}

.showcase-tab-active .showcase-tab-content {
  color: var(--vp-c-brand-1);
}

/* ==============================
   Panels
   ============================== */

.showcase-panels {
  position: relative;
}

.showcase-panel:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 4px;
  border-radius: 0.75rem;
}

/* ==============================
   Mockup frame
   ============================== */

.mockup {
  border-radius: 0.75rem;
  border: 1px solid var(--vp-c-border);
  overflow: hidden;
  background: var(--vp-c-bg);
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.08),
    0 12px 24px -8px rgba(0, 0, 0, 0.04);
}

.dark .mockup {
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.3),
    0 12px 24px -8px rgba(0, 0, 0, 0.2);
}

.mockup-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg-soft);
}

.mockup-dots {
  display: flex;
  gap: 0.375rem;
}
.mockup-dots span {
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 50%;
  background: var(--vp-c-border);
}

.mockup-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  flex: 1;
}

.mockup-title-preview {
  text-align: center;
  color: var(--vp-c-text-3);
}

.mockup-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.mockup-search {
  width: 8rem;
  height: 1.5rem;
  border-radius: 0.375rem;
  border: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg);
}
.mockup-btn-icon {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.375rem;
  border: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg);
}
.mockup-btn {
  font-size: 0.6875rem;
  font-weight: 500;
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid var(--vp-c-border);
  color: var(--vp-c-text-2);
  white-space: nowrap;
}
.mockup-btn-primary {
  background: var(--vp-button-brand-bg);
  color: white;
  border-color: var(--vp-button-brand-bg);
}

/* ==============================
   Mockup body
   ============================== */

.mockup-body {
  padding: 1rem;
  min-height: 320px;
  position: relative;
  overflow: hidden;
}
.mockup-body-reports {
  min-height: 320px;
}

/* Table */
.mockup-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;
}
.mockup-table th {
  text-align: left;
  padding: 0.5rem 0.75rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
  border-bottom: 1px solid var(--vp-c-border);
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.mockup-table td {
  padding: 0.625rem 0.75rem;
  border-bottom: 1px solid var(--vp-c-divider);
}
.mockup-row-highlight {
  background: var(--vp-c-brand-soft);
}
.mockup-row-clickable {
  transition: background 0.2s;
}
.mockup-link {
  color: var(--vp-c-brand-1);
  font-weight: 500;
}
.mockup-text-muted {
  color: var(--vp-c-text-2);
}

.mockup-badge-a,
.mockup-badge-aa,
.mockup-badge-aaa {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.025em;
}
.mockup-badge-a {
  background: rgba(234, 179, 8, 0.15);
  color: #854d0e;
}
.mockup-badge-aa {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}
.mockup-badge-aaa {
  background: rgba(139, 92, 246, 0.15);
  color: #6d28d9;
}
.dark .mockup-badge-a {
  color: #facc15;
}
.dark .mockup-badge-aaa {
  color: #a78bfa;
}

/* Report detail (phase 2) */
.report-detail-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.report-detail-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin: 0;
}
.report-detail-meta {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
}
.report-meta-item {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}
.report-meta-label {
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-3);
}
.report-meta-value {
  font-size: 0.75rem;
  color: var(--vp-c-text-1);
  font-weight: 500;
}
.report-detail-section {
  margin-bottom: 1rem;
}
.report-detail-heading {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin-bottom: 0.5rem;
}
.report-detail-line {
  height: 0.375rem;
  background: var(--vp-c-divider);
  border-radius: 0.125rem;
  margin-bottom: 0.3rem;
}
.report-detail-scorecard {
  display: flex;
  gap: 0.75rem;
}
.scorecard-item {
  flex: 1;
  padding: 0.625rem;
  border-radius: 0.5rem;
  text-align: center;
}
.scorecard-pass {
  background: var(--vp-c-brand-soft);
}
.scorecard-fail {
  background: rgba(239, 68, 68, 0.1);
}
.scorecard-na {
  background: rgba(234, 179, 8, 0.1);
}
.scorecard-number {
  display: block;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--vp-c-text-1);
}
.scorecard-label {
  font-size: 0.5625rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Issues */
.mockup-body-issues {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.mockup-principle {
  border: 1px solid var(--vp-c-border);
  border-radius: 0.5rem;
  overflow: hidden;
}
.mockup-principle-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft);
}
.mockup-principle-icon {
  font-size: 1rem;
}
.mockup-ml-auto {
  margin-left: auto;
}
.mockup-guideline {
  border-top: 1px solid var(--vp-c-divider);
}
.mockup-guideline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem 0.5rem 1.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
}
.mockup-chevron {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
}
.mockup-criterion {
  border-top: 1px solid var(--vp-c-divider);
  margin: 0 0.75rem;
  padding: 0.5rem 0;
}
.mockup-criterion-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.6875rem;
  padding-left: 0.75rem;
}
.mockup-criterion-name {
  color: var(--vp-c-text-2);
  flex: 1;
}
.mockup-status-failed {
  font-size: 0.625rem;
  font-weight: 600;
  color: #b91c1c;
  background: rgba(239, 68, 68, 0.1);
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
}
.dark .mockup-status-failed {
  color: #fca5a5;
}
.mockup-status-passed {
  font-size: 0.625rem;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
}
.mockup-issue {
  padding: 0.375rem 0.75rem 0.375rem 1.5rem;
}
.mockup-issue-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.mockup-issue-title {
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--vp-c-text-1);
}
.mockup-severity-high {
  font-size: 0.5625rem;
  font-weight: 600;
  color: #b91c1c;
  background: rgba(239, 68, 68, 0.1);
  padding: 0.0625rem 0.375rem;
  border-radius: 9999px;
}
.dark .mockup-severity-high {
  color: #fca5a5;
}
.mockup-severity-low {
  font-size: 0.5625rem;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  padding: 0.0625rem 0.375rem;
  border-radius: 9999px;
}
.mockup-principle-collapsed .mockup-principle-header {
  background: transparent;
}

/* PDF */
.mockup-body-pdf {
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
  display: flex;
  justify-content: center;
  overflow-x: auto;
}
.mockup-pdf-pages {
  display: flex;
  gap: 1.5rem;
  max-width: 100%;
}
.mockup-pdf-page {
  width: 220px;
  min-height: 300px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 0.25rem;
  padding: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}
.dark .mockup-pdf-page {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
.mockup-pdf-cover {
  display: flex;
  align-items: center;
  justify-content: center;
}
.mockup-pdf-cover-content {
  text-align: center;
}
.mockup-pdf-logo {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: var(--vp-c-brand-soft);
  border: 2px solid var(--vp-c-brand-1);
  margin: 0 auto 0.75rem;
}
.mockup-pdf-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  line-height: 1.3;
  margin-bottom: 1rem;
}
.mockup-pdf-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.5625rem;
  color: var(--vp-c-text-3);
}
.mockup-pdf-page-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.5rem;
  color: var(--vp-c-text-3);
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--vp-c-divider);
  margin-bottom: 0.75rem;
}
.mockup-pdf-heading {
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin-bottom: 0.5rem;
}
.mockup-pdf-heading-sm {
  font-size: 0.625rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin-bottom: 0.375rem;
}
.mockup-pdf-line {
  height: 0.375rem;
  background: var(--vp-c-divider);
  border-radius: 0.125rem;
  margin-bottom: 0.3rem;
}
.mockup-pdf-spacer {
  height: 0.75rem;
}
.mockup-pdf-table {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 0.25rem;
  overflow: hidden;
  font-size: 0.5625rem;
}
.mockup-pdf-table-row {
  display: grid;
  grid-template-columns: 3fr 1fr 1fr 1fr;
  padding: 0.25rem 0.375rem;
  color: var(--vp-c-text-2);
  border-bottom: 1px solid var(--vp-c-divider);
}
.mockup-pdf-table-row:last-child {
  border-bottom: none;
}
.mockup-pdf-table-header {
  font-weight: 600;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft);
}

/* Markdown split view */
.mockup-body-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 0;
  min-height: 360px;
}

.split-editor {
  position: relative;
  border-right: 1px solid var(--vp-c-border);
  overflow: hidden;
}

.split-preview {
  padding: 1rem 1.25rem;
  overflow: hidden;
}

.mockup-code {
  display: block;
  margin: 0;
  padding: 1rem 1.25rem;
  font-family: var(--vp-font-family-mono);
  font-size: 0.6875rem;
  line-height: 1.7;
  color: var(--vp-c-text-2);
  white-space: pre;
  background: transparent;
}

.mockup-code-comment {
  color: var(--vp-c-text-3);
}
.mockup-code-key {
  color: var(--vp-c-brand-1);
}
.mockup-code-punct {
  color: var(--vp-c-text-3);
}
.mockup-code-string {
  color: #be185d;
}
.dark .mockup-code-string {
  color: #f9a8d4;
}
.mockup-code-heading {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}
.mockup-code-fence {
  color: var(--vp-c-text-3);
}
.mockup-code-tag {
  color: #2563eb;
}
.dark .mockup-code-tag {
  color: #60a5fa;
}
.mockup-code-attr {
  color: var(--vp-c-brand-1);
}
.mockup-code-inline {
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft);
  padding: 0.0625rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.625rem;
}

/* Preview pane */
.preview-header {
  margin-bottom: 0.75rem;
  padding-bottom: 0.625rem;
  border-bottom: 1px solid var(--vp-c-divider);
}
.preview-badge-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
}
.preview-sc {
  font-size: 0.6875rem;
  color: var(--vp-c-text-2);
}
.preview-meta-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.preview-severity {
  font-size: 0.5625rem;
  font-weight: 600;
  padding: 0.0625rem 0.375rem;
  border-radius: 9999px;
}
.preview-severity-high {
  color: #b91c1c;
  background: rgba(239, 68, 68, 0.1);
}
.dark .preview-severity-high {
  color: #fca5a5;
}
.preview-difficulty {
  font-size: 0.5625rem;
  color: var(--vp-c-text-3);
}
.preview-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin-bottom: 0.625rem;
}
.preview-body-text {
  font-size: 0.6875rem;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  margin-bottom: 0.625rem;
}
.preview-body-text code {
  font-size: 0.625rem;
  background: var(--vp-c-bg-soft);
  padding: 0.0625rem 0.25rem;
  border-radius: 0.25rem;
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-mono);
}
.preview-h2 {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin-bottom: 0.375rem;
  padding-top: 0.25rem;
  border-top: 1px solid var(--vp-c-divider);
  padding-top: 0.5rem;
}
.preview-code-block {
  font-size: 0.625rem;
  font-family: var(--vp-font-family-mono);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  color: var(--vp-c-text-1);
}

/* ==============================
   Responsive
   ============================== */

@media (max-width: 768px) {
  .showcase-tablist-wrapper {
    justify-content: flex-start;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .showcase-tablist-wrapper::-webkit-scrollbar {
    display: none;
  }

  .mockup-body {
    min-height: 260px;
  }

  .mockup-table th:nth-child(3),
  .mockup-table td:nth-child(3),
  .mockup-table th:nth-child(4),
  .mockup-table td:nth-child(4) {
    display: none;
  }

  .mockup-pdf-pages {
    flex-direction: column;
    align-items: center;
  }
  .mockup-pdf-page {
    width: 100%;
    max-width: 220px;
    min-height: auto;
  }

  .mockup-actions .mockup-btn {
    display: none;
  }
  .mockup-actions .mockup-btn-primary {
    display: block;
  }

  .anim-cursor {
    display: none;
  }

  .mockup-body-split {
    grid-template-columns: 1fr;
  }
  .split-editor {
    border-right: none;
    border-bottom: 1px solid var(--vp-c-border);
  }
  .mockup-title-preview {
    display: none;
  }

  .report-detail-meta {
    grid-template-columns: 1fr;
  }
}
</style>
