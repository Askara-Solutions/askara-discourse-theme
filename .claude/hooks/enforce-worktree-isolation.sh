#!/usr/bin/env bash
# Worktree isolation: blocks file modifications made in the primary checkout while on a
# non-protected branch. Feature work must happen inside a linked worktree instead — see
# agent_docs/task_workflow.md for the isolate/exit sequence.
#
# This is additive to (not a replacement for) the askara-workflow plugin's branch-protection.sh,
# which already hard-blocks direct edits on protected branches (e.g. `main`). This hook covers the
# other half: don't let anyone edit a *feature* branch checked out directly in the primary
# checkout either — it must be isolated into a worktree first.
#
# Input (PreToolUse hook): Claude Code delivers the tool payload as JSON on stdin —
#   .tool_name          — the tool being invoked (Edit, Write, MultiEdit, Bash)
#   .tool_input.command — for Bash, the command string

CONFIG_FILE=".claude/askara-workflow.local.md"

# --- Read config (same naive grep/sed as branch-protection.sh — no inline comments allowed) ---
if [ -f "$CONFIG_FILE" ]; then
  PROTECTED_RAW=$(grep "^protected_branches:" "$CONFIG_FILE" \
    | sed 's/protected_branches:[[:space:]]*//' \
    | tr -d '[]' | tr ',' ' ' | tr -d '"' | tr -d "'")
else
  PROTECTED_RAW="main"
fi
if [ -z "$PROTECTED_RAW" ]; then
  PROTECTED_RAW="main"
fi

# --- Read hook input ---
if [ ! -t 0 ]; then
  HOOK_INPUT=$(cat)
fi
if [ -n "${HOOK_INPUT:-}" ]; then
  TOOL_NAME=$(printf '%s' "$HOOK_INPUT" | jq -r '.tool_name // empty' 2>/dev/null)
  TOOL_INPUT=$(printf '%s' "$HOOK_INPUT" | jq -c '.tool_input // empty' 2>/dev/null)
fi

# --- Read-only / navigation exception for Bash tool ---
# Same read-only list as branch-protection.sh, plus `checkout` and `worktree` — both needed to
# perform the isolation dance itself (moving the primary checkout back to main, creating the
# worktree for an existing branch) and neither authors new tracked content on its own.
#
# Known limitation (shared with branch-protection.sh's equally naive check): this only inspects
# the base command and, for `git`, the subcommand token — shell redirection (`echo x > file.txt`)
# or a compound command (`git status && git commit ...`) can still slip a write past it. Accepted
# as a soft/defense-in-depth guard, not a hard security boundary.
if [ "$TOOL_NAME" = "Bash" ]; then
  COMMAND=$(echo "$TOOL_INPUT" | jq -r '.command // empty' 2>/dev/null)
  if [ -n "$COMMAND" ]; then
    BASE_CMD=$(echo "$COMMAND" | sed 's/^[[:space:]]*//' | awk '{print $1}')
    case "$BASE_CMD" in
      git)
        # Skip git's global options (e.g. `-C <path>`, `-c <key>=<value>`) to find the actual
        # subcommand — a plain `awk '{print $2}'` would misread `git -C <path> checkout` as
        # subcommand `-C` and fall through to the block below.
        read -ra GIT_ARGS <<< "$COMMAND"
        IDX=1
        while [ "$IDX" -lt "${#GIT_ARGS[@]}" ]; do
          TOKEN="${GIT_ARGS[$IDX]}"
          case "$TOKEN" in
            -C|-c|--work-tree|--git-dir|--namespace)
              IDX=$((IDX + 2))
              ;;
            -*)
              IDX=$((IDX + 1))
              ;;
            *)
              break
              ;;
          esac
        done
        SUBCMD="${GIT_ARGS[$IDX]:-}"
        case "$SUBCMD" in
          status|log|diff|show|branch|remote|tag|ls-remote|rev-parse|rev-list|fetch|switch|checkout|worktree)
            exit 0
            ;;
        esac
        ;;
      ls|cat|head|tail|grep|rg|find|echo|printf|jq|wc|file|which|type|pwd|date|env|whoami|id)
        exit 0
        ;;
      bash)
        SUBCMD=$(echo "$COMMAND" | sed 's/^[[:space:]]*//' | awk '{print $2}')
        if [ "$SUBCMD" = "-n" ]; then
          exit 0
        fi
        ;;
    esac
  fi
fi

# --- Are we in the primary checkout, or a linked worktree? ---
# Per superpowers:using-git-worktrees Step 0: --git-dir differs from --git-common-dir only inside
# a linked worktree. Guard against submodules, which show the same difference but aren't a
# worktree at all.
GIT_DIR_PATH=$(cd "$(git rev-parse --git-dir 2>/dev/null)" 2>/dev/null && pwd -P)
GIT_COMMON_PATH=$(cd "$(git rev-parse --git-common-dir 2>/dev/null)" 2>/dev/null && pwd -P)
IS_SUBMODULE=$(git rev-parse --show-superproject-working-tree 2>/dev/null)

if [ -z "$GIT_DIR_PATH" ]; then
  # Not in a git repo — nothing to enforce
  exit 0
fi

IN_PRIMARY_CHECKOUT=true
if [ "$GIT_DIR_PATH" != "$GIT_COMMON_PATH" ] && [ -z "$IS_SUBMODULE" ]; then
  IN_PRIMARY_CHECKOUT=false
fi

if [ "$IN_PRIMARY_CHECKOUT" = false ]; then
  # Already isolated in a linked worktree — nothing to enforce
  exit 0
fi

# --- Get current branch ---
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)
if [ -z "$CURRENT_BRANCH" ]; then
  # Detached HEAD or not in a git repo — allow
  exit 0
fi

# --- Allow protected branches (branch-protection.sh already guards these from edits) ---
for BRANCH in $PROTECTED_RAW; do
  BRANCH=$(echo "$BRANCH" | tr -d '[:space:]')
  if [ -n "$BRANCH" ] && [ "$CURRENT_BRANCH" = "$BRANCH" ]; then
    exit 0
  fi
done

# --- Block: feature branch, primary checkout, not isolated ---
echo ""
echo "BLOCKED: '$CURRENT_BRANCH' is checked out directly in the primary checkout."
echo ""
echo "Feature work must happen inside an isolated worktree. Isolate first:"
echo "  git checkout main   # free up '$CURRENT_BRANCH' in the primary checkout"
echo "  git worktree add .claude/worktrees/<slug> $CURRENT_BRANCH"
echo "  # then use the EnterWorktree tool with path=\".claude/worktrees/<slug>\""
echo ""
echo "See agent_docs/task_workflow.md for the full sequence."
echo ""
exit 1
