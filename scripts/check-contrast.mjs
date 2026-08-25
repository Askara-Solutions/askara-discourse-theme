#!/usr/bin/env node
// WCAG contrast guard for the committed colour combinations.
//
// Every colour below is an existing Askara brand or website (Design System 3.0) token, or a
// value derived from those tokens (the dark-card constants — see their per-line notes), never
// an ad-hoc colour. This asserts each foreground/background pair we ship clears its WCAG target:
//   text  >= 4.5:1 (AA normal)
//   large/UI (headings, big text, borders) >= 3.0:1 (AA large)
// Fails the build if any committed pair drops below target.

const HEX = {
  navy: "#003049",
  slate: "#4a5163",
  green: "#3db54a",
  greenDeep: "#267632", // web token: AA green text on light
  phosphor: "#8dff35",
  brass: "#c8a868",
  brassMid: "#906835", // web token: link colour on light
  brassDeep: "#7a6030", // web token: link hover on light
  brassLight: "#e8d0a0",
  parchment1: "#fdf7ed",
  parchment2: "#f5ead4",
  parchment3: "#e8d4ad",
  espresso: "#1a1814",
  cream: "#faf8f5",
  lightGrey: "#d9d9d9",
  white: "#ffffff", // brand --white / --text-heading-dark; --quaternary in the Dark scheme
  // Solved-banner meta row sits inside .d-post-accordion-item__header, whose background is
  // --primary-very-low = this theme's $warm-hairline = color-mix(--tertiary 16%, --secondary).
  // Precomputed per scheme — keep in sync with the theme mapping (BDEV-313): Light = brass-mid over
  // parchment-1, Parchment = brass-deep over parchment-2, Dark = brass-light over espresso.
  solvedMetaBgLight: "#ece0d0",
  solvedMetaBgParchment: "#e1d4ba",
  solvedMetaBgDark: "#3b352a",
  // Dark-scheme card surface (BDEV-269). Resolved from brand tokens — keep in sync with
  // common/color_definitions.scss. INTERIM values; canonical espresso ramp tracked in BRA-35.
  darkCardFill: "#2a271f", // = color-mix(in srgb, brass-light 8%, espresso)
  darkCardBody: "#c0bdb9", // = cream @ .72 alpha composited over darkCardFill (Dark card body copy)
  // Hero background scrim (BDEV-282, tuned for readability in BDEV-291). The hero text sits over a
  // brass-warm radial scrim (#554024 = 50% brass + 50% espresso) at 0.65 centre opacity, laid over
  // the photo. The hero text is LARGE (heading 2.75rem, subheading 1.5rem = 24px) so the WCAG
  // minimum is 3.0:1, but we assert the COMFORT target 4.5:1 (readers found the old 0.51/3.x:1 hard
  // to read). These two hexes are the ACTUAL composited backgrounds at the brightest patch under the
  // text (full line width) on the two toughest scenes — the real floor, measured via dev/hero-preview.
  // Re-derive there if the bundled hero_bg_img_* images or the scrim opacity change.
  heroScrimExhibition: "#806f53", // #554024 @0.65 over the exhibition-hall brightest text patch (worst)
  heroScrimColonnade: "#7f6646", // #554024 @0.65 over the colonnade brightest text patch
  // Community footer (BDEV-320): secondary text (links, tagline, address, copyright) is cream @0.72
  // over the navy footer band. Precomputed composite — keep in sync with $footer-muted in common.scss.
  footerMuted: "#b4c0c5", // = cream #faf8f5 @0.72 alpha over navy #003049
  // Secondary body copy — --card-body (BDEV-352): card/section descriptions, subtitles, and
  // topic-list excerpts. Light schemes = navy #003049 @0.80 (darkened from @0.70); Dark = cream
  // #faf8f5 @0.72. Precomputed composite over each scheme's page/card background — keep in sync
  // with --card-body in common/color_definitions.scss.
  cardBodyOnP1: "#33586a", // navy @0.80 over parchment-1 (Askara Light page bg)
  cardBodyOnP2: "#315565", // navy @0.80 over parchment-2 (Askara Parchment page bg + card fill)
  cardBodyOnEspresso: "#bbb9b6", // cream @0.72 over espresso (Askara Dark page bg)
};

const srgb = (c) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(srgb);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// [foreground, background, minRatio, label]
const COMBOS = [
  // --- Askara Light (bg parchment-1) ---
  [HEX.espresso, HEX.parchment1, 4.5, "light: body (espresso/parchment-1)"],
  [HEX.brassMid, HEX.parchment1, 4.5, "light: link (brass-mid/parchment-1)"],
  [
    HEX.brassDeep,
    HEX.parchment1,
    4.5,
    "light: link-hover (brass-deep/parchment-1)",
  ],
  [
    HEX.greenDeep,
    HEX.parchment1,
    4.5,
    "light: success text (green-deep/parchment-1)",
  ],
  [HEX.navy, HEX.parchment1, 3.0, "light: heading (navy/parchment-1)"],
  [HEX.slate, HEX.parchment1, 4.5, "light: meta (slate/parchment-1)"],
  // --- Askara Parchment (bg parchment-2) — the warmer, tighter case ---
  [HEX.espresso, HEX.parchment2, 4.5, "parchment: body (espresso/parchment-2)"],
  // brass-mid fails on parchment-2 (4.17:1) — the Parchment scheme uses brass-deep for links.
  [
    HEX.brassDeep,
    HEX.parchment2,
    4.5,
    "parchment: link (brass-deep/parchment-2)",
  ],
  [HEX.navy, HEX.parchment2, 4.5, "parchment: link-hover (navy/parchment-2)"],
  [
    HEX.greenDeep,
    HEX.parchment2,
    4.5,
    "parchment: success text (green-deep/parchment-2)",
  ],
  [HEX.navy, HEX.parchment2, 3.0, "parchment: heading (navy/parchment-2)"],
  [HEX.slate, HEX.parchment2, 4.5, "parchment: meta (slate/parchment-2)"],
  // --- Cards (glossary style: parchment-3 fill) ---
  [HEX.navy, HEX.parchment3, 4.5, "card: navy heading on parchment-3"],
  // --- Secondary body copy: --card-body (descriptions, subtitles, topic-list excerpts — BDEV-352).
  //     Light schemes navy@0.80, Dark cream@0.72, over each scheme's page/card background. ---
  [
    HEX.cardBodyOnP1,
    HEX.parchment1,
    4.5,
    "card-body: secondary text (navy@.80) on parchment-1 (Light page)",
  ],
  [
    HEX.cardBodyOnP2,
    HEX.parchment2,
    4.5,
    "card-body: secondary text (navy@.80) on parchment-2 (Parchment page / card fill)",
  ],
  [
    HEX.cardBodyOnEspresso,
    HEX.espresso,
    4.5,
    "card-body: secondary text (cream@.72) on espresso (Dark page)",
  ],
  // --- CTA button (navy label on both brand greens; rest/hover swap for the hero CTA — BDEV-289) ---
  [
    HEX.navy,
    HEX.green,
    4.5,
    "cta: navy text on green fill (primary rest / hero hover)",
  ],
  [
    HEX.navy,
    HEX.phosphor,
    4.5,
    "cta: navy text on phosphor fill (primary hover / hero rest)",
  ],
  // --- Askara Dark (bg espresso) ---
  [HEX.cream, HEX.espresso, 4.5, "dark: body (cream/espresso)"],
  [HEX.brassLight, HEX.espresso, 4.5, "dark: link (brass-light/espresso)"],
  [HEX.green, HEX.espresso, 4.5, "dark: success text (green/espresso)"],
  [HEX.lightGrey, HEX.espresso, 4.5, "dark: meta (light-grey/espresso)"],
  // Dark cards: espresso-derived surface (BDEV-269) — title + body on the card fill.
  [
    HEX.white,
    HEX.darkCardFill,
    4.5,
    "dark card: title (white) on espresso card fill",
  ],
  [
    HEX.darkCardBody,
    HEX.darkCardFill,
    4.5,
    "dark card: body (cream/72) on espresso card fill",
  ],
  // --- Header (navy bar, all schemes) ---
  [HEX.cream, HEX.navy, 4.5, "header: cream text on navy"],
  // --- Community footer (navy band, all schemes — BDEV-320). Headings + hovered links use full cream
  //     (covered by the header cream/navy row above); secondary text is cream @0.72 over navy. ---
  [
    HEX.footerMuted,
    HEX.navy,
    4.5,
    "footer: secondary text (cream @0.72) on navy",
  ],
  // --- Solved accepted-answer banner (BDEV-313). Header reuses the CTA green fill + navy label in
  //     every scheme; the meta row uses --solved-meta = slate (light/parchment) / light-grey (Dark)
  //     on the item-header surface (--primary-very-low = warm-hairline), asserted per scheme. ---
  [HEX.navy, HEX.green, 4.5, "solved banner: navy label on green fill"],
  [
    HEX.slate,
    HEX.solvedMetaBgLight,
    4.5,
    "solved meta: slate on the Light item-header surface",
  ],
  [
    HEX.slate,
    HEX.solvedMetaBgParchment,
    4.5,
    "solved meta: slate on the Parchment item-header surface",
  ],
  [
    HEX.lightGrey,
    HEX.solvedMetaBgDark,
    4.5,
    "solved meta: light-grey on the Dark item-header surface",
  ],
  // --- Askara-team identity pill (BDEV-362). Scheme-aware: navy fill + cream text on the two
  //     LIGHT schemes, brass-light fill + navy text on Dark. Assert the text-on-pill interiors
  //     (AA 4.5); the chip-on-canvas separation reuses navy/parchment (headings) and
  //     brass-light/espresso (dark link), already asserted above. ---
  [
    HEX.cream,
    HEX.navy,
    4.5,
    "askara-team pill (Light/Parchment): cream text on navy fill",
  ],
  [
    HEX.navy,
    HEX.brassLight,
    4.5,
    "askara-team pill (Dark): navy text on brass-light fill",
  ],
  // --- Hero background scrim (BDEV-291): cream text over the brass-warm scrim @0.65, 2 worst scenes.
  //     Asserted at the 4.5 COMFORT target (above the 3.0 large-text minimum) after reader feedback. ---
  [
    HEX.cream,
    HEX.heroScrimExhibition,
    4.5,
    "hero-bg: cream text over brass-warm scrim on the exhibition hall (worst scene)",
  ],
  [
    HEX.cream,
    HEX.heroScrimColonnade,
    4.5,
    "hero-bg: cream text over brass-warm scrim on the colonnade",
  ],
];

let failed = 0;
for (const [fg, bg, min, label] of COMBOS) {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) failed++;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${r.toFixed(2)}:1  (min ${min})  ${label}`,
  );
}
if (failed) {
  console.error(
    `\nContrast guard FAILED: ${failed} committed combo(s) below target.`,
  );
  process.exit(1);
}
console.log(
  "\nContrast guard OK: all committed colour combinations meet their WCAG target.",
);
