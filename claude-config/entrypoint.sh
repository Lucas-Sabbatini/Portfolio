#!/usr/bin/env bash

echo ">>> entrypoint started"
echo ">>> USER=$(whoami) HOME=$HOME"
echo ">>> args: $@"

# ── Home dir init ──
if [ ! -f /home/node/.bashrc ]; then
  echo ">>> initializing home dir"
  cp /etc/skel/.bashrc /home/node/.bashrc 2>/dev/null
  cp /etc/skel/.profile /home/node/.profile 2>/dev/null
  mkdir -p /home/node/.local/share/claude
  mkdir -p /home/node/.claude
fi

# ── Workspace ownership ──
if [ ! -w /workspace ]; then
  echo ">>> fixing workspace ownership"
  sudo chown -R "$(id -u):$(id -g)" /workspace
fi

# ── Git identity ──
if [ -n "${GIT_USER_NAME:-}" ]; then
  git config --global user.name "$GIT_USER_NAME"
fi
if [ -n "${GIT_USER_EMAIL:-}" ]; then
  git config --global user.email "$GIT_USER_EMAIL"
fi

# ── SSH keys ──
if [ -d /tmp/.ssh-host ]; then
  echo ">>> copying SSH keys"
  mkdir -p /home/node/.ssh
  cp /tmp/.ssh-host/* /home/node/.ssh/ 2>/dev/null
  chmod 700 /home/node/.ssh 2>/dev/null
  chmod 600 /home/node/.ssh/id_* 2>/dev/null
  chmod 644 /home/node/.ssh/*.pub 2>/dev/null
  ssh-keyscan -t ed25519,rsa github.com >> /home/node/.ssh/known_hosts 2>/dev/null
fi

# ── Clone repo ──
if [ -n "${REPO_URL:-}" ] && [ ! -d /workspace/.git ]; then
  if [ -n "${REPO_BRANCH:-}" ]; then
    echo "🔄 Cloning $REPO_URL (branch: $REPO_BRANCH) into /workspace..."
    git clone -b "$REPO_BRANCH" "$REPO_URL" /workspace
  else
    echo "🔄 Cloning $REPO_URL into /workspace..."
    git clone "$REPO_URL" /workspace
  fi
fi

cd /workspace

# ── Claude credentials restore ──
if [ ! -f /home/node/.claude.json ]; then
  BACKUP=$(ls -t /home/node/.claude/backups/.claude.json.backup.* 2>/dev/null | head -1)
  if [ -n "$BACKUP" ]; then
    echo "🔑 Restoring Claude credentials from backup..."
    cp "$BACKUP" /home/node/.claude.json
  fi
fi

# ── Claude permissions ──
SETTINGS_FILE="/home/node/.claude/settings.json"
if [ ! -f "$SETTINGS_FILE" ]; then
  mkdir -p /home/node/.claude
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
  echo "✅ Default Claude permissions written"
fi

echo ">>> about to exec: $@"
echo ">>> which claude: $(which claude 2>&1)"
echo ">>> node version: $(node --version 2>&1)"

exec "$@"