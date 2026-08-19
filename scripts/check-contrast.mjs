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
  // Dark-scheme card surface (BDEV-269). Resolved from brand tokens — keep in sync with
  // common/color_definitions.scss. INTERIM values; canonical espresso ramp tracked in BRA-35.
  darkCardFill: "#2a271f", // = color-mix(in srgb, brass-light 8%, espresso)
  darkCardBody: "#c0bdb9", // = cream @ .72 alpha composited over darkCardFill (Dark card body copy)
  // Hero background scrim (BDEV-282). The hero text sits over a brass-warm radial scrim (#554024 =
  // 50% brass + 50% espresso) at 0.51 centre opacity, laid over the photo. The hero text is
  // intentionally LARGE (heading 2.75rem, subheading 1.5rem = 24px) so the WCAG bar is 3.0:1. These
  // two hexes are the ACTUAL composited backgrounds at the brightest patch under the text on the two
  // toughest scenes — the real floor, measured via dev/hero-preview. Re-derive there if the bundled
  // hero_bg_img_* images change.
  heroScrimExhibition: "#968b71", // #554024 @0.51 over the exhibition-hall brightest text patch (worst)
  heroScrimColonnade: "#927754", // #554024 @0.51 over the colonnade brightest text patch
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
  // --- Hero background scrim (BDEV-282): cream (large) text over the brass-warm scrim, 2 worst scenes ---
  [
    HEX.cream,
    HEX.heroScrimExhibition,
    3.0,
    "hero-bg: cream large text over brass-warm scrim on the exhibition hall (worst scene)",
  ],
  [
    HEX.cream,
    HEX.heroScrimColonnade,
    3.0,
    "hero-bg: cream large text over brass-warm scrim on the colonnade",
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
