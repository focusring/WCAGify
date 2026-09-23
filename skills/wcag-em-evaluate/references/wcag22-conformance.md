# WCAG 2.2 conformance: the requirements Step 4 checks against

Excerpts from [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/),
W3C Recommendation, section [5. Conformance](https://www.w3.org/TR/WCAG22/#conformance) and the
[Glossary](https://www.w3.org/TR/WCAG22/#glossary). Copyright © W3C; reproduced under the
[W3C Document License](https://www.w3.org/copyright/document-license/). Wording is quoted as
published. WCAG-EM Step 4 evaluates every sample against these five requirements at the target
level; the success criteria themselves are in [`criteria/`](criteria/).

## [5.1 Interpreting Normative Requirements](https://www.w3.org/TR/WCAG22/#interpreting-normative-requirements)

"The main content of WCAG 2.2 is normative and defines requirements that impact conformance
claims. Introductory material, appendices, sections marked as "non-normative", diagrams, examples,
and notes are informative (non-normative). Non-normative material provides advisory information to
help interpret the guidelines but does not create requirements that impact a conformance claim."

So: the Understanding documents, the Techniques and the Failures decide nothing on their own. A
failure is a failure because the success criterion text evaluates to false.

## [5.2 Conformance Requirements](https://www.w3.org/TR/WCAG22/#conformance-reqs)

"In order for a web page to conform to WCAG 2.2, all of the following conformance requirements must
be satisfied:"

### [5.2.1 Conformance Level](https://www.w3.org/TR/WCAG22/#cc1)

"One of the following levels of conformance is met in full.

- For Level A conformance (the minimum level of conformance), the web page satisfies all the Level
  A success criteria, or a conforming alternate version is provided.
- For Level AA conformance, the web page satisfies all the Level A and Level AA success criteria,
  or a Level AA conforming alternate version is provided.
- For Level AAA conformance, the web page satisfies all the Level A, Level AA and Level AAA success
  criteria, or a Level AAA conforming alternate version is provided."

Note 2: "It is not recommended that Level AAA conformance be required as a general policy for
entire sites because it is not possible to satisfy all Level AAA success criteria for some content."

### [5.2.2 Full pages](https://www.w3.org/TR/WCAG22/#cc2)

"Conformance (and conformance level) is for full web page(s) only, and cannot be achieved if part
of a web page is excluded."

Note 1: "For the purpose of determining conformance, alternatives to part of a page's content are
considered part of the page when the alternatives can be obtained directly from the page, e.g., a
long description or an alternative presentation of a video."

Note 3: "A full page includes each variation of the page that is automatically presented by the
page for various screen sizes (e.g. variations in a responsive web page). Each of these variations
needs to conform (or needs to have a conforming alternate version) in order for the entire page to
conform."

Consequence for the evaluation: a sample is its whole page, every state reached without the address
changing, and every responsive variation. Embedded third-party content (an iframe, a widget) is
part of the page; failures in it are failures of the page, and the commissioner is told who can fix
them.

### [5.2.3 Complete processes](https://www.w3.org/TR/WCAG22/#cc3)

"When a web page is one of a series of web pages presenting a process (i.e., a sequence of steps
that need to be completed in order to accomplish an activity), all web pages in the process conform
at the specified level or better. (Conformance is not possible at a particular level if any page in
the process does not conform at that level or better.)"

Example: "An online store has a series of pages that are used to select and purchase products. All
pages in the series from start to finish (checkout) conform in order for any page that is part of
the process to conform."

### [5.2.4 Only Accessibility-Supported Ways of Using Technologies](https://www.w3.org/TR/WCAG22/#cc4)

"Only accessibility-supported ways of using technologies are relied upon to satisfy the success
criteria. Any information or functionality that is provided in a way that is not accessibility
supported is also available in a way that is accessibility supported."

### [5.2.5 Non-Interference](https://www.w3.org/TR/WCAG22/#cc5)

"If technologies are used in a way that is not accessibility supported, or if they are used in a
non-conforming way, then they do not block the ability of users to access the rest of the page. In
addition, the web page as a whole continues to meet the conformance requirements under each of the
following conditions:

- when any technology that is not relied upon is turned on in a user agent,
- when any technology that is not relied upon is turned off in a user agent, and
- when any technology that is not relied upon is not supported by a user agent

In addition, the following success criteria apply to all content on the page, including content
that is not otherwise relied upon to meet conformance, because failure to meet them could interfere
with any use of the page:

- 1.4.2 - Audio Control,
- 2.1.2 - No Keyboard Trap,
- 2.3.1 - Three Flashes or Below Threshold, and
- 2.2.2 - Pause, Stop, Hide."

These four are checked on every sample without exception, third-party and decorative content
included, and a failure of any of them is reported with severity High.

## Glossary terms that decide outcomes

- **[satisfies a success criterion](https://www.w3.org/TR/WCAG22/#dfn-satisfies)**: "the success
  criterion does not evaluate to 'false' when applied to the page".
- **[web page](https://www.w3.org/TR/WCAG22/#dfn-web-page-s)**: "a non-embedded resource obtained
  from a single URI using HTTP plus any other resources that are used in the rendering or intended
  to be rendered together with it by a user agent". Example 2: "A web mail program built using
  Asynchronous JavaScript and XML (AJAX). The program lives entirely at http://example.com/mail, but
  includes an inbox, a contacts area and a calendar. Links or buttons are provided that cause the
  inbox, contacts, or calendar to display, but do not change the URI of the page as a whole."
- **[process](https://www.w3.org/TR/WCAG22/#dfn-processes)**: "series of user actions where each
  action is required in order to complete an activity". Example 1: "Successful use of a series of
  web pages on a shopping site requires users to view alternative products, prices and offers,
  select products, submit an order, provide shipping information and provide payment information."
- **[relied upon](https://www.w3.org/TR/WCAG22/#dfn-relied-upon)** (technologies that are): "the
  content would not conform if that technology is turned off or is not supported".
- **[accessibility supported](https://www.w3.org/TR/WCAG22/#dfn-accessibility-supported)**:
  "supported by users' assistive technologies as well as the accessibility features in browsers and
  other user agents". "To qualify as an accessibility-supported use of a web content technology (or
  feature of a technology), both 1 and 2 must be satisfied [...]: 1. The way that the web content
  technology is used must be supported by users' assistive technology (AT). This means that the way
  that the technology is used has been tested for interoperability with users' assistive technology
  in the human language(s) of the content, AND 2. The web content technology must have
  accessibility-supported user agents that are available to users." Note 1: "The Accessibility
  Guidelines Working Group and the W3C do not specify which or how much support by assistive
  technologies there must be for a particular use of a web technology in order for it to be
  classified as accessibility supported." The report's `baseline` (Step 1.3) is the threshold this
  evaluation uses.
- **[set of web pages](https://www.w3.org/TR/WCAG22/#dfn-set-of-web-pages)**: "collection of web
  pages that share a common purpose and that are created by the same author, group or
  organization". Note: "Different language versions would be considered different sets of web
  pages." This bounds 2.4.5, 3.2.3, 3.2.4 and 3.2.6, which apply within a set of web pages.
- **[assistive technology](https://www.w3.org/TR/WCAG22/#dfn-assistive-technologies)**: "hardware
  and/or software that acts as a user agent, or along with a mainstream user agent, to provide
  functionality to meet the requirements of users with disabilities that go beyond those offered by
  mainstream user agents".

## Conforming alternate versions

WCAG 2.2 defines a [conforming alternate version](https://www.w3.org/TR/WCAG22/#dfn-conforming-alternate-version)
as a version that "1. conforms at the designated level, and 2. provides all of the same information
and functionality in the same human language, and 3. is as up to date as the non-conforming
content, and 4. for which at least one of the following is true: a. the conforming version can be
reached from the non-conforming page via an accessibility-supported mechanism, or b. the
non-conforming version can only be reached from the conforming version, or c. the non-conforming
version can only be reached from a conforming page that also provides a mechanism to reach the
conforming version". When a sample offers one, evaluate the alternate version as part of the same
sample (WCAG-EM Step 4.1) and record in the notes which content the claim rests on.
