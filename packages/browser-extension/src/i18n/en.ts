export default {
  colorMode: {
    dark: 'Dark',
    light: 'Light',
    system: 'System'
  },
  connection: {
    url: 'WCAGify URL',
    connect: 'Connect',
    connecting: 'Connecting...',
    connected: 'Connected',
    disconnected: 'Disconnected',
    connectionFailed: 'Connection failed',
    connectionRefused:
      'Could not connect. Make sure the WCAGify server is running at this URL. Example: http://localhost:3000',
    connectionHttpError:
      'Something went wrong while connecting. Make sure the entered URL is a WCAGify instance and is correctly formatted. For example: http://localhost:3000.',
    required: 'required',
    scanning: 'Scanning for WCAGify instances...',
    selectInstance: 'WCAGify Instance',
    enterManually: 'Enter URL manually',
    change: 'Change',
    rescan: 'Scan again',
    autoConnected: 'Automatically connected to a detected running WCAGify instance.',
    connectionSuccess: 'Successfully connected to WCAGify.',
    urlClearedWarning:
      'Enter a URL to connect to a WCAGify report. For example: http://localhost:3000.',
    report: 'Report',
    selectReport: 'Select a report'
  },
  picker: {
    pickElement: 'Pick Element',
    picking: 'Picking... (click an element on the page)',
    selector: 'Selector:',
    url: 'URL:',
    page: 'Page:',
    hoverHint: 'Hover over an element...',
    clickHint: 'Click to select · Esc to cancel'
  },
  form: {
    required: 'required',
    clear: 'Clear',
    descBtnOpen: 'Show more information for',
    descBtnClose: 'Hide information for',
    descExpanded: 'Additional information expanded',
    descCollapsed: 'Additional information collapsed',
    samplePage: {
      label: 'Sample Page',
      placeholder: 'Select a page',
      description:
        'Choose from pages you have access to. The URL will be included in the report to help locate the issue.',
      clear: 'Clear Sample Page Selection',
      error: 'Please select one of the detected pages.'
    },
    issueTitle: {
      label: 'Issue Title',
      placeholder: 'e.g. Dropdown not keyboard accessible',
      description:
        'Add a concise title describing the accessibility issue. This will be used as the issue title in the report.',
      clear: 'Clear Issue Title',
      error: 'Please enter a fitting title for the issue.'
    },
    sc: {
      label: 'SC',
      ariaLabel: 'Success Criteria',
      placeholder: 'e.g. 2.1.1 keyboard',
      description:
        'Find and select the relevant WCAG success criteria that are not met. This will help categorize the issue and provide guidance on how to fix it.',
      search: 'Search Criteria...',
      noResults: 'No matching criteria found',
      error: 'Please select a valid success criterion from the list.',
      clear: 'Clear Success Criteria Selection',
      level: 'Level'
    },
    severity: {
      label: 'Severity',
      description: 'How severely the issue affects users',
      clear: 'Clear Severity Level',
      none: 'None',
      low: 'Low',
      medium: 'Medium',
      high: 'High'
    },
    type: {
      label: 'Type',
      description:
        'The nature of the issue, e.g. whether it is a content issue, a design issue, or a technical issue that needs to be fixed in the code.',
      clear: 'Clear Type Selection',
      unknown: 'Unknown',
      content: 'Content',
      design: 'Design',
      technical: 'Technical'
    },
    description: {
      label: 'Description',
      description:
        'Provide a detailed description of the issue, including what the problem is, where it occurs, and any relevant context. This information will help developers understand and fix the issue.',
      placeholder: "Write, type '/' for commands..."
    },
    submitIssue: {
      label: 'Submit Issue',
      loading: 'Submitting...',
      issueSuccess: 'Issue created',
      issueFailed: 'Failed to create issue'
    }
  },
  editor: {
    undo: 'Undo',
    redo: 'Redo',
    headings: 'Headings',
    heading6: 'Heading',
    lists: 'Lists',
    bulletList: 'Bullet List',
    orderedList: 'Ordered List',
    numberedList: 'Numbered List',
    blockquote: 'Blockquote',
    codeBlock: 'Code Block',
    bold: 'Bold',
    italic: 'Italic',
    underline: 'Underline',
    strikethrough: 'Strikethrough',
    code: 'Code',
    link: 'Link',
    image: 'Image',
    horizontalRule: 'Horizontal Rule',
    style: 'Style',
    paragraph: 'Paragraph',
    insert: 'Insert'
  },
  setup: {
    title: 'Welcome to WCAGify',
    description:
      'Connect to a running WCAGify instance to start reporting accessibility issues directly from your browser.',
    helpTitle: 'Getting started',
    step1: 'Start your WCAGify project locally (e.g. pnpm dev)',
    step2: 'Enter the URL or let the extension auto-detect it',
    step3: 'Select a report and start auditing',
    docsLink: 'Read the full WCAGify guide'
  },
  language: 'Language',
  settings: {
    title: 'Settings',
    back: 'Back',
    appearance: 'Appearance',
    colorMode: 'Theme',
    languageLabel: 'Language',
    general: 'General',
    wcagifyUrl: 'WCAGify URL',
    clear: 'Clear WCAGify URL',
    save: 'Save',
    saved: 'Saved',
    accentColor: 'Accent Color',
    backgroundShade: 'Background Shade',
    clearColor: 'Clear color',
    license: 'is released under the MIT License.',
    terms: 'Terms',
    privacy: 'Privacy',
    security: 'Security',
    madeBy: 'Made with ❤️ by',
    inRegion: 'in Europe 🇪🇺',
    version: 'Version'
  }
} as const
