interface WcagCriterion {
  sc: string
  name: { en: string; nl: string }
  level: 'A' | 'AA' | 'AAA'
  versions: ('2.0' | '2.1' | '2.2')[]
}

type WcagVersion = '2.0' | '2.1' | '2.2'
type WcagLevel = 'A' | 'AA' | 'AAA'

const WCAG_CRITERIA: WcagCriterion[] = [
  {
    sc: '1.1.1',
    name: { en: 'Non-text Content', nl: 'Niet-tekstuele content' },
    level: 'A',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '1.2.1',
    name: {
      en: 'Audio-only and Video-only (Prerecorded)',
      nl: 'Louter-geluid en louter-videobeeld (vooraf opgenomen)'
    },
    level: 'A',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '1.2.2',
    name: {
      en: 'Captions (Prerecorded)',
      nl: 'Ondertitels voor doven en slechthorenden (vooraf opgenomen)'
    },
    level: 'A',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '1.2.3',
    name: {
      en: 'Audio Description or Media Alternative (Prerecorded)',
      nl: 'Audiodescriptie of media-alternatief (vooraf opgenomen)'
    },
    level: 'A',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '1.2.4',
    name: { en: 'Captions (Live)', nl: 'Ondertitels voor doven en slechthorenden (live)' },
    level: 'AA',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '1.2.5',
    name: { en: 'Audio Description (Prerecorded)', nl: 'Audiodescriptie (vooraf opgenomen)' },
    level: 'AA',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '1.2.6',
    name: { en: 'Sign Language (Prerecorded)', nl: 'Gebarentaal (vooraf opgenomen)' },
    level: 'AAA',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '1.2.7',
    name: {
      en: 'Extended Audio Description (Prerecorded)',
      nl: 'Verlengde audiodescriptie (vooraf opgenomen)'
    },
    level: 'AAA',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '1.2.8',
    name: { en: 'Media Alternative (Prerecorded)', nl: 'Media-alternatief (vooraf opgenomen)' },
    level: 'AAA',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '1.2.9',
    name: { en: 'Audio-only (Live)', nl: 'Louter-geluid (live)' },
    level: 'AAA',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '1.3.1',
    name: { en: 'Info and Relationships', nl: 'Info en relaties' },
    level: 'A',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '1.3.2',
    name: { en: 'Meaningful Sequence', nl: 'Betekenisvolle volgorde' },
    level: 'A',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '1.3.3',
    name: { en: 'Sensory Characteristics', nl: 'Zintuiglijke eigenschappen' },
    level: 'A',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '1.3.4',
    name: { en: 'Orientation', nl: 'Weergavestand' },
    level: 'AA',
    versions: ['2.1', '2.2']
  },
  {
    sc: '1.3.5',
    name: { en: 'Identify Input Purpose', nl: 'Identificeer het doel van de input' },
    level: 'AA',
    versions: ['2.1', '2.2']
  },
  {
    sc: '1.3.6',
    name: { en: 'Identify Purpose', nl: 'Identificeer het doel' },
    level: 'AAA',
    versions: ['2.1', '2.2']
  },
  {
    sc: '1.4.1',
    name: { en: 'Use of Color', nl: 'Gebruik van kleur' },
    level: 'A',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '1.4.2',
    name: { en: 'Audio Control', nl: 'Geluidsbediening' },
    level: 'A',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '1.4.3',
    name: { en: 'Contrast (Minimum)', nl: 'Contrast (minimum)' },
    level: 'AA',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '1.4.4',
    name: { en: 'Resize Text', nl: 'Herschalen van tekst' },
    level: 'AA',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '1.4.5',
    name: { en: 'Images of Text', nl: 'Afbeeldingen van tekst' },
    level: 'AA',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '1.4.6',
    name: { en: 'Contrast (Enhanced)', nl: 'Contrast (versterkt)' },
    level: 'AAA',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '1.4.7',
    name: { en: 'Low or No Background Audio', nl: 'Weinig of geen achtergrondgeluid' },
    level: 'AAA',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '1.4.8',
    name: { en: 'Visual Presentation', nl: 'Visuele weergave' },
    level: 'AAA',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '1.4.9',
    name: { en: 'Images of Text (No Exception)', nl: 'Afbeeldingen van tekst (geen uitzondering)' },
    level: 'AAA',
    versions: ['2.0', '2.1', '2.2']
  },
  { sc: '1.4.10', name: { en: 'Reflow', nl: 'Reflow' }, level: 'AA', versions: ['2.1', '2.2'] },
  {
    sc: '1.4.11',
    name: { en: 'Non-text Contrast', nl: 'Contrast van niet-tekstuele content' },
    level: 'AA',
    versions: ['2.1', '2.2']
  },
  {
    sc: '1.4.12',
    name: { en: 'Text Spacing', nl: 'Tekstafstand' },
    level: 'AA',
    versions: ['2.1', '2.2']
  },
  {
    sc: '1.4.13',
    name: { en: 'Content on Hover or Focus', nl: 'Content bij hover of focus' },
    level: 'AA',
    versions: ['2.1', '2.2']
  },
  {
    sc: '2.1.1',
    name: { en: 'Keyboard', nl: 'Toetsenbord' },
    level: 'A',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '2.1.2',
    name: { en: 'No Keyboard Trap', nl: 'Geen toetsenbordval' },
    level: 'A',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '2.1.3',
    name: { en: 'Keyboard (No Exception)', nl: 'Toetsenbord (geen uitzondering)' },
    level: 'AAA',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '2.1.4',
    name: { en: 'Character Key Shortcuts', nl: 'Enkel teken sneltoetsen' },
    level: 'A',
    versions: ['2.1', '2.2']
  },
  {
    sc: '2.2.1',
    name: { en: 'Timing Adjustable', nl: 'Timing aanpasbaar' },
    level: 'A',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '2.2.2',
    name: { en: 'Pause, Stop, Hide', nl: 'Pauzeren, stoppen, verbergen' },
    level: 'A',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '2.2.3',
    name: { en: 'No Timing', nl: 'Geen timing' },
    level: 'AAA',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '2.2.4',
    name: { en: 'Interruptions', nl: 'Onderbrekingen' },
    level: 'AAA',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '2.2.5',
    name: { en: 'Re-authenticating', nl: 'Herauthentisering' },
    level: 'AAA',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '2.2.6',
    name: { en: 'Timeouts', nl: 'Time-outs' },
    level: 'AAA',
    versions: ['2.1', '2.2']
  },
  {
    sc: '2.3.1',
    name: { en: 'Three Flashes or Below Threshold', nl: 'Drie flitsen of beneden drempelwaarde' },
    level: 'A',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '2.3.2',
    name: { en: 'Three Flashes', nl: 'Drie flitsen' },
    level: 'AAA',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '2.3.3',
    name: { en: 'Animation from Interactions', nl: 'Animatie uit interacties' },
    level: 'AAA',
    versions: ['2.1', '2.2']
  },
  {
    sc: '2.4.1',
    name: { en: 'Bypass Blocks', nl: 'Blokken omzeilen' },
    level: 'A',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '2.4.2',
    name: { en: 'Page Titled', nl: 'Paginatitel' },
    level: 'A',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '2.4.3',
    name: { en: 'Focus Order', nl: 'Focus volgorde' },
    level: 'A',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '2.4.4',
    name: { en: 'Link Purpose (In Context)', nl: 'Linkdoel (in context)' },
    level: 'A',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '2.4.5',
    name: { en: 'Multiple Ways', nl: 'Meerdere manieren' },
    level: 'AA',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '2.4.6',
    name: { en: 'Headings and Labels', nl: 'Koppen en labels' },
    level: 'AA',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '2.4.7',
    name: { en: 'Focus Visible', nl: 'Focus zichtbaar' },
    level: 'AA',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '2.4.8',
    name: { en: 'Location', nl: 'Locatie' },
    level: 'AAA',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '2.4.9',
    name: { en: 'Link Purpose (Link Only)', nl: 'Linkdoel (alleen link)' },
    level: 'AAA',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '2.4.10',
    name: { en: 'Section Headings', nl: 'Paragraafkoppen' },
    level: 'AAA',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '2.4.11',
    name: { en: 'Focus Not Obscured (Minimum)', nl: 'Focus niet bedekt (minimum)' },
    level: 'AA',
    versions: ['2.2']
  },
  {
    sc: '2.4.12',
    name: { en: 'Focus Not Obscured (Enhanced)', nl: 'Focus niet bedekt (uitgebreid)' },
    level: 'AAA',
    versions: ['2.2']
  },
  {
    sc: '2.4.13',
    name: { en: 'Focus Appearance', nl: 'Focusweergave' },
    level: 'AAA',
    versions: ['2.2']
  },
  {
    sc: '2.5.1',
    name: { en: 'Pointer Gestures', nl: 'Aanwijzergebaren' },
    level: 'A',
    versions: ['2.1', '2.2']
  },
  {
    sc: '2.5.2',
    name: { en: 'Pointer Cancellation', nl: 'Aanwijzerannulering' },
    level: 'A',
    versions: ['2.1', '2.2']
  },
  {
    sc: '2.5.3',
    name: { en: 'Label in Name', nl: 'Label in naam' },
    level: 'A',
    versions: ['2.1', '2.2']
  },
  {
    sc: '2.5.4',
    name: { en: 'Motion Actuation', nl: 'Bewegingsactivering' },
    level: 'A',
    versions: ['2.1', '2.2']
  },
  {
    sc: '2.5.5',
    name: { en: 'Target Size (Enhanced)', nl: 'Grootte van het aanwijsgebied (uitgebreid)' },
    level: 'AAA',
    versions: ['2.1', '2.2']
  },
  {
    sc: '2.5.6',
    name: { en: 'Concurrent Input Mechanisms', nl: 'Gelijktijdige invoermechanismen' },
    level: 'AAA',
    versions: ['2.1', '2.2']
  },
  {
    sc: '2.5.7',
    name: { en: 'Dragging Movements', nl: 'Sleepbewegingen' },
    level: 'AA',
    versions: ['2.2']
  },
  {
    sc: '2.5.8',
    name: { en: 'Target Size (Minimum)', nl: 'Grootte van het aanwijsgebied (minimum)' },
    level: 'AA',
    versions: ['2.2']
  },
  {
    sc: '3.1.1',
    name: { en: 'Language of Page', nl: 'Taal van de pagina' },
    level: 'A',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '3.1.2',
    name: { en: 'Language of Parts', nl: 'Taal van onderdelen' },
    level: 'AA',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '3.1.3',
    name: { en: 'Unusual Words', nl: 'Ongebruikelijke woorden' },
    level: 'AAA',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '3.1.4',
    name: { en: 'Abbreviations', nl: 'Afkortingen' },
    level: 'AAA',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '3.1.5',
    name: { en: 'Reading Level', nl: 'Leesniveau' },
    level: 'AAA',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '3.1.6',
    name: { en: 'Pronunciation', nl: 'Uitspraak' },
    level: 'AAA',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '3.2.1',
    name: { en: 'On Focus', nl: 'Bij focus' },
    level: 'A',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '3.2.2',
    name: { en: 'On Input', nl: 'Bij input' },
    level: 'A',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '3.2.3',
    name: { en: 'Consistent Navigation', nl: 'Consistente navigatie' },
    level: 'AA',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '3.2.4',
    name: { en: 'Consistent Identification', nl: 'Consistente identificatie' },
    level: 'AA',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '3.2.5',
    name: { en: 'Change on Request', nl: 'Verandering op verzoek' },
    level: 'AAA',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '3.2.6',
    name: { en: 'Consistent Help', nl: 'Consistente hulp' },
    level: 'A',
    versions: ['2.2']
  },
  {
    sc: '3.3.1',
    name: { en: 'Error Identification', nl: 'Foutidentificatie' },
    level: 'A',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '3.3.2',
    name: { en: 'Labels or Instructions', nl: 'Labels of instructies' },
    level: 'A',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '3.3.3',
    name: { en: 'Error Suggestion', nl: 'Foutsuggestie' },
    level: 'AA',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '3.3.4',
    name: {
      en: 'Error Prevention (Legal, Financial, Data)',
      nl: 'Foutpreventie (wettelijk, financieel, gegevens)'
    },
    level: 'AA',
    versions: ['2.0', '2.1', '2.2']
  },
  { sc: '3.3.5', name: { en: 'Help', nl: 'Hulp' }, level: 'AAA', versions: ['2.0', '2.1', '2.2'] },
  {
    sc: '3.3.6',
    name: { en: 'Error Prevention (All)', nl: 'Foutpreventie (alle)' },
    level: 'AAA',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '3.3.7',
    name: { en: 'Redundant Entry', nl: 'Overbodige invoer' },
    level: 'A',
    versions: ['2.2']
  },
  {
    sc: '3.3.8',
    name: {
      en: 'Accessible Authentication (Minimum)',
      nl: 'Toegankelijke authenticatie (minimum)'
    },
    level: 'AA',
    versions: ['2.2']
  },
  {
    sc: '3.3.9',
    name: {
      en: 'Accessible Authentication (Enhanced)',
      nl: 'Toegankelijke authenticatie (uitgebreid)'
    },
    level: 'AAA',
    versions: ['2.2']
  },
  {
    sc: '4.1.1',
    name: { en: 'Parsing', nl: 'Parsen' },
    level: 'A',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '4.1.2',
    name: { en: 'Name, Role, Value', nl: 'Naam, rol, waarde' },
    level: 'A',
    versions: ['2.0', '2.1', '2.2']
  },
  {
    sc: '4.1.3',
    name: { en: 'Status Messages', nl: 'Statusberichten' },
    level: 'AA',
    versions: ['2.1', '2.2']
  }
]

export { WCAG_CRITERIA }
export type { WcagVersion, WcagLevel }
