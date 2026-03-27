FROM node:20-bookworm-slim

# ── System deps ──────────────────────────────────────────────────
RUN apt-get update && apt-get install -y \
    git curl jq bash openssh-client sudo ripgrep \
    python3 python3-pip python3-venv \
    build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# ── Claude Code ──────────────────────────────────────────────────
RUN npm install -g @anthropic-ai/claude-code

# ── Non-root user (reuse the existing 'node' user from the base image) ──
ARG USERNAME=node

RUN echo "$USERNAME ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers \
    && usermod -s /bin/bash $USERNAME

# ── Persistent directories ───────────────────────────────────────
RUN mkdir -p /home/$USERNAME/.claude \
             /home/$USERNAME/.local/share/claude \
    && chown -R $USERNAME:$USERNAME /home/$USERNAME

RUN mkdir -p /workspace && chown $USERNAME:$USERNAME /workspace
WORKDIR /workspace

# ── Entrypoint script ────────────────────────────────────────────
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

USER $USERNAME

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["bash"]