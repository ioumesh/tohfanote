# Typography and accessibility

This update targets the typography-related parts of WCAG 2.2 AA. It is not a declaration that the whole site conforms to WCAG.

- Arial/Helvetica/system fallbacks for readable interface text; Georgia for editorial headings.
- Default body and input text: 1rem (16px at the default browser setting).
- Supporting text: at least .875rem (14px at the default setting). This is a product choice, not a WCAG minimum-size rule.
- Relative font sizes, readable line spacing, wrapping controls and no disabled browser zoom.
- Darker muted copy, placeholders and primary buttons. Checked color pairs range from 5.54:1 to 7.36:1, above the 4.5:1 normal-text target. These sampled pairs are not a full automated audit of every layered/gradient surface.
- Reflow checks at 320px, 393px and 1280px with normal size, a 200% root-text setting, and the WCAG text-spacing override values: 1.5 line height, .12em letter spacing, .16em word spacing, and 2em paragraph spacing.
- tests/typography.mjs covers homepage, first builder step and privacy policy. Mobile and lifecycle suites separately cover the remaining builder stages and recipient flow. Physical iPhone and assistive-technology checks are still needed for broader accessibility verification.

Reference: https://www.w3.org/TR/WCAG22/ (1.4.3, 1.4.4, 1.4.10 and 1.4.12).
