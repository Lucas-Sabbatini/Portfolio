#!/usr/bin/env bash
set -euo pipefail

# ── 0. Fix workspace ownership (needed for pre-existing root-owned volumes) ──
if [[ ! -w /workspace ]]; then
  sudo chown -R "$(id -u):$(id -g)" /workspace
fi

# ── 1. Git identity (from env vars set by docker run) ────────────
if [[ -n "${GIT_USER_NAME:-}" ]]; then
  git config --global user.name "$GIT_USER_NAME"
fi
if [[ -n "${GIT_USER_EMAIL:-}" ]]; then
  git config --global user.email "$GIT_USER_EMAIL"
fi

# ── 2. SSH key setup ─────────────────────────────────────────────
# If ~/.ssh was bind-mounted (read-only), fix permissions on a copy
if [[ -d /home/node/.ssh-mount ]]; then
  mkdir -p /home/node/.ssh
  cp /home/node/.ssh-mount/* /home/node/.ssh/ 2>/dev/null || true
  chmod 700 /home/node/.ssh
  chmod 600 /home/node/.ssh/id_* 2>/dev/null || true
  chmod 644 /home/node/.ssh/*.pub 2>/dev/null || true

  # Accept github.com host key automatically
  if ! grep -q "github.com" /home/node/.ssh/known_hosts 2>/dev/null; then
    ssh-keyscan -t ed25519,rsa github.com >> /home/node/.ssh/known_hosts 2>/dev/null || true
  fi
fi

# ── 3. Clone repo if REPO_URL is set and /workspace is empty ────
if [[ -n "${REPO_URL:-}" ]] && [[ ! -d /workspace/.git ]]; then
  echo "🔄 Cloning $REPO_URL into /workspace..."
  git clone "$REPO_URL" /workspace
  
  # Checkout a specific branch if requested
  if [[ -n "${REPO_BRANCH:-}" ]]; then
    cd /workspace
    git checkout "$REPO_BRANCH"
  fi
fi

cd /workspace

# ── 4. Claude Code permission bypass settings ────────────────────
# Pre-accept permissions so you don't have to click through every time.
# This file lives inside the persisted ~/.claude volume.
SETTINGS_DIR="/home/node/.claude"
SETTINGS_FILE="$SETTINGS_DIR/settings.json"
if [[ ! -f "$SETTINGS_FILE" ]]; then
  mkdir -p "$SETTINGS_DIR"
  cat > "$SETTINGS_FILE" << 'SETTINGS'
{
  "permissions": {
    "allow": [
      "Bash(*)",
      "Read(*)",
      "Write(*)",
      "Edit(*)",
      "WebFetch(*)",
      "mcp__*"
    ],
    "deny": []
  },
  "autoUpdatesChannel": "stable"
}
SETTINGS
  echo "✅ Default Claude permissions written to $SETTINGS_FILE"
fi

# ── 5. Execute the command ───────────────────────────────────────
exec "$@"