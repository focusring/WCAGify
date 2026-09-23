# WCAG-EM 2.0: the requirements this skill applies

Excerpts from the [WCAG Evaluation Methodology (WCAG-EM) 2.0](https://www.w3.org/TR/wcag-em-2/),
W3C Group Note 23 July 2026, this version
<https://www.w3.org/TR/2026/NOTE-wcag-em-2-20260723/>. Copyright © 2022-2026 World Wide Web
Consortium; reproduced under the [W3C Document License](https://www.w3.org/copyright/document-license/).
Wording is quoted as published; each heading links to the section it comes from. Only the parts
that govern Step 4 (evaluating the sample set) and the parts of Step 5 that record its outcomes are
excerpted. Steps 1 to 3 are in the `wcag-em-sample` skill.

## [Step 4: Evaluate the selected sample set](https://www.w3.org/TR/wcag-em-2/#step4)

"Methodology Requirement 4: Evaluate the selected sample set according to Methodology Requirement
4.1, Methodology Requirement 4.2, and Methodology Requirement 4.3."

"During this step the evaluator evaluates (in detail) all of the samples selected in Step 3: Select
a representative sample set, and compares the structured sample set to the randomly selected sample
set. The evaluation is carried out according to the five WCAG 2 conformance requirements at the
target conformance level defined in Step 1.2: Define the conformance target."

"The five WCAG 2.2 conformance requirements are:

- Conformance Level
- Full pages
- Complete processes
- Only Accessibility-Supported Ways of Using Technologies
- Non-Interference"

Note: "Carrying out this step requires deep understanding of the WCAG 2 conformance requirements and
the expertise described in section Required expertise."

### [Step 4.1: Check all initial samples](https://www.w3.org/TR/wcag-em-2/#step4a)

"Methodology Requirement 4.1: Check that each sample that is not within or at the end of a complete
process conforms to each of the five WCAG 2 conformance requirements at the target conformance
level."

"For each sample selected in Step 3: Select a representative sample set that is not within or at
the end of a complete process, check its conformance with each of the five WCAG conformance
requirements, with the target conformance level defined in Step 1.2: Define the conformance target.
This includes all components of the sample without activating any functions, entering any data, or
otherwise initiating a process. Such functionality and interaction, including samples that are
within or the end of a complete process, will be evaluated in the subsequent step."

Note: "Many samples will have components, such as the header, navigation bars, search form, and
others that occur repeatedly. While the requirement is to check full pages, typically these
components do not need to be re-evaluated on each occurrence unless they appear or behave
differently, or when additional evaluation requirements are defined in Step 1.4: Define additional
evaluation requirements (optional)."

#### [WCAG 2 success criteria](https://www.w3.org/TR/wcag-em-2/#step4a-wcag)

"There are typically several ways to determine whether WCAG 2 success criteria have been met or not
met. W3C/WAI provides one set of (non-normative) Techniques for WCAG 2.2, which documents ways of
meeting particular WCAG 2 success criteria. It also includes documented common failures, which are
known ways in which content does not meet particular WCAG 2 success criteria. [...]"

"Evaluators can use such documented guidance to check whether particular web content meets or fails
to meet WCAG 2 success criteria. Documented techniques and failures can also be useful background
in evaluation reports. However, it is not required to use the particular set of techniques and
failures documented by W3C/WAI. In fact, evaluators do not need to follow any techniques and
failures at all. Evaluators might use other approaches to evaluate whether WCAG 2 success criteria
have been met or not met. For example, evaluators may utilize specific testing instructions and
protocols that meet the requirements for sufficient techniques, and that may be publicly documented
or only available to the evaluators."

Note: "WCAG 2 success criteria are each formulated as a "testable statement that will be either
true or false when applied to specific web content". When there is no content presented to the user
that relates to specific success criteria (for example, no video on the web page), then the success
criteria are "satisfied" according to WCAG 2. Optionally, an evaluation report can specifically
indicate success criteria for which there is no relevant content, for example, with "not present".
Understanding Conformance provides more background and guidance."

#### [Conforming alternate versions](https://www.w3.org/TR/wcag-em-2/#step4a-alternate)

"Content on a sample might have alternate versions. For example, video content may be provided in a
version with and without captions. In some cases an entire sample set (or series of them) may be
provided as an alternate version to an initial sample. Conformance to WCAG 2 can be achieved with
the help of alternate versions that meet the requirements listed in the WCAG 2 definition for
conforming alternate version. For example, a web page with video content without captions could
still meet WCAG 2 by providing an alternate version for the video that qualifies to be a conforming
alternate version."

Note: "Alternate versions are not considered to be separate samples but part of the content.
Samples are evaluated together with their alternate versions as one unit (full page)."

#### [Accessibility support](https://www.w3.org/TR/wcag-em-2/#step4a-support)

"Content on a sample needs to be provided in a way that is accessibility supported (either directly
or through an alternate version). For example, the captions for a video need to be provided in a
way that they can be displayed to users. [...] However, WCAG 2 does not define a particular
threshold or set of software that a digital product needs to support for accessibility. The
definition of such a baseline depends on several parameters including the purpose, target audience,
and language of the digital product. The baseline used to evaluate a particular digital product is
defined in Step 1.3: Define an accessibility support baseline."

#### [Non-interference](https://www.w3.org/TR/wcag-em-2/#step4a-interference)

"Content on a sample may not conform to WCAG 2, even though the sample as a whole might still
conform to WCAG 2. For example, information and functionality may be provided using web content
technologies that are not yet widely supported by assistive technologies or in a way that is not
supported by assistive technologies, accompanied by a conforming alternate version for the
information and functionality that is accessibility supported. In this case the non-conforming
content must not negatively interfere with the conforming content so that the sample can conform to
WCAG 2. The WCAG 2 conformance requirement for non-interference defines specific requirements for
content to qualify as non-interfering."

### [Step 4.2: Check all complete processes](https://www.w3.org/TR/wcag-em-2/#step4b)

"Methodology Requirement 4.2: Check that all interaction for each sample that is part of a complete
process conforms to each of the five WCAG 2 conformance requirements at the target conformance
level."

"For each complete process identified in Step 3.3: Include complete processes, follow the
identified default and branch sequences of samples, and evaluate each according to Step 4.1: Check
all initial samples. However, in this case it is not necessary to evaluate all content but only the
content that changes along the process."

"Functionality, entering data, notifications, and other interaction is part of this check. In
particular, it includes:

- interaction with forms, input elements, dialog boxes, and other components,
- confirmations for input, error messages, and other feedback from user interaction, and
- behavior using different settings, preferences, devices, and interaction parameters."

### [Step 4.3: Compare structured and random sample sets](https://www.w3.org/TR/wcag-em-2/#step4c)

"Methodology Requirement 4.3: Check that each sample in the randomly selected sample set does not
show types of content and outcomes that are not represented in the structured sample set."

"While the individual occurrences of WCAG 2 success criteria will vary between the structured and
randomly selected sample sets, the randomly selected sample set should not show new types of content
not present in the structured sample set. Also the outcomes from evaluating the randomly selected
sample set should not show new findings to those of the structured sample set. If the randomly
selected sample set shows new types of content or new evaluation findings then it is an indication
that the structured sample set was not sufficiently representative of the content provided on the
website. In this case evaluators need to go back to Step 3: Select a representative sample set to
select additional samples that reflect the newly identified types of content and findings. Also the
findings of Step 2: Explore the target digital product might need to be adjusted accordingly. This
step is repeated until the structured sample set is adequately representative of the content
provided on the digital product."

## [Step 5: Report the evaluation findings](https://www.w3.org/TR/wcag-em-2/#step5)

"While evaluation findings are reported at the end of the process, documenting them is carried out
throughout the evaluation process to ensure verifiable outcomes. The documentation typically has
varying levels of confidentiality. For example, documenting the specific methods used to evaluate
individual requirements might remain limited to the evaluator while reports about the outcomes from
these checks are typically made available to the evaluation commissioner."

### [Step 5.1: Document the outcomes of each step](https://www.w3.org/TR/wcag-em-2/#step5a)

"Methodology Requirement 5.1: Document each outcome of the steps defined in Step 1: Define the
evaluation scope, Step 2: Explore the target digital product, Step 3: Select a representative
sample set, and Step 4: Evaluate the selected sample set."

"For transparency, replicability of the evaluation results and justifications for any statements
made based on this evaluation, it is essential to document the outcomes for each of the previous
steps (including all sub-sections)."

The list of what to include ends with:

"- Sample set evaluated

- Evaluation outcomes from Step 4.1: Check all initial samples
- Evaluation outcomes from Step 4.2: Check all complete processes
- Evaluation outcomes from Step 4.3: Compare structured and random sample sets"

Note: "As part of documenting evaluation outcomes, clear issue descriptions, steps to reproduce,
severity of the findings, screenshots and/or videos can help teams resolve issues more quickly."

Note: "Depending on the desired granularity of the report documentation, the outcomes of Step 4:
Evaluate the selected sample set may be provided for each evaluated sample, or aggregated over the
entire sample set. Reports should include at least one example for each conformance requirement and
WCAG 2 Success Criterion not met. It is also good practice for evaluators to indicate issues that
occur repeatedly."

"Reports may also include additional information depending on any additional evaluation
requirements defined in Step 1.4: Define additional evaluation requirements (optional). For example,
an evaluation commissioner may request a report indicating every failure occurrence for every
sample, more information about the nature and the causes of the identified failures, or repair
suggestions to remedy the failures."

### [Step 5.2: Record the evaluation specifics (optional)](https://www.w3.org/TR/wcag-em-2/#step5b)

"Methodology Requirement 5.2: Archive the samples evaluated, and record the evaluation tools, web
browsers, assistive technologies, other software, and methods used to evaluate them (optional)."

"Records of the evaluation specifics could include any of the following:

- Copies of the files and resources of the samples; [...]
- Screenshots of the samples;
- Description of the path to locate the samples, especially when they are part of a process;
- Description of the settings, input, and actions used to generate or navigate to the samples.
- Specific test credentials (user-IDs, etc.) required to replicate a unique data set or workflow;
- Names and versions of the evaluation tools, web browsers and add-ons, assistive technology, and
  other software used;
- The methods, procedures, and techniques used to evaluate conformance to WCAG 2."

Note: "Records of the evaluation specifics may include sensitive information such as internal code,
passwords, and copies of data. They may need particular security and privacy precautions."

### [Step 5.3: Provide an evaluation statement (optional)](https://www.w3.org/TR/wcag-em-2/#step5c)

"Reminder: In the majority of situations, using this methodology alone does not result in WCAG 2
conformance claims for the target digital product; see Relation to WCAG 2 Conformance Claims for
more background."

### [Step 5.4: Provide an aggregated score (optional)](https://www.w3.org/TR/wcag-em-2/#step5d)

"[...] aggregated scores can be misleading and do not provide sufficient context and information to
understand the actual accessibility of a digital product. For this and other reasons WCAG 2 does
not provide a rating scheme."

## How WCAGify records the outcomes of Step 4

The report (`index.md` plus one issue file per defect) is the Step 5.1 documentation for the
commissioner; the evaluator notes in `.notes/audit/` are the Step 5.2 record. Per criterion the
report knows three states, matching the note under [WCAG 2 success criteria](#wcag-2-success-criteria):

| State       | Report                                                 | Meaning                                                                 |
| ----------- | ------------------------------------------------------ | ----------------------------------------------------------------------- |
| failed      | at least one issue file with `sc: <criterion>`         | the criterion evaluates to false on at least one sample                 |
| not present | the criterion is listed under `scStatuses.not-present` | no content on any sample relates to the criterion; satisfied per WCAG 2 |
| satisfied   | neither of the above                                   | evaluated, content present, no failure found                            |

`cannot-tell` exists only in the notes: a criterion that could not be settled is either confirmed
by a human (then failed or satisfied) or reported to the commissioner as an open item.
