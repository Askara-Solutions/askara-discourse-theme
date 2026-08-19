# Hero preview (dev tool) — BDEV-282

A self-contained HTML replica of the community homepage hero, used to review and **approve
scrim / typography / image changes before they ship**. The real hero only renders on the deployed
Discourse site, so this tool stands in for it during design iteration.

It is **dev tooling, not part of the shipped theme** — Discourse's theme importer only reads
`about.json`, `common/`, `javascripts/`, `assets/`, etc., so nothing in `dev/` affects the installed
theme.

## Where it lives

| File | Purpose |
|---|---|
| `dev/hero-preview/hero-preview.html` | The template (edit this to enhance the preview). Carries placeholders `__PJS__`, `__IMG1__`–`__IMG4__`. |
| `dev/hero-preview/build.py` | Injects the real brand font + the 4 hero images as data URIs → a self-contained file. |
| `dev/hero-preview/hero-preview.built.html` | Generated output (gitignored). Open in a browser, or publish as a claude.ai Artifact. |

The images and font are read from the **actual theme assets** (`assets/hero/hero_bg_img_*.webp`,
`assets/plus-jakarta-sans.woff2`), so the preview always reflects what ships.

## Build & view

```bash
python3 dev/hero-preview/build.py      # -> dev/hero-preview/hero-preview.built.html
open dev/hero-preview/hero-preview.built.html   # macOS; or drag into a browser
```

To share a live, interactive version, publish `hero-preview.built.html` as a claude.ai Artifact
(self-contained, so it works under the Artifact CSP). Last published at:
`https://claude.ai/code/artifact/05f4dbef-6f7a-4cc6-b928-644de6887aff`

## What it does

- Renders the hero with the real font, images, tagline, rounded CTA, and scrim — in light and dark.
- **Cycles** the four scenes (matching the shipped `localStorage` rotation).
- **Contrast is measured live** from the brightest patch under the text on each scene (the true
  worst case), composited with the chosen scrim colour + opacity, versus cream `#faf8f5`. The pass
  bar auto-switches to **3.0:1** when the subheading qualifies as WCAG "large" text (≥24px, or
  ≥18.66px bold), else **4.5:1**.
- Levers: scrim **shape** (ellipse / full), **colour** (espresso / brass·warm / navy / brass /
  black), **opacity**, and subheading **size / weight**, plus a "set minimum opacity" button.

## Shipped defaults (approved 2026-08-19)

Mirror these in `common/common.scss` `.askara-homepage__hero*` and keep them in sync here:

- Scrim: **brass·warm `#554024`** (50% brass + 50% espresso), **radial ellipse**, peak **0.51**
- Title: **2.75rem**; tagline: **1.5rem / weight 500** (→ large text, 3.0:1 bar)
- Measured worst scene: **3.18:1** (exhibition hall) — above the 3.0 bar, and above the 0.49 minimum.

## Re-deriving the CI contrast floor

`scripts/check-contrast.mjs` hardcodes the two worst scenes' composited backgrounds
(`heroScrimExhibition`, `heroScrimColonnade`). **If the bundled `hero_bg_img_*` images change**, or
the scrim colour/opacity changes, re-measure the brightest-patch composited hex for each scene and
update those two constants (the preview's live readout uses the same brightest-patch method, so the
values it shows are the ones to encode).
