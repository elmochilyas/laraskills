#!/usr/bin/env bash
# update.sh — Laravel ECC Updater for Unix (macOS/Linux)
#
# Usage:
#   ./update.sh                           # Update everything (same profile as install)
#   ./update.sh --dry-run                 # Preview changes without applying
#   ./update.sh --version                 # Show current and latest versions
#
# This script updates your Laravel ECC installation to the latest
# version. It preserves your installation profile (minimal/core/full)
# and syncs all components: skills, rules, agents, hooks, MCP configs.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${TARGET_DIR:-$(pwd)}"
STATE_FILE="$TARGET_DIR/.laravel-ecc-state.json"
DRY_RUN=false
SHOW_VERSION=false

log()  { echo -e "\033[32m[Laravel ECC]\033[0m $1"; }
warn() { echo -e "\033[33m[Laravel ECC] WARNING:\033[0m $1"; }
err()  { echo -e "\033[31m[Laravel ECC] ERROR:\033[0m $1" >&2; }

while [[ $# -gt 0 ]]; do
    case "$1" in
        --dry-run) DRY_RUN=true; shift ;;
        --version) SHOW_VERSION=true; shift ;;
        --help)    head -12 "$0"; exit 0 ;;
        *)         err "Unknown: $1"; exit 1 ;;
    esac
done

# Check installation state
if [ ! -f "$STATE_FILE" ]; then
    err "No installation found in $TARGET_DIR"
    log "Run install.sh first, or use npx laravel-ecc install"
    exit 1
fi

LOCAL_VERSION=$(jq -r '.version // "?"' "$STATE_FILE" 2>/dev/null || grep -o '"version"[^,]*' "$STATE_FILE" | cut -d'"' -f4)
PROFILE=$(jq -r '.profile // "core"' "$STATE_FILE" 2>/dev/null || echo "core")

# Read package version
NEW_VERSION=$(grep -o '"version"[^,]*' "$SCRIPT_DIR/package.json" | cut -d'"' -f4)

if [ "$SHOW_VERSION" = true ]; then
    log "Installed version: $LOCAL_VERSION"
    log "Latest package version: $NEW_VERSION"
    if [ "$LOCAL_VERSION" != "$NEW_VERSION" ]; then
        warn "Update available: $LOCAL_VERSION -> $NEW_VERSION"
    else
        log "Already at latest version!"
    fi
    exit 0
fi

log "Laravel ECC Updater v$NEW_VERSION"
log "Target: $TARGET_DIR"
log "Installed: v$LOCAL_VERSION"
log "Latest:    v$NEW_VERSION"

if [ "$DRY_RUN" = true ]; then
    warn "DRY RUN — no changes will be made"
fi

# Build update plan
UPDATES=0

sync_dir() {
    local src="$1" dest="$2" label="$3"
    if [ -d "$src" ]; then
        UPDATES=$((UPDATES + 1))
        if [ "$DRY_RUN" = false ]; then
            mkdir -p "$dest"
            cp -r "$src"/* "$dest/"
        fi
        log "  ✓ Synced $label"
    fi
}

copy_file() {
    local src="$1" dest="$2" label="$3"
    if [ -f "$src" ]; then
        UPDATES=$((UPDATES + 1))
        if [ "$DRY_RUN" = false ]; then
            mkdir -p "$(dirname "$dest")"
            cp "$src" "$dest"
        fi
        log "  ✓ Synced $label"
    fi
}

# Skills
if [ -d "$SCRIPT_DIR/skills" ]; then
    for skill_dir in "$SCRIPT_DIR/skills"/*/; do
        skill_name=$(basename "$skill_dir")
        sync_dir "$skill_dir" "$TARGET_DIR/skills/$skill_name" "skill: $skill_name"
    done
fi

# Rules
for lang in common php web laravel; do
    if [ -d "$SCRIPT_DIR/rules/$lang" ]; then
        sync_dir "$SCRIPT_DIR/rules/$lang" "$TARGET_DIR/rules/$lang" "rules: $lang"
    fi
done

# Agents
if [ -d "$SCRIPT_DIR/agents" ]; then
    mkdir -p "$TARGET_DIR/agents"
    for agent_file in "$SCRIPT_DIR/agents"/*.md; do
        agent_name=$(basename "$agent_file")
        copy_file "$agent_file" "$TARGET_DIR/agents/$agent_name" "agent: $agent_name"
    done
fi

# Hooks
sync_dir "$SCRIPT_DIR/hooks" "$TARGET_DIR/hooks" "hooks"

# MCP configs
sync_dir "$SCRIPT_DIR/mcp-configs" "$TARGET_DIR/mcp-configs" "MCP configs"

# Commands (only if full profile)
if [ "$PROFILE" = "full" ] && [ -d "$SCRIPT_DIR/commands" ]; then
    sync_dir "$SCRIPT_DIR/commands" "$TARGET_DIR/commands" "commands"
fi

# Harness configs (only if full profile)
if [ "$PROFILE" = "full" ]; then
    for config_dir in .opencode .claude .cursor .gemini .codex .vscode .zed .trae .qwen .codebuddy .kiro .github; do
        if [ -d "$SCRIPT_DIR/$config_dir" ]; then
            sync_dir "$SCRIPT_DIR/$config_dir" "$TARGET_DIR/$config_dir" "config: $config_dir"
        fi
    done
fi

if [ "$DRY_RUN" = true ]; then
    log "Dry run complete. Run without --dry-run to apply."
    exit 0
fi

if [ "$LOCAL_VERSION" = "$NEW_VERSION" ]; then
    log "Already at latest version v$NEW_VERSION. No update needed."
    exit 0
fi

# Update state file
if command -v jq &> /dev/null; then
    UPDATED_NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT%H:%M:%S 2>/dev/null || date +%Y-%m-%dT%H:%M:%S)
    jq --arg v "$NEW_VERSION" --arg t "$UPDATED_NOW" \
       '.version = $v | .updated_at = $t' \
       "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"
else
    # Use temp file for BSD/macOS sed compatibility
    sed "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"
fi

log "Update complete!"
log "$UPDATES items updated: $LOCAL_VERSION -> $NEW_VERSION"
log "Run install.sh doctor to verify."
