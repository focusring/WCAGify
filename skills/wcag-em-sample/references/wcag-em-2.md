# WCAG-EM 2.0: the requirements this skill applies

Excerpts from the [WCAG Evaluation Methodology (WCAG-EM) 2.0](https://www.w3.org/TR/wcag-em-2/),
W3C Group Note 23 July 2026, this version
<https://www.w3.org/TR/2026/NOTE-wcag-em-2-20260723/>. Copyright © 2022-2026 World Wide Web
Consortium; reproduced under the [W3C Document License](https://www.w3.org/copyright/document-license/).
Wording is quoted as published; each heading links to the section it comes from. Only the
parts that govern scope definition, exploration and sample selection are excerpted.

The evaluation procedure "has five steps. Sometimes the order can vary, depending on the type of
digital product and the purpose of the evaluation. [...] Evaluators can proceed from one step to
the next, and may return to any preceding step as new information is revealed to them during the
process."

## [Glossary](https://www.w3.org/TR/wcag-em-2/#glossary)

- **common views**: "views that are relevant to the entire digital product". Note: "This
  includes the home, login, and other entry points, and, where applicable, contacts, help, legal
  information, and similar views that are typically linked from all other views (usually from
  the header, footer, or navigation menu)."
- **digital product**: "coherent collection of one or more related views that together provide
  common use or functionality". Examples: "Websites, web apps, e-books, kiosk apps, mobile apps
  and documents (PDF, Word, EPUB)". Note: "The focus of this methodology is on full,
  self-enclosed digital products. Digital products may be composed of smaller subsets of views,
  each of which can be considered to be an individual product. For example, a digital product
  may include an online shop, an area for each department within the organization, a blog area,
  and other areas that may each be considered to be a digital product."
- **essential functionality**: "functionality that, if removed, fundamentally changes the use or
  purpose of the product for users". Note: "This includes information that users of a product
  refer to and tasks that they carry out to perform this functionality." Examples: "selecting
  and purchasing an item from an online shop", "completing and submitting a form provided in an
  application", and "registering for an account on the kiosk". Note: "Other functionality is not
  excluded from the scope of evaluation. The term "essential functionality" is intended to help
  identify critical samples and include them among others in an evaluation."
- **evaluator**: "person, team of people, organization, in-house department, or other entity
  responsible for carrying out the evaluation"
- **evaluation commissioner**: "person, team of people, organization, in-house department, or
  other entity that commissioned the evaluation". Note: "In many cases the evaluation
  commissioner may be the product owner or product developer".
- **sample**: "view that is included in the sample set"
- **sample set**: "list of samples selected for evaluations"
- **view**: "A web page, document, software or view, or an equivalent unit of conformance
  defined in the accessibility standard being evaluated."

## [Scope of applicability](https://www.w3.org/TR/wcag-em-2/#scope)

"This methodology is designed to evaluate full, self-enclosed digital products, such as
websites. In Step 1.1, evaluators define what is in scope exactly."

### [Principle of product enclosure](https://www.w3.org/TR/wcag-em-2/#principle-of-product-enclosure)

"Full product enclosure is essential, meaning that we define the scope to include all views,
states and functionality of a digital product, without excluding specific parts. Excluding
specific parts of a digital product from the scope would likely conflict with the WCAG 2.2
conformance requirements for full pages and complete processes, or otherwise distort the
evaluation results."

Example (a banking website with areas for personal banking, commercial banking, internet
banking, service and contact, plus common views linked from all pages such as legal notice and
sitemap): "When the target for evaluation is the whole banking website, then all of the depicted
areas are within evaluation scope. This includes content such as application forms,
authentication and internet banking. This includes 3rd party content used within the site. When
the evaluation target is only a specific website area, like "Commercial banking", then all the
parts of this area are within the evaluation scope. In this example, that means the evaluation
scope would include Payments, Mortgage, Loans, and Savings, as well as the common views, the
Legal notice, and Sitemap."

### [Considerations for particular types of digital products](https://www.w3.org/TR/wcag-em-2/#considerations-for-particular-types-of-digital-products)

- Websites: "Websites with many pages can use the sampling procedure to select a representative
  sample set. On websites with a few pages, all pages can be evaluated and the sampling procedure
  can be skipped."
- Web applications: "generally contain a lot of dynamically generated content and functionality.
  They tend to be more complex and interactive. Therefore, they typically require more time and
  effort to evaluate, and will typically need a larger sample set."
- Native, hybrid and cross-platform applications: "a list of URLs cannot be generated to base a
  representative sample set on. Instead, samples can be identified with unique screenshots and/or
  descriptions of the path that lead to the specific sample."
- Kiosks, self-service terminals, set-top boxes: "When the interface can be tested in a browser,
  see the considerations for web applications." Otherwise "Samples can be identified with unique
  screenshots, photos and/or descriptions of the path that lead to the specific sample."
- Documents: "the evaluation is usually scoped to the whole document or specific parts of it,
  depending on document complexity. [...] the document title and, possibly, filename can be used
  to specify samples."

### [Particular evaluation contexts](https://www.w3.org/TR/wcag-em-2/#particular-evaluation-contexts)

- Third-party assessment: "Independent external evaluators typically have less information about
  internal software, areas, and functionality of a digital product [...] Often evaluators in
  these situations need to contact the product's owner or developer to get necessary information
  that make the evaluation more effective."
- Evaluating third-party content: "Digital products do not control third-party content, like
  comments on a social media website or review aggregator. WCAG 2 provides specific
  considerations for the conformance of such type of content in the section Statement of Partial
  Conformance."
- Re-running product evaluation: "the evaluation can be carried out using a sample that includes
  a: sub-set of the samples that were used in the preceding evaluation to facilitate
  comparability between the results, and replaced sub-set of samples from those that were used
  in the preceding evaluation to improve view coverage. Unless significant changes were made to
  the digital product, there is usually no need to change the size of the selected sample nor
  the approach used for sampling. The amount of replaced samples in a fresh sample set is
  typically about half of the initial sample set, though this could be increased when samples
  mostly conform to WCAG 2."

## [Step 1: Define the evaluation scope](https://www.w3.org/TR/wcag-em-2/#step-1-define-the-evaluation-scope)

"Methodology Requirement 1: Define the evaluation scope according to Methodology Requirement 1.1,
Methodology Requirement 1.2, and Methodology Requirement 1.3, and optionally Methodology
Requirement 1.4. Usually, this step involves the evaluation commissioner (who may or may not be
the product's owner), to align expectations, and an initial exploration of the product."

Steps 1.2 (conformance target), 1.3 (accessibility support baseline) and 1.4 (additional
evaluation requirements) are commissioner decisions recorded in the report's `evaluation` and
`baseline` fields; this skill reads them and leaves them unchanged. Step 1.4 matters for sampling:
a commissioner may ask for "evaluation of additional views beyond what is needed to form a
representative sample set from the target digital product".

### [Step 1.1: Define the scope of the digital product](https://www.w3.org/TR/wcag-em-2/#step-1-1-define-the-scope-of-the-digital-product)

"Methodology Requirement 1.1: Define the target digital product according to Scope of
applicability, so that for each view it is unambiguous whether it is within the scope of
evaluation or not."

"Define the target product, taking into account the considerations in Scope of applicability,
for example:

- All content on https://example-museum.org.
- All content on Example's Museum Shop, located on https://shop.example-museum.org, except for
  the Temporary Art Collection

It is important to be clear and unambiguous in this step, and avoid any doubt regarding which
views are in scope. Using formalizations including regular expressions and listings of web
addresses (URIs) is recommended where possible.

It is also important to document any particular aspects of the target product to support its
identification. This includes:

- use of third-party content and services,
- mobile and language versions of the product, and
- parts of the product, especially those that may not be easily identifiable as such — for
  example, an online shop that has a different web address but is still considered to be part
  of the target product,
- content or functionality related to specific WCAG success criteria,
- content or functionality that may be subject to additional guidelines."

## [Step 2: Explore the target digital product](https://www.w3.org/TR/wcag-em-2/#step-2-explore-the-target-digital-product)

"Methodology Requirement 2: Explore the digital product to be evaluated according to Methodology
Requirement 2.1, Methodology Requirement 2.2, Methodology Requirement 2.3, Methodology Requirement
2.4, and Methodology Requirement 2.5."

"During this step the evaluator explores the target product to be evaluated, to develop an
initial understanding of the product and its use, purpose, and functionality. Much of this will
not be immediately apparent to evaluators, in particular to those from outside the development
team. In some cases it is also not possible to exhaustively identify and list all functionality,
types of views, and technologies used to realize the product. Involvement of product owners and
product developers can help evaluators make their explorations more effective."

Note: "Carrying out initial cursory checks during this step helps identify views that are
relevant for more detailed evaluation later on. For example, an evaluator may identify views
that seem to be lacking color contrast, document structure, or consistent navigation, and note
them down for more detailed evaluation later on."

Note: "To carry out this step it is critical that the evaluator has access to all the relevant
parts of the product. For example, it may be necessary to create an account and ensure that the
product's configuration is representative. When products display data, it may be necessary to
pre-fill realistic data before starting the evaluation."

### [Step 2.1: Identify common views of the digital product](https://www.w3.org/TR/wcag-em-2/#step-2-1-identify-common-views-of-the-digital-product)

"Methodology Requirement 2.1: Identify the common views of the target product."

"Explore the target product to identify its common views, which may also be specific states of
views. Typically these are linked directly from the main entry point of the target product (like
the home page on a website, or the start screen of an app), and often linked from the header,
navigation, and footer sections of other views. The outcome of this step is a list of all common
pages or views of the target product."

### [Step 2.2: Identify essential functionality of the digital product](https://www.w3.org/TR/wcag-em-2/#step-2-2-identify-essential-functionality-of-the-digital-product)

"Methodology Requirement 2.2: Identify an initial list of essential functionality of the target
product."

"Explore the target product to identify its essential functionality. While some functionality
will be easy to identify, others will need more deliberate discovery. For example, it may be
easier to identify the functionality for purchasing products in an online shop than the
functionality provided for vendors to sell products through the shop. The outcome of this step
is a list of functionality that users can perform on the product."

Note: "The purpose of this step is not to exhaustively identify all functionality of a product
but to determine those that are essential to the purpose and goal of the target product. [...]
Other functionality will also be included in the evaluation but through other selection
mechanisms."

Example 1: "Selecting and purchasing products from the web shop; Completing and submitting the
survey forms; Registering for an account on the product".

### [Step 2.3: Identify the variety of sample types](https://www.w3.org/TR/wcag-em-2/#step-2-3-identify-the-variety-of-sample-types)

"Methodology Requirement 2.3: Identify the types of samples."

"Samples with varying styles, layouts, structures, and functionality often have varying support
for accessibility. They are often generated by different templates and scripts, or authored by
different people. They may appear differently, behave differently, and contain different content
depending on the particular product user and context. [...] The outcome of this step is a list
of descriptions of the types of content identified, rather than specific instances of samples."

Note: "Evaluators are encouraged to ask the evaluation commissioner about different types of
samples as well as previous assessments, to ensure different types of content are well
represented in their evaluation."

Example 2, sample types to look for, ones that:

- "vary in style, layout, structure, navigation, interaction, and visual design,
- include different types of content, such as forms, tables, lists, headings, multimedia, and
  scripting,
- include different functional components, such as date pickers, modal overlays, and carousels,
- use different technologies, such as HTML, CSS, JavaScript, WAI-ARIA, PDF, and EPUB
- are drawn from different areas of the product (such as home page, web shop, and other
  departments), including any applications,
- reflect different coding styles and templates (if this is known to the evaluator),
- are authored by different people, departments, or other entities (if this is known to the
  evaluator),
- change in appearance and behavior depending on the user, device, browser, context, and
  settings,
- include dynamic content, error messages, dialog boxes, pop-up windows, and other interactions."

### [Step 2.4: Identify technologies relied upon](https://www.w3.org/TR/wcag-em-2/#step-2-4-identify-technologies-relied-upon)

"Methodology Requirement 2.4: Identify the technologies relied upon to provide the product."

"During this step, the technologies relied upon for conformance are identified. This can include
technologies such as HTML, CSS, JavaScript, SVG, WAI-ARIA, PDF, and EPUB. The outcome of this
step is a list of technologies that are relied upon according to WCAG 2."

Note: "It is also encouraged to identify other systems relied on for conformance. For example:
authoring tool(s), like content management system(s); design system(s); front-end frameworks and
libraries; native platforms and/or native programming languages. It is encouraged to be as
detailed as possible, for instance, by including version numbers and configuration information."

### [Step 2.5: Identify other relevant samples](https://www.w3.org/TR/wcag-em-2/#step-2-5-identify-other-relevant-samples)

"Methodology Requirement 2.5: Identify other samples that are relevant to people with
disabilities and to accessibility of the digital product."

"The outcome of this step is a list of such samples, if they have not already been identified
as part of Step 2.1".

Example 3, other samples include those that:

- "explain the accessibility features of the digital product
- provide information and help on using the digital product
- explain settings, preferences, options, shortcuts, and similar features
- provide contact information, directions, and support instructions
- support sensitive or high-risk functionality such as authentication, managing personal
  information, or financial transactions."

## [Step 3: Select a representative sample set](https://www.w3.org/TR/wcag-em-2/#step-3-select-a-representative-sample-set)

"Methodology Requirement 3: Select a representative sample set from the digital product according
to Methodology Requirement 3.1, Methodology Requirement 3.2, and Methodology Requirement 3.3."

"Select a sample set that is representative of the target product to be evaluated. This helps
ensure that the evaluation results reflect the accessibility performance of the digital product
with reasonable confidence."

Note: "If feasible, it is recommended to evaluate the entire digital product. The sampling
procedure may then be skipped. There are also other specific cases where it makes sense to skip
the sampling procedure, and evaluate the entire digital product instead. Such cases include when
the digital product: has a small number of views — for example in some native apps or kiosks,
and cannot meaningfully be split into views — for example in certain kinds of documents. When
the sampling procedure is skipped, use the entire product as "selected sample set" in the
remaining steps of this evaluation process."

Factors that decide the size of the sample set ("The actual size of the sample set needed to
evaluate a digital product depends on many factors, including the following"):

- "Size of the digital product — products with more pages or views typically require a larger
  sample set to evaluate.
- Age of the digital product — older digital products tend to have more (often not easy to find)
  content with different levels of complexity, consistency, and design and development
  processes, so a larger sample set is typically required to evaluate.
- Complexity of the digital product — higher complexity requires a larger sample set to
  evaluate": how interactive the content is, how the content is generated (aggregated from
  different sources, processed at runtime), how the content is implemented (different versions,
  served according to users and preferences, adapting to access devices).
- "Consistency of the product — lower consistency requires a larger sample set to evaluate":
  variety of sample types, variety of functionality, variety of technologies, variety of coding
  styles.
- "Adherence to development processes — lower adherence requires a larger sample set to
  evaluate": formalization of the process, training for the developers, development tools being
  used (a consistent CMS), number of authors.
- "Required level of confidence — higher confidence in the evaluation results often requires
  evaluation of a larger sample set.
- Availability of prior evaluation findings — smaller sample sets may be required when
  evaluators have access to prior evaluation findings, including test results from manual and
  automated accessibility testing."

"The selection carried out during this step relies initially on the exploration carried out in
Step 2 [...]. The selection is also continually refined during the following Step 4 [...], as
the evaluator learns more about the particular implementation aspects of the target product."

### [Step 3.1: Include a structured sample set](https://www.w3.org/TR/wcag-em-2/#step-3-1-include-a-structured-sample-set)

"Methodology Requirement 3.1: Select samples that reflect all identified (1) common views, (2)
essential functionality, (3) types of samples, (4) technologies relied upon, and (5) other
relevant samples."

"Select a sample set that includes:

- common views identified in Step 2.1,
- relevant samples identified in Step 2.5, and
- if not reflected in the previous steps, additional samples with: essential functionality
  identified in Step 2.2, different types of samples identified in Step 2.3, and content using
  the technologies identified in Step 2.4."

Note: "An individual sample may reflect more than one of each of the criteria listed above. For
example, a single sample may be representative of a particular design layout, functionality, and
technologies used. The purpose of this step is to have representation of the different types of
samples, functionality, and technologies that occur on the digital product. Careful selection of
these representative instances can significantly reduce the required sample set size while
maintaining appropriate representation of the entire digital product."

### [Step 3.2: Include a randomly selected sample set](https://www.w3.org/TR/wcag-em-2/#step-3-2-include-a-randomly-selected-sample-set)

"Methodology Requirement 3.2: Select a random sample set, and include them for evaluation."

"A randomly selected sample set acts as an indicator to verify that the structured sample set
selected through the previous steps is sufficiently representative of the content provided on
the website. [...] The number of samples to randomly select is 10% of the structured sample set
selected through the previous steps. For example, if the structured sample set selected for a
digital product resulted in 80 samples, then the random sample set size is 8 samples (which are
added on top, so in that case, it would leave you with 88 samples in total).

To perform this selection, randomly select unique samples from the target digital product that
are not already part of the structured sample set that was selected through the previous steps.
[...] The evaluator may:

- use a tool that will traverse the digital product and propose a list of randomly selected
  samples,
- use a script that will generate a list of all samples available on a digital product to
  select from,
- manually list all pages, views, or screens in the digital product and pick items from that
  list randomly, and
- use server logs, crawlers, search engines and other creative methods to get to a random
  sample set.

Document the samples that were randomly selected as these will need to be compared to the
remaining structured sample set in Step 4.3".

Note: "While the random sample set need not be selected according to strictly scientific
criteria, the scope of the selection needs to span the entire scope of the digital product (any
samples on the digital product may be selected), and the selection of individual samples does
not follow a predictable pattern. Recording the method used to generate the random sample set is
useful for ensuring the reliability and replicability of the findings."

Note: "If the random sample set methodology picks a view that is identical to a view that is
already part of the sample set, another view should be selected. If there are no new views to be
found, this step should be considered completed."

Why it matters, from [Step 4.3](https://www.w3.org/TR/wcag-em-2/#step-4-3-compare-structured-and-random-sample-sets):
"the randomly selected sample set should not show new types of content not present in the
structured sample set. [...] If the randomly selected sample set shows new types of content or
new evaluation findings then it is an indication that the structured sample set was not
sufficiently representative of the content provided on the website. In this case evaluators need
to go back to Step 3 [...] to select additional samples that reflect the newly identified types
of content and findings."

### [Step 3.3: Include complete processes](https://www.w3.org/TR/wcag-em-2/#step-3-3-include-complete-processes)

"Methodology Requirement 3.3 Include all samples that are part of a complete process in the
selected sample set."

"The selected sample set has to include all pages or views that belong to a series presenting a
complete process. When samples belong to a process, all pages or views that belong to that same
process have to be included. Use the following steps to include the necessary samples:

- For each sample set selected through Step 3.1 and Step 3.2 that is part of a process, locate
  the starting point (sample) for the process and include it in the selected sample.
- For each starting point for a process, identify and record at least the default sequence of
  samples to complete the process. Include these samples.
- For each process, identify and record the branch sequences of samples that are commonly
  accessed and critical for the successful completion of the process. Include these samples."

Note: "The default sequence follows the standard use case, describing the default path through
the complete process. It assumes that there are no user input errors and no selection of
additional options. For example, for a web shop application, the user would proceed to checkout,
confirm the default payment option, provide all required payment details correctly, and complete
the purchase, without changing the contents of the shopping cart, using a stored user profile,
selecting alternative options for payment or shipping address, providing erroneous input, and so
forth."

Note: "Branch sequences may terminate where they re-enter the default branch of the process. For
example, adding a new shipping address will be registered as a critical alternative branch that
leads back to the default branch of the process."

Note: "In most cases, it is necessary to record and specify the actions needed to proceed from
one sample to the next in a sequence to complete a process so that they can be replicated later.
An example of such action could be "fill out name and address, and select the 'Submit' button".
In most cases the web address (URL) will not be sufficient to identify the sample in a complete
process. It is also useful to clearly record when samples are part of a process so that
evaluators can focus their effort on the relevant changes, such as elements that were added,
modified, or made visible."

## [Step 5.1: Document the outcomes of each step](https://www.w3.org/TR/wcag-em-2/#step-5-1-document-the-outcomes-of-each-step)

What the report has to record about scope, exploration and sample ("Include at least the
following"):

- Evaluation scope: "Scope of the digital product defined in Step 1.1", conformance target,
  accessibility support baseline, additional requirements if any.
- Digital product exploration: "Technologies relied upon identified in Step 2.4"; optional:
  common views (2.1), essential functionality (2.2), variety of sample types (2.3), other
  relevant samples (2.5).
- Representative sample set: "Pages or views selected through structured sampling in Step 3.1";
  "Randomly selected samples and selection method used in Step 3.2"; "Complete processes selected
  in Step 3.3".

[Step 5.2](https://www.w3.org/TR/wcag-em-2/#step-5-2-record-the-evaluation-specifics-optional)
(optional) adds: "Description of the path to locate the samples, especially when they are part of
a process; Description of the settings, input, and actions used to generate or navigate to the
samples."
