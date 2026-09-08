export default {
  app: {
    title: 'WCAGify',
    description: 'WCAG accessibility reporting tool',
    reports: 'Reports',
    noReports: 'No reports found',
    gridView: 'Grid view',
    tableView: 'Table view',
    columns: 'Columns'
  },
  report: {
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
      'not-present': 'Not present',
      'not-tested': 'Not tested'
    },
    wcagPrinciple: 'WCAG Principle',
    principle: 'Principle',
    result: 'Result',
    total: 'Total',
    conformanceLevel: 'Conformance level: {level} — {conforming} of {total} criteria met',
    criteriaMet: '{conforming} of {total} criteria met',
    criteriaNotTested: '{count} not tested',
    scorecardNotTestedNote:
      '{count} criteria have no recorded outcome. They count as not tested and are not counted as met.',
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
      },
      'not-tested': {
        title: 'No untested criteria found',
        description: 'All criteria have been tested and assigned a result.'
      }
    },
    downloadPdf: 'Download PDF',
    downloadEarl: 'Download EARL',
    searchReports: 'Search reports...'
  },
  import: {
    title: 'Import EARL',
    description:
      'Import an EARL (JSON-LD) evaluation from WCAGify, the W3C WCAG-EM Report Tool or an automated testing tool as a report.',
    file: 'EARL file',
    fileHelp: 'A .json or .jsonld file. The file is checked before anything is written.',
    warnings: 'Warnings',
    mode: 'Import as',
    modeCreate: 'New report',
    modeMerge: 'Add to an existing report',
    slug: 'Report slug',
    slugHelp: 'Directory name under content/reports. Lowercase letters, numbers and hyphens.',
    slugInvalid: 'Use only lowercase letters, numbers and hyphens.',
    mergeInto: 'Existing report',
    cancel: 'Cancel',
    import: 'Import',
    success: 'Imported {count} issue(s)',
    error: 'The import failed. Check the file and try again.'
  },
  share: {
    share: 'Share',
    shareReport: 'Share report',
    createLink: 'Create share link',
    copyLink: 'Copy link',
    copied: 'Copied!',
    deleteLink: 'Delete link',
    expiresAt: 'Expires at',
    noExpiry: 'No expiry',
    activeLinks: 'Active share links',
    noLinks: 'No share links yet',
    notFound: 'This share link was not found or has expired',
    createdAt: 'Created',
    password: 'Password',
    passwordOptional: 'Optional',
    passwordRequired: 'Password required',
    passwordDescription: 'This report is protected. Enter the password to view it.',
    passwordIncorrect: 'Incorrect password. Please try again.',
    passwordProtected: 'Password protected',
    unlock: 'View report',
    adminRequired: 'Admin authentication required',
    adminDescription: 'Enter your admin secret to manage share links.',
    adminSecret: 'Admin secret',
    adminLogin: 'Authenticate',
    adminError: 'Invalid admin secret. Please try again.',
    error: 'Something went wrong. Please try again.',
    required: 'required'
  },
  admin: {
    loginTitle: 'Sign in',
    loginDescription: 'Enter the admin secret to access WCAGify.',
    setupRequired: 'Setup required',
    setupDescription:
      'WCAGify requires the WCAGIFY_ADMIN_SECRET environment variable to be configured before it can be used.',
    secret: 'Admin secret',
    signIn: 'Sign in',
    invalidSecret: 'Invalid admin secret. Please try again.'
  },
  settings: {
    title: 'Settings',
    tagline: 'Customize your WCAGify experience',
    appearance: 'Appearance',
    theme: 'Theme',
    accentColor: 'Accent color',
    backgroundShade: 'Background shade',
    generalSection: 'General',
    language: 'Language',
    back: 'return'
  }
}
