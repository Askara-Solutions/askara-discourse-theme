# agent_docs Changelog

Append-only. One dated entry per rule change to `CLAUDE.md` or `agent_docs/*` — a one-line heading
(`## [date] type | summary`) plus as much explanation as the change actually needs. Never edit past
entries — if an entry turns out wrong, add a new one correcting it, don't rewrite history.

Trigger: [CLAUDE.md § Rules](../CLAUDE.md).

## [2026-08-17] docs | Added a pre-merge gate: CI green + Devin review addressed before any merge (BDEV-248)

Mirrors the same rule added to `askara-community` in the same issue. No PR may be merged until (a) CI is
green (`gh pr checks` all passing) and (b) Devin's automated review has posted and every issue it raised
has been addressed — replied to individually on the PR (fixed or declined), fixes pushed and CI re-run,
resolutions recorded as a comment on the Linear issue with the issue moved to **Under Review** — before
`gh pr merge --merge`. Convention only (no hook enforces it).

- `CLAUDE.md § Rules`: new **Merge gate** bullet.
- `CLAUDE.md § Workflow`: the one-line lifecycle now names the merge gate between PR and merge.

Canonical detail lives in `askara-community` (`CLAUDE.md § Rules` + `agent_docs/checklists.md § Before
Merging`); this repo carries the mirror bullet and links there. This change is one of two PRs under
BDEV-248 — this one references the issue without `Closes`, so the community PR's `Closes BDEV-248` owns
the auto-close.

## [2026-08-13] fix | Convert component -> full theme so colour palettes register (BDEV-210)

Installing the component on the live instance revealed that current Discourse (2026, post-Horizon)
does NOT register `about.json` `color_schemes` from a theme _component_ — the imported component
reported `color_schemes: []`. Discourse's own docs describing component colour schemes are stale
(last reviewed 2022). Switched `about.json` `component` to `false` (full theme) so the three brand
palettes (Askara Light / Dark / Parchment) register and one can be set as the site default. Same
fonts + SCSS + phosphor governance otherwise. A standalone hand-made "Askara brand color palette"
already on the instance (with phosphor wrongly mapped to quaternary/highlight) is to be deleted once
the theme's palettes are in.

## [2026-08-13] chore | Repo bootstrap (BDEV-210)

Created `askara-discourse-theme` as a public standalone repo for the Askara Discourse theme
component. Mirrored askara-community's workflow discipline (`.claude/` isolation hook +
`askara-workflow` plugin, `CLAUDE.md` § Rules, PR template, `.gitignore`) and added the Discourse
theme scaffold (`about.json`, `common/common.scss`, `assets/` fonts, official CI). Brand values are
sourced from `Askara-Solutions/brand.askara.solutions` at a pinned commit — see CLAUDE.md § Brand
source. Corrected the commit/PR enforcement wording carried over from askara-community's (stale)
CLAUDE.md: in askara-workflow plugin v1.23.0 `commit-validation.sh` **is** wired (enforced);
`pr-validation.sh` is **not**.
