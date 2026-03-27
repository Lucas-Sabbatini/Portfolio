#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════
#  claude-run — Launch isolated Claude Code containers
#
#  Usage:
#    ./claude-run.sh <session-name> [repo-url] [branch]
#
#  Examples:
#    ./claude-run.sh blog-backend git@github.com:lucass/blog.git feature/backend
#    ./claude-run.sh blog-frontend git@github.com:lucass/blog.git main
#    ./claude-run.sh playground   # empty workspace, no repo
# ═══════════════════════════════════════════════════════════════════

SESSION_NAME="${1:?Usage: claude-run.sh <session-name> [repo-url] [branch]}"
REPO_URL="${2:-}"
REPO_BRANCH="${3:-}"
IMAGE_NAME="claude-code:latest"

# ── Configuration (edit these) ───────────────────────────────────
GIT_USER_NAME="${GIT_USER_NAME:-Lucas Janot}"
GIT_USER_EMAIL="${GIT_USER_EMAIL:-lucas@janot.dev}"
SSH_KEY_DIR="${SSH_KEY_DIR:-$HOME/.ssh}"
ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-}"   # optional: only if using API key auth

# ── Build image if not exists ────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if ! docker image inspect "$IMAGE_NAME" &>/dev/null; then
  echo "📦 Building $IMAGE_NAME..."
  docker build -t "$IMAGE_NAME" \
    --build-arg USER_UID="$(id -u)" \
    --build-arg USER_GID="$(id -g)" \
    "$SCRIPT_DIR"
fi

# ── Volume names (per-session workspace, shared config) ──────────
WORKSPACE_VOL="claude-workspace-${SESSION_NAME}"
CONFIG_VOL="claude-config-shared"          # shared across ALL sessions
DATA_VOL="claude-data-shared"              # shared across ALL sessions

# ── Assemble docker run args ─────────────────────────────────────
DOCKER_ARGS=(
  docker run -it --rm
  --name "claude-${SESSION_NAME}"
  --hostname "claude-${SESSION_NAME}"

  # ── Workspace: each session gets its own named volume ──
  -v "${WORKSPACE_VOL}:/workspace"

  # ── Claude config: shared so you authenticate ONCE ──
  -v "${CONFIG_VOL}:/home/node/.claude"
  -v "${DATA_VOL}:/home/node/.local/share/claude"

  # ── SSH keys: bind-mount read-only, entrypoint copies them ──
  -v "${SSH_KEY_DIR}:/home/node/.ssh-mount:ro"

  # ── Git identity ──
  -e "GIT_USER_NAME=${GIT_USER_NAME}"
  -e "GIT_USER_EMAIL=${GIT_USER_EMAIL}"

  # ── Repo to clone ──
  -e "REPO_URL=${REPO_URL}"
  -e "REPO_BRANCH=${REPO_BRANCH}"

  # ── Resource limits ──
  --cpus=4
  --memory=8g
)

# Pass API key if set
if [[ -n "$ANTHROPIC_API_KEY" ]]; then
  DOCKER_ARGS+=(-e "ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}")
fi

# ── Launch ───────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Claude Code — session: ${SESSION_NAME}"
echo "║  Workspace volume: ${WORKSPACE_VOL}"
echo "║  Config volume:    ${CONFIG_VOL} (shared)"
if [[ -n "$REPO_URL" ]]; then
echo "║  Repo: ${REPO_URL}"
echo "║  Branch: ${REPO_BRANCH:-default}"
fi
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

"${DOCKER_ARGS[@]}" "$IMAGE_NAME" bash -c '
  # Start Claude Code in dangerously-skip-permissions mode
  claude --dangerously-skip-permissions
'