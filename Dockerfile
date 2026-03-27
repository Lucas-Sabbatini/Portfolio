FROM node:20-slim

RUN apt-get update && apt-get install -y \
    git curl jq bash \
    && rm -rf /var/lib/apt/lists/*

# Install Claude Code
RUN npm install -g @anthropic-ai/claude-code

# Create non-root user (required for --dangerously-skip-permissions)
RUN useradd -m -s /bin/bash claudeuser

WORKDIR /workspace
RUN chown claudeuser:claudeuser /workspace

# Configure git identity for auto-commits
RUN git config --global user.email "claude@bot" && \
    git config --global user.name "Claude Code"

USER claudeuser

CMD ["bash"]
