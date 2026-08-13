# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Project

- **Repo:** Askara-Solutions/askara-discourse-theme (public)
- **What it is:** a Discourse **theme** (full theme, not a component) that applies the Askara brand to the community hub at `community.askara.solutions` (Communiteq-hosted, Starter tier), and is set as the site's default theme.
- **Part of:** the CX Minimal Viable Community project — Linear team **Business Development**, issue prefix **BDEV**. Theme work is tracked in the same Linear project as `askara-community`; this is where the deployable theme code lives (kept out of the coordination repo).
- **Config:** `.claude/askara-workflow.local.md`

## Stack

Discourse theme installed via git import (`POST /admin/themes/import` → the repo URL).

- `about.json` — `component: false` (full theme — a component does NOT register `color_schemes` on current Discourse), three named `color_schemes` (Askara Light / Dark / Parchment), and the `assets` map (SCSS var → font file).
- `common/common.scss` — `@font-face` declarations, `--font-family`/`--heading-font-family` overrides, and the phosphor hover/CTA rules.
- `assets/` — self-hosted WOFF2 fonts + their `OFL.txt` licenses.
- `.github/workflows/discourse-theme.yml` — the official `discourse/.github` reusable CI (Prettier/Stylelint/locale lint; self-skips JS/Ruby).
- **Dev loop:** `gem install discourse_theme` then `discourse_theme watch .` against a dev/test site.

## Brand source (canonical — do not re-derive)

All brand values come from **`Askara-Solutions/brand.askara.solutions`** at a **pinned commit** (`1dd6e28f23d33587a72b04b3d7e6bce204a6c2de`), never from the rendered `brand.askara.solutions` site or from memory:

- **Colours** → `docs/brand/css/brand.css` `:root` tokens.
- **Fonts** → `docs/fonts/` — IBM Plex Mono is vendored as WOFF2 as-shipped; Plus Jakarta Sans is the variable TTF converted to variable WOFF2.
- **Governance:** phosphor `#8dff35` is the brand's own `--green-hover` token → **hover / focus / CTA / logo only**. Never map it to a `color_schemes` accent, `--tertiary`, or link colour.

The full translation record + rationale lives in `askara-community` `configuration/theming-brand-application.md`. When bumping the pin, re-verify the tokens/fonts against the new SHA.

## Rules

Same discipline as `askara-community`:

- **Main branch:** protected — a GitHub ruleset ("Protect main") requires a PR; the `askara-workflow` plugin's `branch-protection.sh` also hard-blocks direct edits on `main`.
- **Feature work:** must happen inside an isolated git worktree — `.claude/hooks/enforce-worktree-isolation.sh` hard-blocks edits to a feature branch checked out directly in the primary checkout.
- **Branch format:** `<type>/bdev-<id>-<description>` — warning only.
- **Commit format:** `<type>(<scope>)?: description (BDEV-NNN)` — **enforced**: the plugin's `commit-validation.sh` is wired into `hooks.json` in the current plugin (v1.23.0) and can block a non-conforming message.
- **PR title:** same format — **not enforced today**: `pr-validation.sh` exists but is not wired into `hooks.json`.
- **Valid types:** feat, fix, docs, persona, ci, refactor, test, chore, style, perf, revert (mirrored in `.claude/askara-workflow.local.md` `commit_types` — keep both in sync).
- **Linear auto-close:** PR body must include `Closes BDEV-NNN`.

## Workflow

Create/pick a Linear issue → feature branch off `main` → isolate into a worktree → commit → PR (`Closes BDEV-NNN`) → merge → clean up. Same as `askara-community`.

## Install & verify

Run **from the `askara-community` checkout**, which holds the Discourse credentials (`.env.discourse`) and the harness (`scripts/verify-theme-install.sh`):

- Import: `POST /admin/themes/import` with `remote=https://github.com/Askara-Solutions/askara-discourse-theme`.
- Verify: `scripts/verify-theme-install.sh --git-remote https://github.com/Askara-Solutions/askara-discourse-theme`.
- Logos/favicon/OG are **site settings**, uploaded separately — never add them as theme uploads (a git update wipes non-repo uploads).
