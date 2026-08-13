# Askara Discourse theme

A Discourse **theme component** that applies the [Askara brand](https://brand.askara.solutions/) to
the community hub at `community.askara.solutions` — self-hosted brand fonts and three brand colour
schemes, installed via Discourse's "install from a git repository" flow.

It is a **component** (not a full theme): it layers onto whatever base theme is active, contributing
palettes + fonts + a few brand accents.

## Colour schemes

Three named schemes ship in [`about.json`](about.json) `color_schemes`, all built from the brand
palette. Phosphor green (`#8dff35`) is deliberately absent from every scheme — see governance below.

| Scheme | Page background | Character |
|---|---|---|
| **Askara Light** (default) | Parchment 1 `#fdf7ed` (the brand's lightest "page canvas") | soft warm canvas, not stark white |
| **Askara Parchment** | Parchment 2 `#f5ead4` (a distinctly warmer parchment) | deliberately distinct from Light — a warmer, richer mood |
| **Askara Dark** | Espresso `#1a1814` | warm near-black, cream text |

All three share the navy header (`#003049`), compliance-green links/CTAs (`#3db54a`), and the
destructive red (`#ff6666`) for error states.

## Typography

Self-hosted (no third-party CDN — a GDPR requirement for this EU community), declared in
[`common/common.scss`](common/common.scss):

- **Plus Jakarta Sans** (variable, weights 300–800) — UI, body, and headings.
- **IBM Plex Mono** (400/500) — code and monospaced brand labels.

## Governance: phosphor green

Phosphor green `#8dff35` is the brand's own `--green-hover` token. It is used **only** for hover /
focus / CTA / logo states (in SCSS), and is intentionally **not** a `color_schemes` value — so it
can never leak into `--tertiary`, links, or general accents.

## Install

Admin → Customize → Themes → **Install** → **From a git repository**, and paste:

```
https://github.com/Askara-Solutions/askara-discourse-theme
```

(On the API: `POST /admin/themes/import` with `remote=<that URL>`.) Then add it as a component to the
active theme under "Included components."

## Usage

- In **Admin → Customize → Colors**, the three `Askara …` palettes appear on install. Mark them
  user-selectable and set **Askara Light** as the default.
- Turn on `interface_color_selector` (site settings) to give members a light/dark toggle.
- **Logos, favicon, and the OpenGraph image are site settings**, uploaded separately — do **not** add
  them as theme uploads, because a git update wipes any upload not present in the repo.

## Development

```bash
gem install discourse_theme
discourse_theme watch .   # live-syncs to a dev/test Discourse on save
```

CI ([`.github/workflows/discourse-theme.yml`](.github/workflows/discourse-theme.yml)) runs Discourse's
official reusable workflow (Prettier / Stylelint / locale lint) on every push and PR.

## Brand source (canonical — do not re-derive)

All values come from **[`Askara-Solutions/brand.askara.solutions`](https://github.com/Askara-Solutions/brand.askara.solutions)**
at pinned commit **`1dd6e28f23d33587a72b04b3d7e6bce204a6c2de`**:

- **Colours** → `docs/brand/css/brand.css` `:root`.
- **Fonts** → `docs/fonts/`. IBM Plex Mono is vendored as WOFF2 as-shipped; Plus Jakarta Sans is the
  variable TTF converted to variable WOFF2 (`fonttools`).

Never re-derive brand values from the rendered `brand.askara.solutions` site. When bumping the pin,
re-verify tokens and fonts against the new commit. The full translation record and rationale live in
`askara-community` `configuration/theming-brand-application.md`.

## License

Theme code: [MIT](LICENSE). Bundled fonts: SIL Open Font License 1.1 —
[`assets/OFL-PlusJakartaSans.txt`](assets/OFL-PlusJakartaSans.txt),
[`assets/OFL-IBMPlexMono.txt`](assets/OFL-IBMPlexMono.txt).
