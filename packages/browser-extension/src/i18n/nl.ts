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
    disconnected: 'Niet verbonden',
    connectionFailed: 'Verbinding mislukt',
    connectionRefused:
      'Kan geen verbinding maken. Controleer of de WCAGify-server draait op deze URL. Voorbeeld: http://localhost:3000',
    connectionHttpError:
      'Er ging iets mis bij het verbinden. Controleer of de ingevoerde URL een WCAGify-instantie is en correct is opgemaakt. Bijvoorbeeld: http://localhost:3000.',
    required: 'verplicht',
    scanning: 'Zoeken naar WCAGify-instanties...',
    selectInstance: 'WCAGify-instantie',
    enterManually: 'URL handmatig invoeren',
    change: 'Wijzigen',
    rescan: 'Opnieuw scannen',
    autoConnected: 'Automatisch verbonden met een gevonden draaiende WCAGify-instantie.',
    connectionSuccess: 'Succesvol verbonden met WCAGify.',
    urlClearedWarning:
      'Voer een URL in om verbinding te maken met een WCAGify-rapport. Voorbeeld: http://localhost:3000',
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
    required: 'verplicht',
    clear: 'Wissen',
    descBtnOpen: 'Meer informatie tonen voor',
    descBtnClose: 'Informatie verbergen voor',
    descExpanded: 'Extra informatie uitgeklapt',
    descCollapsed: 'Extra informatie ingeklapt',
    samplePage: {
      label: 'Voorbeeldpagina',
      placeholder: 'Selecteer een pagina',
      description:
        "Kies uit pagina's waartoe je toegang hebt. De URL wordt in het rapport opgenomen om het probleem te helpen lokaliseren.",
      clear: 'Voorbeeldpagina wissen',
      error: "Selecteer een van de gedetecteerde pagina's."
    },
    issueTitle: {
      label: 'Titel probleem',
      placeholder: 'bijv. Dropdown niet toegankelijk met toetsenbord',
      description:
        'Voeg een beknopte titel toe die het toegankelijkheidsprobleem beschrijft. Dit wordt gebruikt als de probleemtitel in het rapport.',
      clear: 'Titel probleem wissen',
      error: 'Voer een titel in die bij het probleem past.'
    },
    sc: {
      label: 'SC',
      ariaLabel: 'Succescriteria',
      placeholder: 'bijv. 2.1.1 toetsenbord',
      description:
        'Zoek en selecteer de relevante WCAG-succescriteria waaraan niet wordt voldaan. Dit helpt het probleem te categoriseren en biedt richtlijnen voor het oplossen ervan.',
      search: 'Criteria zoeken...',
      noResults: 'Geen overeenkomende criteria gevonden',
      error: 'Selecteer een bestaande succescriterium uit de lijst.',
      clear: 'Succescriteria wissen',
      level: 'Niveau'
    },
    severity: {
      label: 'Ernst',
      description: 'Hoe ernstig het probleem gebruikers treft',
      clear: 'Ernst wissen',
      none: 'Geen',
      low: 'Laag',
      medium: 'Gemiddeld',
      high: 'Hoog'
    },
    description: {
      label: 'Beschrijving',
      description: 'Optionele context, stappen om te reproduceren of verwacht gedrag',
      placeholder: "Schrijf, typ '/' voor commando's..."
    },
    type: {
      label: 'Type',
      description:
        'De aard van het probleem, bijvoorbeeld of het een inhoudsprobleem is, een ontwerpprobleem of een technisch probleem dat in de code moet worden opgelost.',
      clear: 'Type wissen',
      unknown: 'Onbekend',
      content: 'Content',
      design: 'Ontwerp',
      technical: 'Technisch'
    },
    submitIssue: {
      label: 'Probleem indienen',
      loading: 'Indienen...',
      issueSuccess: 'Probleem aangemaakt',
      issueFailed: 'Probleem aanmaken mislukt'
    }
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
  setup: {
    title: 'Welkom bij WCAGify',
    description:
      'Maak verbinding met een draaiende WCAGify-instantie om toegankelijkheidsproblemen direct vanuit je browser te rapporteren.',
    helpTitle: 'Aan de slag',
    step1: 'Start je WCAGify-project lokaal (bijv. pnpm dev)',
    step2: 'Voer de URL in of laat de extensie deze automatisch detecteren',
    step3: 'Selecteer een rapport en begin met auditen',
    docsLink: 'Lees de volledige WCAGify handleiding'
  },
  language: 'Taal',
  settings: {
    title: 'Instellingen',
    back: 'Terug',
    appearance: 'Uiterlijk',
    colorMode: 'Kleurmodus',
    languageLabel: 'Taal',
    general: 'Algemeen',
    wcagifyUrl: 'WCAGify URL',
    clear: 'WCAGify URL wissen',
    save: 'Opslaan',
    saved: 'Opgeslagen',
    accentColor: 'Accentkleur',
    backgroundShade: 'Achtergrondtint',
    clearColor: 'Kleur wissen',
    license: 'is uitgebracht onder de MIT-licentie.',
    terms: 'Voorwaarden',
    privacy: 'Privacy',
    security: 'Beveiliging',
    madeBy: 'Gemaakt met ❤️ door',
    inRegion: 'in Europa 🇪🇺',
    version: 'Versie'
  }
} as const
