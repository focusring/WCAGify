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
      'This report describes the results of an accessibility evaluation conducted according to the Web Content Accessibility Guidelines (WCAG). The evaluation was performed using the WCAG-EM methodology (Website Accessibility Conformance Evaluation Methodology).\n\nThe identified issues have been assessed for severity and difficulty. Each issue includes a recommendation for resolving the problem.',
    scope: 'Scope',
    scopeItems: 'Scope items',
    notInScope: 'Not in scope',
    accessibilitySupport: 'Accessibility support',
    accessibilitySupportExplanation:
      'The following combinations of operating systems, browsers, and assistive technologies were used to assess accessibility.',
    technologiesUsed: 'Technologies used',
    technologiesExplanation: 'The following web technologies are used by the website under review.',
    sample: 'Sample',
    representativeSample: 'Representative sample',
    issues: 'Issues',
    results: 'Results',
    tips: 'Tips',
    successCriterion: 'Success criterion',
    type: 'Type',
    typesort: {
      content: 'Content',
      technical: 'Technical',
      design: 'Design',
      unknown: 'Unknown'
    },
    severity: 'Severity',
    severityLevel: {
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
    scoreFormat: '{conforming} / {total}',
    downloadPdf: 'Download PDF',
    searchReports: 'Search reports...'
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
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
    accentColor: 'Accent color',
    backgroundShade: 'Background shade',
    clearColor: 'Clear color',
    languageSection: 'Language',
    language: 'Language',
    back: 'back'
  }
}
