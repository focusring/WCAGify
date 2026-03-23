export default {
  colorMode: {
    dark: 'Donker',
    light: 'Licht',
    system: 'Systeem'
  },
  connection: {
    url: 'WCAGify URL',
    connect: 'Verbinden',
    connecting: 'Verbinden...',
    connected: 'Verbonden',
    connectionFailed: 'Verbinding mislukt',
    connectionRefused:
      'Kan geen verbinding maken. Controleer of de WCAGify-server draait op deze URL. Voorbeeld: http://localhost:3000',
    connectionHttpError:
      'Er ging iets mis bij het verbinden. Controleer of de ingevoerde URL een WCAGify-instantie is en correct is. Voorbeeld: http://localhost:3000',
    required: 'verplicht',
    scanning: 'Zoeken naar WCAGify-instanties...',
    selectInstance: 'WCAGify-instantie',
    enterManually: 'URL handmatig invoeren',
    change: 'Wijzigen',
    rescan: 'Opnieuw scannen',
    autoConnected: 'Automatisch verbonden met een gevonden draaiende WCAGify-instantie.',
    report: 'Rapport',
    selectReport: 'Selecteer een rapport'
  },
  picker: {
    pickElement: 'Element selecteren',
    picking: 'Selecteren... (klik op een element op de pagina)',
    selector: 'Selector:',
    url: 'URL:',
    page: 'Pagina:',
    hoverHint: 'Beweeg over een element...',
    clickHint: 'Klik om te selecteren · Esc om te annuleren'
  },
  form: {
    issueTitle: 'Titel probleem',
    issueTitlePlaceholder: 'bijv. Dropdown niet toegankelijk met toetsenbord',
    sc: 'SC',
    severity: 'Ernst',
    samplePage: 'Voorbeeldpagina',
    selectPage: 'Selecteer een pagina',
    description: 'Beschrijving',
    descriptionPlaceholder: "Schrijf, typ '/' voor commando's...",
    submit: 'Probleem indienen',
    submitting: 'Indienen...',
    issueCreated: 'Probleem aangemaakt',
    failedToCreate: 'Probleem aanmaken mislukt',
    required: 'verplicht',
    noResults: 'Geen overeenkomende criteria',
    low: 'Laag',
    medium: 'Gemiddeld',
    high: 'Hoog'
  },
  editor: {
    undo: 'Ongedaan maken',
    redo: 'Opnieuw',
    headings: 'Koppen',
    heading6: 'Kop',
    lists: 'Lijsten',
    bulletList: 'Ongeordende lijst',
    orderedList: 'Geordende lijst',
    numberedList: 'Genummerde lijst',
    blockquote: 'Citaat',
    codeBlock: 'Codeblok',
    bold: 'Vet',
    italic: 'Cursief',
    underline: 'Onderstrepen',
    strikethrough: 'Doorhalen',
    code: 'Code',
    link: 'Link',
    image: 'Afbeelding',
    horizontalRule: 'Horizontale lijn',
    style: 'Stijl',
    paragraph: 'Paragraaf',
    insert: 'Invoegen'
  },
  language: 'Taal'
} as const
