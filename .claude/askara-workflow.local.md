---
linear_team: Business Development
linear_project: "CX: Minimal Viable Community — Scaffolding for Our Initial Personas"
issue_prefix: BDEV
base_branch: main
branch_pattern: "<type>/bdev-<id>-<description>"
protected_branches: [main]
commit_types: [feat, fix, docs, persona, ci, refactor, test, chore, style, perf, revert]
# branch_pattern and commit_types above must stay in sync with CLAUDE.md § Rules — the plugin's
# hooks parse these two values with a naive grep/sed, not a YAML parser, so DO NOT add a trailing
# inline comment on either line: it gets captured as literal pattern/type text and breaks matching.
---
