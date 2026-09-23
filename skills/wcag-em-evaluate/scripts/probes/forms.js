// Form controls on the current page, for 1.3.5, 2.5.3, 3.3.1, 3.3.2, 3.3.3, 4.1.2.
// Run against the open page:  agent-browser eval --stdin < forms.js
// Run it again after submitting or blurring fields to capture the error state.
/* oxlint-disable unicorn/consistent-function-scoping, unicorn/no-null */
;(() => {
  const clean = (text) => (text || '').replace(/\s+/g, ' ').trim()
  const cssPath = (el) => {
    const parts = []
    let node = el
    while (node && node.nodeType === 1 && parts.length < 6) {
      let part = node.localName
      if (node.id) {
        parts.unshift(`${part}#${CSS.escape(node.id)}`)
        break
      }
      const siblings = node.parentElement
        ? [...node.parentElement.children].filter((s) => s.localName === node.localName)
        : []
      if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(node) + 1})`
      parts.unshift(part)
      node = node.parentElement
    }
    return parts.join(' > ')
  }
  const byIds = (el, attr) =>
    clean(
      (el.getAttribute(attr) || '')
        .split(/\s+/)
        .filter(Boolean)
        .map((id) => document.getElementById(id)?.textContent || '')
        .join(' ')
    )
  const isVisible = (el) => {
    const rect = el.getBoundingClientRect()
    const style = getComputedStyle(el)
    return (
      rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && !el.closest('[hidden]')
    )
  }
  // Accessible name of a form control, following the accname order for form elements.
  const nameOf = (el) => {
    const labelledby = byIds(el, 'aria-labelledby')
    if (labelledby) return { name: labelledby, source: 'aria-labelledby' }
    const ariaLabel = clean(el.getAttribute('aria-label'))
    if (ariaLabel) return { name: ariaLabel, source: 'aria-label' }
    const labels = el.labels ? [...el.labels] : []
    const labelText = clean(labels.map((l) => l.textContent).join(' '))
    if (labelText) return { name: labelText, source: 'label' }
    if (
      el.localName === 'button' ||
      (el.localName === 'input' && /^(?:submit|reset|button)$/.test(el.type))
    ) {
      const text = clean(el.localName === 'button' ? el.textContent : el.value)
      if (text) return { name: text, source: 'content' }
    }
    if (el.localName === 'input' && el.type === 'image' && el.getAttribute('alt'))
      return { name: clean(el.getAttribute('alt')), source: 'alt' }
    const title = clean(el.getAttribute('title'))
    if (title) return { name: title, source: 'title' }
    const placeholder = clean(el.getAttribute('placeholder'))
    if (placeholder) return { name: placeholder, source: 'placeholder' }
    return { name: '', source: 'none' }
  }
  // The WCAG 1.3.5 input purpose the field looks like, from its name, id, autocomplete or label.
  const purposeOf = (el, name) => {
    const hint = `${el.name} ${el.id} ${name} ${el.getAttribute('placeholder') || ''}`.toLowerCase()
    const table = [
      ['email', /e-?mail/],
      ['tel', /\b(?:tel|phone|telefoon|mobile|mobiel)\b/],
      ['given-name', /\b(?:first ?name|voornaam|given)/],
      ['family-name', /\b(?:last ?name|surname|achternaam|family)/],
      ['name', /\b(?:full ?name|naam|name)\b/],
      ['postal-code', /\b(?:zip|postcode|postal)/],
      ['street-address', /\b(?:street|straat|address|adres)\b/],
      ['address-line1', /address-?line-?1|adresregel/],
      ['country', /\b(?:country|land)\b/],
      ['bday', /\b(?:birth|geboorte|dob)\b/],
      ['username', /\b(?:user ?name|gebruikersnaam|login)\b/],
      ['current-password', /\b(?:password|wachtwoord)\b/],
      ['cc-number', /\b(?:card ?number|kaartnummer|cc-?num)/],
      ['organization', /\b(?:company|organi[sz]ation|bedrijf)\b/],
      ['url', /\b(?:website|url)\b/]
    ]
    if (el.type === 'email') return 'email'
    if (el.type === 'tel') return 'tel'
    if (el.type === 'password') return 'current-password'
    for (const [token, re] of table) if (re.test(hint)) return token
    return null
  }
  const controls = [
    ...document.querySelectorAll(
      'input:not([type="hidden"]), select, textarea, button, [role="textbox"], [role="combobox"], [role="listbox"], [role="checkbox"], [role="radio"], [role="switch"], [role="slider"], [role="spinbutton"], [role="searchbox"], [contenteditable="true"]'
    )
  ]
  const legendOf = (fieldset, group) => {
    if (fieldset) return clean(fieldset.querySelector('legend')?.textContent) || null
    if (group)
      return byIds(group, 'aria-labelledby') || clean(group.getAttribute('aria-label')) || null
    return null
  }
  const valueOf = (el) => {
    if (el.localName === 'input' && el.type === 'password') return el.value ? '(set)' : ''
    return clean(el.value ?? '').slice(0, 40)
  }
  const fields = controls.map((el) => {
    const { name, source } = nameOf(el)
    const fieldset = el.closest('fieldset')
    const group = el.closest('[role="group"], [role="radiogroup"]')
    const visibleLabel =
      el.labels && el.labels.length ? clean([...el.labels].map((l) => l.textContent).join(' ')) : ''
    return {
      selector: cssPath(el),
      tag: el.localName,
      type: el.type || null,
      role: el.getAttribute('role') || null,
      name,
      nameSource: source,
      visibleLabelText: visibleLabel || null,
      placeholder: el.getAttribute('placeholder') || null,
      required: el.required || false,
      ariaRequired: el.getAttribute('aria-required') || null,
      ariaInvalid: el.getAttribute('aria-invalid') || null,
      describedbyText: byIds(el, 'aria-describedby') || null,
      errormessageText: byIds(el, 'aria-errormessage') || null,
      autocomplete: el.getAttribute('autocomplete') || null,
      autocompleteCandidate: purposeOf(el, name),
      inFieldset: Boolean(fieldset || group),
      legend: legendOf(fieldset, group),
      disabled: el.disabled || el.getAttribute('aria-disabled') === 'true',
      visible: isVisible(el),
      value: valueOf(el)
    }
  })
  const forms = [...document.querySelectorAll('form')].map((form) => ({
    selector: cssPath(form),
    action: form.getAttribute('action'),
    method: form.getAttribute('method') || 'get',
    novalidate: form.hasAttribute('novalidate'),
    submitButtons: [
      ...form.querySelectorAll(
        'button:not([type="button"]), input[type="submit"], input[type="image"]'
      )
    ].map((b) => nameOf(b).name)
  }))
  const errorLike = /\b(?:error|fout|invalid|ongeldig|required|verplicht|must|moet|incorrect)\b/i
  const fieldReferencing = (el) =>
    el.id
      ? controls.find(
          (c) =>
            (c.getAttribute('aria-describedby') || '').split(/\s+/).includes(el.id) ||
            c.getAttribute('aria-errormessage') === el.id
        )
      : undefined
  const visibleErrors = [
    ...document.querySelectorAll(
      '[role="alert"], [aria-live], .error, .invalid, [class*="error"], [class*="invalid"], [id*="error"], .field-error, .form-error'
    )
  ]
    .filter((el) => isVisible(el) && clean(el.textContent) && errorLike.test(el.textContent))
    .slice(0, 30)
    .map((el) => {
      const field = fieldReferencing(el)
      return {
        selector: cssPath(el),
        text: clean(el.textContent).slice(0, 160),
        forField: field ? cssPath(field) : null,
        role: el.getAttribute('role') || null,
        ariaLive: el.getAttribute('aria-live') || null
      }
    })
  const inputsWithoutForm = controls.filter(
    (el) => !el.closest('form') && el.localName !== 'button'
  ).length
  return {
    url: location.href,
    fields,
    forms,
    visibleErrors,
    inputsWithoutForm,
    counts: {
      fields: fields.length,
      unnamed: fields.filter((f) => !f.name && !f.disabled && f.visible).length,
      placeholderOnly: fields.filter((f) => f.nameSource === 'placeholder').length,
      requiredWithoutIndication: fields.filter(
        (f) =>
          (f.required || f.ariaRequired === 'true') &&
          !/\*|required|verplicht|\(mandatory\)/i.test(
            `${f.visibleLabelText || ''} ${f.describedbyText || ''}`
          )
      ).length,
      autocompleteMissing: fields.filter((f) => f.autocompleteCandidate && !f.autocomplete).length
    }
  }
})()
