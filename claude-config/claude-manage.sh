#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════
#  claude-manage — List, inspect, or clean up Claude Code sessions
#
#  Usage:
#    ./claude-manage.sh list          List all session volumes + running containers
#    ./claude-manage.sh shell <name>  Open a bash shell in a running session
#    ./claude-manage.sh logs <name>   Tail logs from a running session
#    ./claude-manage.sh rm <name>     Delete a session's workspace volume
#    ./claude-manage.sh rm-all        Delete ALL workspace volumes (keeps config)
#    ./claude-manage.sh reset-auth    Delete shared config (forces re-login)
# ═══════════════════════════════════════════════════════════════════

CMD="${1:-list}"

case "$CMD" in

  list)
    echo "═══ Running containers ═══"
    docker ps --filter "name=claude-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "  (none)"
    echo ""
    echo "═══ Workspace volumes ═══"
    docker volume ls --filter "name=claude-workspace-" --format "table {{.Name}}\t{{.Driver}}" 2>/dev/null || echo "  (none)"
    echo ""
    echo "═══ Shared config volumes ═══"
    docker volume ls --filter "name=claude-config-shared" --format "table {{.Name}}" 2>/dev/null
    docker volume ls --filter "name=claude-data-shared" --format "table {{.Name}}" 2>/dev/null
    ;;

  shell)
    NAME="${2:?Usage: claude-manage.sh shell <session-name>}"
    docker exec -it "claude-${NAME}" bash
    ;;

  logs)
    NAME="${2:?Usage: claude-manage.sh logs <session-name>}"
    docker logs -f "claude-${NAME}"
    ;;

  rm)
    NAME="${2:?Usage: claude-manage.sh rm <session-name>}"
    echo "🗑  Removing workspace volume: claude-workspace-${NAME}"
    docker volume rm "claude-workspace-${NAME}" 2>/dev/null \
      && echo "   Done." \
      || echo "   Volume not found or in use."
    ;;

  rm-all)
    echo "🗑  Removing ALL workspace volumes..."
    docker volume ls --filter "name=claude-workspace-" -q | while read -r vol; do
      echo "   Removing $vol"
      docker volume rm "$vol" 2>/dev/null || echo "   (in use, skipped)"
    done
    echo "   Done. Config volumes preserved."
    ;;

  reset-auth)
    echo "🔑 Removing shared config volumes (you'll need to re-authenticate)..."
    docker volume rm claude-config-shared claude-data-shared 2>/dev/null \
      && echo "   Done." \
      || echo "   Volumes not found or in use."
    ;;

  *)
    echo "Unknown command: $CMD"
    echo "Usage: claude-manage.sh {list|shell|logs|rm|rm-all|reset-auth} [name]"
    exit 1
    ;;
esac
