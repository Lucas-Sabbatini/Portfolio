# Claude Code Docker — Isolated Multi-Session Setup

Run multiple Claude Code instances from the same image, each with **its own filesystem**, sharing **authentication** and **SSH keys**.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        HOST MACHINE                             │
│                                                                 │
│  ~/.ssh/  ──(read-only mount)──►  all containers               │
│                                                                 │
│  Docker volumes:                                                │
│  ┌──────────────────────┐   shared across sessions              │
│  │ claude-config-shared  │──► ~/.claude        (auth tokens)    │
│  │ claude-data-shared    │──► ~/.local/share   (session data)   │
│  └──────────────────────┘                                       │
│                                                                 │
│  ┌────────────────────────────┐  ┌─────────────────────────┐   │
│  │ claude-workspace-backend   │  │ claude-workspace-frontend│   │
│  │   /workspace (own clone)   │  │  /workspace (own clone)  │   │
│  │   branch: feature/backend  │  │  branch: main            │   │
│  └────────────────────────────┘  └─────────────────────────┘   │
│       container A                       container B             │
└─────────────────────────────────────────────────────────────────┘
```

**Key insight**: each container gets a **named Docker volume** for `/workspace`. The entrypoint `git clone`s the repo into that volume on first run. Since each volume is independent, switching branches in one container doesn't affect the other.

## Quick Start

```bash
# 1. Build the image once
docker build -t claude-code:latest .

# 2. Set your identity (add to ~/.bashrc for persistence)
export GIT_USER_NAME="Lucas Janot"
export GIT_USER_EMAIL="lucas@janot.dev"

# 3. Launch isolated sessions
./claude-run.sh blog-backend  git@github.com:lucass/blog.git feature/backend
./claude-run.sh blog-frontend git@github.com:lucass/blog.git main
./claude-run.sh playground    # empty workspace
```

Each session:
- Has its **own filesystem** (won't see branch changes from other sessions)
- **Shares Claude auth** (authenticate once, all sessions use it)
- Can **git push via SSH** using your host keys
- Commits as **your name/email** (not "claude@bot")
- Starts with **`--dangerously-skip-permissions`** pre-configured

## Managing Sessions

```bash
# List everything
./claude-manage.sh list

# Open a second shell into a running session
./claude-manage.sh shell blog-backend

# Delete a session's workspace (keeps auth)
./claude-manage.sh rm blog-backend

# Delete ALL workspaces
./claude-manage.sh rm-all

# Force re-authentication
./claude-manage.sh reset-auth
```

## How Each Problem Is Solved

### Problem: Shared filesystem between containers
**Before**: `-v ~/Documents/blog:/workspace` means all containers point at the same directory. `git checkout` in one affects all.

**After**: Each session gets a **named Docker volume** (`claude-workspace-<name>`). The entrypoint clones the repo fresh into the volume. Volumes are independent — no cross-contamination.

### Problem: Re-authenticating every time
**Before**: `~/.claude` lives inside the ephemeral container. Gone on restart.

**After**: Two **shared named volumes** persist Claude's config:
- `claude-config-shared` → `~/.claude` (auth tokens, settings, permissions)
- `claude-data-shared` → `~/.local/share/claude` (session history)

Authenticate once. All containers (current and future) pick it up.

### Problem: Can't push via SSH
**Before**: No SSH keys in the container.

**After**: Your host `~/.ssh` is bind-mounted **read-only** to a staging directory. The entrypoint **copies** the keys (so permissions can be fixed) and auto-adds `github.com` to `known_hosts`.

### Problem: Commits as wrong user
**Before**: Hardcoded `git config --global` in the Dockerfile.

**After**: `GIT_USER_NAME` and `GIT_USER_EMAIL` are passed as env vars and applied at container startup by the entrypoint.

## File Overview

| File | Purpose |
|---|---|
| `Dockerfile` | Image with Node 20, Python 3, Claude Code, SSH, sudo |
| `entrypoint.sh` | Configures git, SSH, clones repo, writes default permissions |
| `claude-run.sh` | Launcher script — one command to start an isolated session |
| `claude-manage.sh` | List, inspect, clean up sessions and volumes |

## Customization

### Change resource limits
Edit `claude-run.sh`:
```bash
--cpus=4        # CPU cores
--memory=8g     # RAM
```

### Add Python packages to the image
Add to the `Dockerfile` after the `apt-get` line:
```dockerfile
RUN pip install --break-system-packages \
    fastapi uvicorn asyncpg supabase pydantic-settings \
    python-jose[cryptography] passlib[bcrypt] resend httpx \
    pytest pytest-asyncio pytest-mock python-multipart
```

### Use API key instead of OAuth
```bash
export ANTHROPIC_API_KEY="sk-ant-..."
./claude-run.sh my-session git@github.com:user/repo.git
```

### Expose ports (dev servers)
Add to `claude-run.sh` DOCKER_ARGS:
```bash
-p 8000:8000    # backend
-p 5173:5173    # vite frontend
-p 3000:3000    # umami
```
