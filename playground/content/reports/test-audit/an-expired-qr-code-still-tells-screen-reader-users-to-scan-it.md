---
title: An expired QR code still tells screen-reader users to scan it
sc: 1.1.1
severity: Medium
type: Technical
difficulty: Low
sample: page-3
---

![The login page after the QR code has expired. The code is greyed out and overlaid with a refresh icon and the text "Klik om een nieuwe QR-code te maken".](/api/uploads/test-audit/an-expired-qr-code-still-tells-screen-reader-users-to-scan-it-1-1-1-4d1ac48a.webp)

After about 80 to 110 seconds the login QR code expires: it turns grey and a refresh control "<span lang="nl">Klik om een nieuwe QR-code te maken</span>" is laid over it. The graphic (`qr-code[role="img"]`) keeps its text alternative, **"<span lang="nl">Scan de QR-code met de ABN AMRO app op uw telefoon of tablet om in te loggen</span>"**.

A sighted user sees at once that the code can no longer be used. A screen-reader user is still told to scan it, and only the refresh button's own name hints that something changed. The text alternative no longer describes the image.

The focus move when the code expires is a separate issue, "The login page takes your keyboard focus away when the QR code expires".

#### Recommendation

Update the `aria-label` whenever the code changes state:

    <qr-code role="img" aria-label="QR-code verlopen. Maak een nieuwe QR-code om in te loggen."></qr-code>

([F20](https://www.w3.org/WAI/WCAG22/Techniques/failures/F20), [ARIA6](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA6)).
