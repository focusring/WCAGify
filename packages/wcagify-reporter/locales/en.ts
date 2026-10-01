export default {
  report: {
    notFound: 'Report not found',
    accessibilityConformanceReportFor: 'Accessibility Conformance Report for {title}',
    title: 'Title',
    evaluatedBy: 'Evaluated by',
    commissionedBy: 'Commissioned by',
    target: 'Target',
    date: 'Date',
    wcagVersion: 'WCAG version',
    conformanceTarget: 'Conformance target',
    conformanceResult: 'Conformance result',
    specialRequirements: 'Special requirements',
    navigationTitle: 'Navigation',
    executiveSummary: 'Executive summary',
    resultsPerPrinciple: 'Results per principle',
    aboutThisReport: 'About this report',
    aboutThisReportText:
      'This report describes the results of an accessibility evaluation conducted according to the Web Content Accessibility Guidelines (WCAG). The evaluation was performed using the WCAG Evaluation Methodology (WCAG-EM), which defines the evaluation scope, explores the product, selects a representative sample set, evaluates that sample set and reports the findings.\n\nThe scores in this report count a success criterion as met when it was recorded as passed or as not present in the evaluated content. A criterion with one or more issues counts as failed. A criterion without a recorded outcome counts as not tested and is not counted as met. A score based on a sample set does not constitute a WCAG conformance claim for the entire product.\n\nThe identified issues have been assessed for severity and difficulty. Each issue includes a recommendation for resolving the problem.',
    scope: 'Scope',
    scopeItems: 'Scope items',
    notInScope: 'Not in scope',
    accessibilitySupport: 'Accessibility support',
    accessibilitySupportExplanation:
      'The following combinations of operating systems, browsers, and assistive technologies were used to assess accessibility.',
    technologiesUsed: 'Technologies used',
    technologiesExplanation: 'The following technologies are relied upon by the evaluated product.',
    evaluatedProduct: 'Evaluated product',
    additionalRequirements: 'Additional evaluation requirements',
    additionalRequirementsExplanation:
      'Requirements agreed between the evaluator and the commissioner beyond what is needed to evaluate conformance with WCAG.',
    sample: 'Sample',
    representativeSample: 'Representative sample set',
    issues: 'Issues',
    results: 'Results',
    tips: 'Tips',
    successCriteria: 'Success criteria',
    type: 'Type',
    typesort: {
      content: 'Content',
      design: 'Design',
      technical: 'Technical',
      unknown: 'Unknown'
    },
    severity: 'Severity',
    severityLevel: {
      none: 'None',
      low: 'Low',
      medium: 'Medium',
      high: 'High'
    },
    difficulty: 'Difficulty',
    difficultyLevel: {
      low: 'Low',
      medium: 'Medium',
      high: 'High'
    },
    url: 'URL',
    description: 'Description',
    externalLink: 'External link',
    opensInNewTab: 'opens in a new tab',
    showResults: 'Show results',
    enlargeImage: 'Enlarge image',
    enlargeImageNamed: 'Enlarge image: {alt}',
    enlargedImage: 'Enlarged image',
    principles: {
      perceivable: 'Perceivable',
      operable: 'Operable',
      understandable: 'Understandable',
      robust: 'Robust'
    },
    principleDescriptions: {
      perceivable:
        'Information and user interface components must be presentable to users in ways they can perceive.',
      operable: 'User interface components and navigation must be operable.',
      understandable: 'Information and the operation of user interface must be understandable.',
      robust:
        'Content must be robust enough that it can be interpreted reliably by a wide variety of user agents, including assistive technologies.'
    },
    scStatus: {
      passed: 'Passed',
      failed: 'Failed',
      'not-present': 'Not present'
    },
    wcagPrinciple: 'WCAG Principle',
    principle: 'Principle',
    result: 'Result',
    total: 'Total',
    conformanceLevel: 'Conformance level: {level} — {conforming} of {total} criteria met',
    criteriaMet: '{conforming} of {total} criteria met',
    scoreFormat: '{conforming} / {total}',
    emptyFilter: {
      passed: {
        title: 'No passed criteria found',
        description: 'None of the evaluated criteria have been marked as passed for this report.'
      },
      failed: {
        title: 'No failed criteria found',
        description: 'None of the evaluated criteria have been marked as failed. Great work!'
      },
      'not-present': {
        title: 'No criteria marked as not present found',
        description: 'All criteria are present in the evaluated content.'
      }
    },
    downloadPdf: 'Download PDF',
    downloadEarl: 'Download EARL',
    downloadStatus: {
      pdf: {
        generating: 'Generating PDF…',
        done: 'PDF downloaded',
        error: 'The PDF could not be generated. Please try again.'
      },
      earl: {
        generating: 'Generating EARL file…',
        done: 'EARL file downloaded',
        error: 'The EARL file could not be generated. Please try again.'
      }
    },
    searchReports: 'Search reports...'
  },
  codeBlock: {
    copied: 'Code copied',
    copiedLabel: 'Copied'
  }
}
