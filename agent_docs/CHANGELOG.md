# agent_docs Changelog

Append-only. One dated entry per rule change to `CLAUDE.md` or `agent_docs/*` — a one-line heading
(`## [date] type | summary`) plus as much explanation as the change actually needs. Never edit past
entries — if an entry turns out wrong, add a new one correcting it, don't rewrite history.

Trigger: [CLAUDE.md § Rules](../CLAUDE.md).

## [2026-08-13] chore | Repo bootstrap (BDEV-210)

Created `askara-discourse-theme` as a public standalone repo for the Askara Discourse theme
component. Mirrored askara-community's workflow discipline (`.claude/` isolation hook +
`askara-workflow` plugin, `CLAUDE.md` § Rules, PR template, `.gitignore`) and added the Discourse
theme scaffold (`about.json`, `common/common.scss`, `assets/` fonts, official CI). Brand values are
sourced from `Askara-Solutions/brand.askara.solutions` at a pinned commit — see CLAUDE.md § Brand
source. Corrected the commit/PR enforcement wording carried over from askara-community's (stale)
CLAUDE.md: in askara-workflow plugin v1.23.0 `commit-validation.sh` **is** wired (enforced);
`pr-validation.sh` is **not**.
