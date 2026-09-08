export default {
  app: {
    title: 'WCAGify',
    description: 'WCAG-toegankelijkheidsrapportagetool',
    reports: 'Rapporten',
    noReports: 'Geen rapporten gevonden',
    gridView: 'Rasterweergave',
    tableView: 'Tabelweergave',
    columns: 'Kolommen'
  },
  report: {
    accessibilityConformanceReportFor: 'Toegankelijkheidsrapport voor {title}',
    title: 'Titel',
    evaluatedBy: 'Beoordeeld door',
    commissionedBy: 'In opdracht van',
    target: 'Doelstelling',
    date: 'Datum',
    wcagVersion: 'WCAG-versie',
    conformanceTarget: 'Conformiteitsdoel',
    conformanceResult: 'Conformiteitsresultaat',
    specialRequirements: 'Speciale vereisten',
    navigationTitle: 'Navigatie',
    executiveSummary: 'Samenvatting',
    resultsPerPrinciple: 'Resultaten per principe',
    aboutThisReport: 'Over dit rapport',
    aboutThisReportText:
      'Dit rapport beschrijft de resultaten van een toegankelijkheidsonderzoek uitgevoerd volgens de Web Content Accessibility Guidelines (WCAG). Het onderzoek is uitgevoerd volgens de WCAG Evaluation Methodology (WCAG-EM), waarin de reikwijdte wordt bepaald, het product wordt verkend, een representatieve steekproef wordt geselecteerd, die steekproef wordt beoordeeld en de bevindingen worden gerapporteerd.\n\nIn de scores in dit rapport telt een succescriterium als voldaan wanneer het is vastgelegd als goedgekeurd of als niet aanwezig in de onderzochte content. Een criterium met een of meer bevindingen telt als afgekeurd. Een criterium zonder vastgelegde uitkomst telt als niet getoetst en telt niet mee als voldaan. Een score op basis van een steekproef is geen WCAG-conformiteitsclaim voor het hele product.\n\nDe gevonden problemen zijn beoordeeld op ernst en moeilijkheidsgraad. Bij elk probleem is een aanbeveling opgenomen om het probleem op te lossen.',
    scope: 'Reikwijdte',
    scopeItems: 'Onderdelen in reikwijdte',
    notInScope: 'Buiten reikwijdte',
    accessibilitySupport: 'Toegankelijkheidsondersteuning',
    accessibilitySupportExplanation:
      'De volgende combinaties van besturingssystemen, browsers en hulptechnologieën zijn gebruikt om de toegankelijkheid te beoordelen.',
    technologiesUsed: 'Gebruikte technologieën',
    technologiesExplanation:
      'Het onderzochte product is afhankelijk van de volgende technologieën.',
    evaluatedProduct: 'Onderzocht product',
    additionalRequirements: 'Aanvullende onderzoekseisen',
    additionalRequirementsExplanation:
      'Eisen die de onderzoeker en de opdrachtgever hebben afgesproken naast wat nodig is om conformiteit met WCAG te beoordelen.',
    sample: 'Steekproef',
    representativeSample: 'Representatieve steekproef',
    issues: 'Problemen',
    results: 'Resultaten',
    tips: 'Tips',
    successCriteria: 'Succescriteria',
    type: 'Type',
    typesort: {
      content: 'Content',
      design: 'Ontwerp',
      technical: 'Technisch',
      unknown: 'Onbekend'
    },
    severity: 'Ernst',
    severityLevel: {
      none: 'Geen',
      low: 'Laag',
      medium: 'Gemiddeld',
      high: 'Hoog'
    },
    difficulty: 'Moeilijkheid',
    difficultyLevel: {
      low: 'Laag',
      medium: 'Gemiddeld',
      high: 'Hoog'
    },
    url: 'URL',
    description: 'Beschrijving',
    externalLink: 'Externe link',
    principles: {
      perceivable: 'Waarneembaar',
      operable: 'Bedienbaar',
      understandable: 'Begrijpelijk',
      robust: 'Robuust'
    },
    principleDescriptions: {
      perceivable:
        'Informatie en gebruikersinterfacecomponenten moeten op een voor gebruikers begrijpelijke manier worden gepresenteerd.',
      operable: 'Gebruikersinterfacecomponenten en navigatie moeten bedienbaar zijn.',
      understandable:
        'Informatie en de bediening van de gebruikersinterface moeten begrijpelijk zijn.',
      robust:
        'Content moet robuust genoeg zijn om betrouwbaar geïnterpreteerd te worden door een breed scala aan user agents, inclusief hulptechnologieën.'
    },
    scStatus: {
      passed: 'Goedgekeurd',
      failed: 'Afgekeurd',
      'not-present': 'Niet aanwezig',
      'not-tested': 'Niet getoetst'
    },
    wcagPrinciple: 'WCAG Principe',
    principle: 'Principe',
    result: 'Resultaat',
    total: 'Totaal',
    conformanceLevel: 'Conformiteitsniveau: {level} — {conforming} van {total} criteria voldaan',
    criteriaMet: '{conforming} van {total} criteria voldaan',
    criteriaNotTested: '{count} niet getoetst',
    scorecardNotTestedNote:
      '{count} criteria hebben geen vastgelegde uitkomst. Ze tellen als niet getoetst en tellen niet mee als voldaan.',
    scoreFormat: '{conforming} / {total}',
    emptyFilter: {
      passed: {
        title: 'Geen goedgekeurde criteria gevonden',
        description:
          'Geen van de beoordeelde criteria is als goedgekeurd aangemerkt in dit rapport.'
      },
      failed: {
        title: 'Geen afgekeurde criteria gevonden',
        description: 'Geen van de beoordeelde criteria is als afgekeurd aangemerkt. Goed werk!'
      },
      'not-present': {
        title: 'Geen niet-aanwezige criteria gevonden',
        description: 'Alle criteria zijn aanwezig in de beoordeelde content.'
      },
      'not-tested': {
        title: 'Geen ongeteste criteria gevonden',
        description: 'Alle criteria zijn getest en hebben een resultaat gekregen.'
      }
    },
    downloadPdf: 'Download PDF',
    searchReports: 'Zoek rapporten...'
  },
  share: {
    share: 'Delen',
    shareReport: 'Rapport delen',
    createLink: 'Deellink aanmaken',
    copyLink: 'Link kopiëren',
    copied: 'Gekopieerd!',
    deleteLink: 'Link verwijderen',
    expiresAt: 'Verloopt op',
    noExpiry: 'Geen verloopdatum',
    activeLinks: 'Actieve deellinks',
    noLinks: 'Nog geen deellinks',
    notFound: 'Deze deellink is niet gevonden of verlopen',
    createdAt: 'Aangemaakt',
    password: 'Wachtwoord',
    passwordOptional: 'Optioneel',
    passwordRequired: 'Wachtwoord vereist',
    passwordDescription: 'Dit rapport is beveiligd. Voer het wachtwoord in om het te bekijken.',
    passwordIncorrect: 'Onjuist wachtwoord. Probeer het opnieuw.',
    passwordProtected: 'Beveiligd met wachtwoord',
    unlock: 'Rapport bekijken',
    adminRequired: 'Beheerdersauthenticatie vereist',
    adminDescription: 'Voer je beheerdersgeheim in om deellinks te beheren.',
    adminSecret: 'Beheerdersgeheim',
    adminLogin: 'Authenticeren',
    adminError: 'Ongeldig beheerdersgeheim. Probeer het opnieuw.',
    error: 'Er is iets misgegaan. Probeer het opnieuw.',
    required: 'verplicht'
  },
  admin: {
    loginTitle: 'Inloggen',
    loginDescription: 'Voer het beheerdersgeheim in om WCAGify te openen.',
    setupRequired: 'Configuratie vereist',
    setupDescription:
      'WCAGify vereist dat de omgevingsvariabele WCAGIFY_ADMIN_SECRET is ingesteld voordat het gebruikt kan worden.',
    secret: 'Beheerdersgeheim',
    signIn: 'Inloggen',
    invalidSecret: 'Ongeldig beheerdersgeheim. Probeer het opnieuw.'
  },
  settings: {
    title: 'Instellingen',
    tagline: 'Pas je WCAGify-ervaring aan',
    appearance: 'Weergave',
    theme: 'Thema',
    accentColor: 'Accentkleur',
    backgroundShade: 'Achtergrondtint',
    generalSection: 'Algemeen',
    language: 'Taal',
    back: 'terug'
  }
}
