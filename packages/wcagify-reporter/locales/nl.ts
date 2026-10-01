export default {
  report: {
    notFound: 'Rapport niet gevonden',
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
    opensInNewTab: 'opent in een nieuw tabblad',
    showResults: 'Toon resultaten',
    enlargeImage: 'Afbeelding vergroten',
    enlargeImageNamed: 'Afbeelding vergroten: {alt}',
    enlargedImage: 'Vergrote afbeelding',
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
      'not-present': 'Niet aanwezig'
    },
    wcagPrinciple: 'WCAG Principe',
    principle: 'Principe',
    result: 'Resultaat',
    total: 'Totaal',
    conformanceLevel: 'Conformiteitsniveau: {level} — {conforming} van {total} criteria voldaan',
    criteriaMet: '{conforming} van {total} criteria voldaan',
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
      }
    },
    downloadPdf: 'Download PDF',
    downloadEarl: 'Download EARL',
    downloadStatus: {
      pdf: {
        generating: 'PDF wordt gegenereerd…',
        done: 'PDF gedownload',
        error: 'De PDF kon niet worden gegenereerd. Probeer het opnieuw.'
      },
      earl: {
        generating: 'EARL-bestand wordt gegenereerd…',
        done: 'EARL-bestand gedownload',
        error: 'Het EARL-bestand kon niet worden gegenereerd. Probeer het opnieuw.'
      }
    },
    searchReports: 'Zoek rapporten...'
  },
  codeBlock: {
    copied: 'Code gekopieerd',
    copiedLabel: 'Gekopieerd'
  }
}
