---
title: At phone width the pension planner pushes its fields off the left edge
sc: 1.4.10
severity: High
type: Technical
sample: page-21
---

![The first step of the pension planner, "Begin vandaag met je pensioenplan", at phone width. Under "Je huidige leeftijd" no field is visible, and the fields under "Eenmalige inleg" and "Je maandelijkse inleg" are cut off at the left edge so that only "00" of their values shows.](/api/uploads/test-audit/at-phone-width-the-pension-planner-pushes-its-fields-off-the-left-edge-1-4-10-621dc45a.webp)

The pension planner is supplied by Webbridge and shown in a frame (`#tcm-275659-iframe`). On a 320-pixel screen the frame is 256 pixels wide, and the planner's first step does not fit: its rows keep the label, the field and the help button side by side with fixed widths.

The result is worse than a sideways scroll. The fields are pushed past the **left** edge, where scrolling cannot reach: the age field `#leeftijd` sits entirely outside the frame (from −44 to −6 pixels), and "<span lang="nl">Eenmalige inleg</span>" and "<span lang="nl">Je maandelijkse inleg</span>" start at −25 pixels, so only the last digits of their values show. The age is the only required field of the step, so on a phone the user cannot see what they are typing or that anything is there to fill in. The content is also 14 pixels wider than the frame, so it scrolls sideways as well. The page around the frame reflows correctly, and the planner's second step fits.

#### Recommendation

Below about 480 pixels, stack each row so the label, the field and the help button each get their own line, and let fields shrink with the frame:

    @media (max-width: 480px) {
      .tkm-formitem .form-group { display: block; }
    }
    .tkm-fields input { max-width: 100%; }

Ask Webbridge to test the planner at a width of 256 pixels, the width it gets on the site ([C32](https://www.w3.org/WAI/WCAG22/Techniques/css/C32), [C31](https://www.w3.org/WAI/WCAG22/Techniques/css/C31)).
