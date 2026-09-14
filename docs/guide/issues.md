# Issues

Issues represent individual accessibility findings within a report. Each issue is a separate markdown file inside a report directory.

## Issue Structure

An issue file contains frontmatter with metadata and a markdown body describing the finding.

### Frontmatter Fields

```yaml
---
title: Focus style missing on interactive elements
sc: 2.4.7
severity: High
difficulty: Low
sample: page-1
---
```

| Field        | Description                                             |
| ------------ | ------------------------------------------------------- |
| `title`      | Short description of the accessibility finding          |
| `sc`         | WCAG success criterion reference (e.g. `2.4.7`)         |
| `severity`   | Impact level: `Low`, `Medium`, `High`                   |
| `difficulty` | Effort to fix: `Low`, `Medium`, `High`                  |
| `type`       | Cause: `Content`, `Design`, `Technical` or `Unknown`    |
| `sample`     | `id` of the sample in the report the issue was found on |

### Issue Body

The markdown body should include:

- A description of the problem
- Where the issue was found (affected pages or components)
- How to reproduce the issue
- A recommended fix

## Example

```markdown
---
title: Images missing alternative text
sc: 1.1.1
severity: High
difficulty: Low
sample: page-1
---

Several images on the homepage lack `alt` attributes. Screen reader
users will not know the purpose of these images.

## Affected pages

- Homepage (`/`)
- About page (`/about`)

## Recommendation

Add descriptive `alt` attributes to all informative images. Use
`alt=""` for purely decorative images.
```

## Severity and Difficulty

These fields help prioritize remediation work:

- **Severity** reflects the impact on users with disabilities
- **Difficulty** reflects the estimated effort to implement a fix

Low-difficulty, high-severity issues should typically be addressed first.
