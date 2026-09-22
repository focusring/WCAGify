---
title: WCAG test audit abnamro.nl
baseline:
  - Windows 11 with Chrome and NVDA
  - macOS with Safari and VoiceOver
  - Android with Chrome and TalkBack
description: Accessibility audit for abnamro.nl according to WCAG 2.2 level AA.
evaluation:
  evaluator: WCAGify
  commissioner: Example Organisation
  target: ABN AMRO Personal banking on www.abnamro.nl, Dutch and English versions, including the common views and the sub-applications embedded in them
  targetLevel: AA
  targetWcagVersion: '2.2'
  date: 2026-08-15
  specialRequirements: None
language: en
scope:
  - https://www.abnamro.nl/nl/prive/
  - https://www.abnamro.nl/en/personal/
  - https://www.abnamro.nl/mijn-abnamro/authenticatie/
  - https://www.abnamro.nl/portal/mijn-abnamro/authenticatie/
  - https://www.abnamro.nl/mijn-abnamro/lenen/berekenen/ (loan calculator shown inside the pages above)
  - https://hypotheken.abnamro.nl/ (mortgage calculators and rate tables shown inside the pages above)
  - https://beursinfo.abnamro.nl/ (share prices and market news shown inside the pages above)
  - https://fondsen.abnamro.nl/ (fund screener shown inside the pages above)
  - https://rekentools.webbridge.nl/abnamro/ (pension tool by an outside supplier, shown inside the pages above)
outOfScope:
  - Everything behind a successful login to Internet Banking and Mijn ABN AMRO
  - https://www.abnamro.nl/nl/privatebanking/ and https://www.abnamro.nl/en/privatebanking/
  - https://www.abnamro.nl/nl/zakelijk/ and https://www.abnamro.nl/en/commercialbanking/
  - https://assets.abnamro.com/ (the PDF terms and policy documents linked from the pages in scope)
  - Other ABN AMRO sites and social media, including abnamro.com and werkenbijabnamro.nl
sample:
  # Structured sample (3.1)
  - title: Home (Dutch)
    id: page-1
    url: https://www.abnamro.nl/nl/prive/index.html
    description: The Dutch entry point of the site, with the header, main menu, search and footer that every other page repeats. It also carries the cookie banner that greets every visitor.
  - title: Home (English)
    id: page-2
    url: https://www.abnamro.nl/en/personal/index.html
    description: The English entry point, reached with the English switch in the header. It is a shorter page than the Dutch home page and the way into the English half of the site.
  - title: Internet Banking login
    id: page-3
    url: https://www.abnamro.nl/mijn-abnamro/authenticatie/inloggen/
    description: Where customers log in to Internet Banking, reached from the header of every page. It is built on a template of its own, used nowhere else in the audit.
  - title: Service and Contact
    id: page-4
    url: https://www.abnamro.nl/nl/prive/service-en-contact/index.html
    description: The service desk of the site, linked from the header and the footer of every page. It is the largest overview page in the audit and the route to almost every self-service task.
  - title: Search results
    id: page-5
    url: https://www.abnamro.nl/nl/prive/zoeken/?q=hypotheek
    description: The results people get after using the search box in the header. Results appear without the page reloading, so it is the clearest example of content that updates on the spot.
  - title: Accessibility statement
    id: page-6
    url: https://www.abnamro.nl/nl/prive/abnamro/toegankelijkheid/informatie-onze-toegankelijkheid.html
    description: ABN AMRO's own statement about the accessibility of its digital services, linked from the footer of every page. It offers the same statement as a document to download.
  - title: Accessible banking
    id: page-7
    url: https://www.abnamro.nl/nl/prive/abnamro/toegankelijkheid/index.html
    description: The overview of what the bank offers customers who need help banking, linked from the footer of every page. It is the page that explains the accessibility features themselves.
  - title: Submit a complaint
    id: page-8
    url: https://www.abnamro.nl/nl/prive/abnamro/klacht-indienen/index.html
    description: Where customers file a complaint, linked from the footer of every page. It is the formal route for people who cannot get something resolved.
  - title: Privacy
    id: page-9
    url: https://www.abnamro.nl/nl/prive/abnamro/privacy/index.html
    description: The privacy section linked from the footer of every page, explaining what the bank does with customer data.
  - title: Cookie statement
    id: page-10
    url: https://www.abnamro.nl/nl/prive/abnamro/privacy/cookie-statement.html
    description: The cookie statement linked from the cookie banner and from the footer. The cookie settings panel is opened from here, the one pop-up window every visitor meets.
  - title: Payments and credit cards
    id: page-11
    url: https://www.abnamro.nl/nl/prive/betalen/index.html
    description: The overview page for payment products, linked from the main menu and the footer. It is the template behind every product overview in the audit.
  - title: Open a bank account
    id: page-12
    url: https://www.abnamro.nl/nl/prive/betalen/bankrekening-openen/index.html
    description: Where opening a payment account starts, and one of the most used routes on the site. It is the first page of the account opening process.
  - title: Open an account for yourself
    id: page-13
    url: https://www.abnamro.nl/nl/prive/betalen/bankrekening-openen/voor-jezelf.html
    description: Explains step by step how to open a payment account for yourself, mainly through the mobile app. It is where people choose between the app route and the web form.
  - title: Calculate your mortgage
    id: page-14
    url: https://www.abnamro.nl/nl/prive/hypotheken/maximale-hypotheek-berekenen.html
    description: The mortgage calculator customers use to see how much they can borrow, linked from the main menu and the footer. The calculator itself is a separate application shown inside the page.
  - title: Current mortgage rates
    id: page-15
    url: https://www.abnamro.nl/nl/prive/hypotheken/actuele-hypotheekrente/index.html
    description: The current mortgage interest rates, shown by a rate application inside the page alongside rate tables. Customers check this page before making an appointment.
  - title: Current interest rates
    id: page-16
    url: https://www.abnamro.nl/nl/prive/rente/actuele-rente.html
    description: The current savings and credit interest rates. It holds more data tables than any other page in the audit.
  - title: Share prices
    id: page-17
    url: https://www.abnamro.nl/nl/prive/beleggen/koersinformatie/index.html
    description: Live prices for investment products, shown by a separate market data application inside the page. Investors use it to follow what they hold.
  - title: The ABN AMRO app
    id: page-18
    url: https://www.abnamro.nl/nl/prive/internet-en-mobiel/abn-amro-app/index.html
    description: Explains what the mobile banking app does and how to start using it. It is the one page found in the audit that carries a video.
  - title: Short-term travel insurance
    id: page-19
    url: https://www.abnamro.nl/nl/prive/verzekeren/reisverzekeringen/kortlopend.html
    description: Where customers take out short-term travel insurance. It links more policy documents to download than any other page in the audit.
  - title: Calculate a loan
    id: page-20
    url: https://www.abnamro.nl/nl/prive/lenen/lening-berekenen/index.html
    description: The loan calculator that shows what a personal loan costs per month, built as a separate application inside the page. It is where applying for a loan starts.
  - title: Pension check
    id: page-21
    url: https://www.abnamro.nl/nl/prive/pensioen/pensioen-opbouwen/pensioencheck.html
    description: A pension tool that shows customers what they can expect later. The tool is run by an outside supplier and shown inside the page.
  - title: Change your address
    id: page-22
    url: https://www.abnamro.nl/nl/prive/service-en-contact/adres-wijzigen.html
    description: Where customers change their address, phone number or email address, linked from the footer of every page. It is one of the most used self-service tasks.
  - title: Change your card limit
    id: page-23
    url: https://www.abnamro.nl/nl/prive/betalen/betaalpas/limiet-wijzigen.html
    description: Where customers change the daily limit of their debit card, linked from the footer of every page. It is an example of the settings customers change themselves.
  - title: Online banking manuals for seniors
    id: page-24
    url: https://www.abnamro.nl/nl/prive/speciaal-voor/senioren/online-bankieren/index.html
    description: Step-by-step manuals for customers who are less confident online, written for seniors. It is the main help material for the people who need the most support.
  - title: Chat and chatbot
    id: page-25
    url: https://www.abnamro.nl/nl/prive/service-en-contact/chat-chatbot/index.html
    description: Where customers reach the chatbot and a human adviser. The chat opens in a window over the page.
  # Random sample: 3 of 2780 candidate views (inventory of 2804 minus 25 structured samples), seeded shuffle (mulberry32, seed 1821534568) by wcag-em-sample/scripts/random-sample.mjs
  - title: Buitenwaard new-build project
    id: page-26
    url: https://www.abnamro.nl/en/personal/mortgages/buying-a-house/new-housing/noord-holland/buitenwaard.html
    description: 'Random sample: an English page about one new-build housing project, one of a large family of near-identical project pages.'
  - title: Tips for saving energy
    id: page-27
    url: https://www.abnamro.nl/nl/prive/hypotheken/wonen/energiebespaartips.html
    description: 'Random sample: an advice article about saving energy at home, one of the many articles the site publishes.'
  - title: What is personal data?
    id: page-28
    url: https://www.abnamro.nl/en/personal/overabnamro/privacy/personal-data.html
    description: 'Random sample: an English explanation of what counts as personal data, inside the privacy section.'
  # Complete processes (3.3)
  - title: Becoming a customer
    id: page-29
    url: https://www.abnamro.nl/nl/prive/betalen/bankrekening-openen/amp-klant-worden.html
    description: 'Open a payment account, step 3/4: on page-13 select "Kun je geen rekening openen via de app?". This is the route for customers who cannot or will not use the mobile app, and it leads to the web application form.'
  - title: Account application form
    id: page-30
    url: https://www.abnamro.nl/nl/prive/betalen/bankrekening-openen/open-voor-uzelf.html?CJ=Nee
    description: 'Open a payment account, step 4/4: on page-29 select "aanvraagformulier". The whole application runs on this one page over five steps, so walk all of them, stopping before the last step sends a real application.'
  - title: Extended mortgage calculation
    id: page-31
    url: https://www.abnamro.nl/nl/prive/hypotheken/maximale-hypotheek-berekenen-verder.html
    description: 'Calculate your maximum mortgage, step 2/2: on page-14 select "Reken verder", then "Verder zonder inloggen". The full calculation runs on this one page as a long series of questions, so walk the whole set.'
technologies:
  - HTML
  - CSS
  - JavaScript
  - WAI-ARIA
  - SVG
  - MP4 video
  - PDF
  - Vue 3.5.42
  - RWS Tridion Sites (content management)
  - ABN AMRO design system (aab-vendor 2.0.12)
  - OneTrust (cookie consent)
  - Optimizely (content experiments)
  - Tealium iQ (tag management)
  - Qualtrics (feedback widget)
  - Google Tag Manager
scStatuses:
  # Criteria with no matching content anywhere in the sample. WCAG-EM counts
  # these as satisfied. Every other criterion passes unless an issue records a
  # failure against it.
  not-present: []
---

This is an example report for a WCAG accessibility audit of Example Website.
