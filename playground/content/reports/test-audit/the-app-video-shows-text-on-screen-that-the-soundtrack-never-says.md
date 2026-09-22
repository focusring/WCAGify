---
title: The app video shows text on screen that the soundtrack never says
sc: 1.2.3
severity: High
type: Content
sample: page-18
---

![A full-screen brand-green card in the video reading "WAAROM GEBRUIKT U DE APP NOG NIET?" in white capitals, with no speaker on screen.](/api/uploads/test-audit/the-app-video-shows-text-on-screen-that-the-soundtrack-never-says-1-2-3-018fd223.webp)

The video **"Waarom anderen vertrouwen op de ABN AMRO app"** is structured around six full-screen text cards. Five of them are the interview questions the speakers answer — "GEBRUIKT U DE ABN AMRO APP?", "WAAROM GEBRUIKT U DE APP NOG NIET?", "DENKT U DE APP OOIT TE GAAN GEBRUIKEN?", "HOE VEILIG VINDT U DE APP?", "DUS TEVREDEN OVER DE APP?" — and the sixth is the closing call to action "REGEL UW BANKZAKEN ZOALS U DAT WILT #ABNAMROAPP".

**Nobody reads these cards aloud and there is nothing else on the soundtrack while they are shown.** The audio was measured second by second: the six cards sit at −91, −72, −91, −91, −77 and −100 dB against a median of −21 dB for the rest of the video — four of them are digital silence. A viewer who cannot see the screen hears four people answering questions that are never asked, and misses the call to action entirely.

There is no audio-described version, no descriptions track, and no transcript or text alternative anywhere on the page. The only link near the player downloads the original MP4.

**The same gap is on the "Een kijkje achter de schermen" video on the payments page (page-11)**, which uses the same video component: its opening title, the presenter's name card ("SJOERD MESKER / Presentator"), two full-screen text cards and an app screen showing account names and balances all carry information the audio never gives. Both videos need the same fix.

The video does carry burned-in Dutch captions throughout, so deaf viewers are served; this issue is about blind and low-vision viewers. The same gap fails **1.2.5 Audio Description (Prerecorded)** at level AA.

#### Recommendation

The cheapest fix that satisfies both 1.2.3 and 1.2.5 is to speak the cards. Re-record the soundtrack with a voice reading each question and the closing line during the silence that is already there — no re-edit is needed, because the gaps are long enough.

Alternatively, publish a transcript next to the video that includes both the spoken answers and the on-screen text, and link it from directly under the player ([G69](https://www.w3.org/WAI/WCAG22/Techniques/general/G69), [G78](https://www.w3.org/WAI/WCAG22/Techniques/general/G78), [G203](https://www.w3.org/WAI/WCAG22/Techniques/general/G203)).
