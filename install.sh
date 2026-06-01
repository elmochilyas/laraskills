#!/usr/bin/env bash
# install.sh — Laravel ECC Installer for Unix (macOS/Linux)
#
# Usage:
#   ./install.sh                           # Install core profile
#   ./install.sh --profile minimal         # Skills only
#   ./install.sh --profile full            # Everything
#   ./install.sh add laravel-patterns      # Add a specific component
#   ./install.sh doctor                    # Check installation state

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${TARGET_DIR:-$(pwd)}"
PROFILE="${PROFILE:-core}"
STATE_FILE="$TARGET_DIR/.laravel-ecc-state.json"

log()  { echo -e "\033[32m[Laravel ECC]\033[0m $1"; }
warn() { echo -e "\033[33m[Laravel ECC]\033[0m $1"; }
err()  { echo -e "\033[31m[Laravel ECC] ERROR:\033[0m $1" >&2; }

detect_tools() {
    local tools=()
    [ -d "$TARGET_DIR/.opencode" ] && tools+=("opencode")
    [ -d "$TARGET_DIR/.claude" ] && tools+=("claude")
    [ -d "$TARGET_DIR/.cursor" ] && tools+=("cursor")
    [ -d "$TARGET_DIR/.gemini" ] && tools+=("gemini")
    [ -d "$TARGET_DIR/.codex" ] && tools+=("codex")
    echo "${tools[@]}"
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --profile) PROFILE="$2"; shift 2 ;;
        add)        COMPONENT="$2"; shift 2 ;;
        doctor)     DOCTOR=true; shift ;;
        *)          err "Unknown: $1"; exit 1 ;;
    esac
done

echo "Laravel ECC v1.0.0-beta.1"
echo "Target: $TARGET_DIR"
echo "Profile: $PROFILE"

TOOLS=$(detect_tools)
echo "Detected tools: $TOOLS"

if [ "${DOCTOR:-false}" = true ]; then
    if [ -f "$STATE_FILE" ]; then
        cat "$STATE_FILE"
    else
        warn "Not installed."
    fi
    exit 0
fi

if [ -n "${COMPONENT:-}" ]; then
    case "$COMPONENT" in
        laravel-patterns|laravel-tdd|laravel-security|laravel-core-internals)
            mkdir -p "$TARGET_DIR/skills"
            cp -r "$SCRIPT_DIR/skills/$COMPONENT" "$TARGET_DIR/skills/"
            log "Added: $COMPONENT"
            ;;
        laravel-artisan|laravel-eloquent|laravel-migration|laravel-container)
            mkdir -p "$TARGET_DIR/agents"
            cp "$SCRIPT_DIR/agents/${COMPONENT}.md" "$TARGET_DIR/agents/"
            log "Added: $COMPONENT"
            ;;
        *) err "Unknown: $COMPONENT Valid: laravel-patterns, laravel-tdd, laravel-security, laravel-core-internals, laravel-artisan, laravel-eloquent, laravel-migration, laravel-container"; exit 1 ;;
    esac
    exit 0
fi

log "Installing Laravel ECC..."

# Skills
mkdir -p "$TARGET_DIR/skills"
for skill in laravel-patterns laravel-tdd laravel-security laravel-core-internals; do
    cp -r "$SCRIPT_DIR/skills/$skill" "$TARGET_DIR/skills/"
    log "  ✓ Installed skill: $skill"
done

# Rules
mkdir -p "$TARGET_DIR/rules"
for lang in common php web laravel; do
    cp -r "$SCRIPT_DIR/rules/$lang" "$TARGET_DIR/rules/"
    log "  ✓ Installed rules: $lang"
done

# Agents
mkdir -p "$TARGET_DIR/agents"
for agent in laravel-artisan.md laravel-eloquent.md laravel-migration.md laravel-container.md; do
    cp "$SCRIPT_DIR/agents/$agent" "$TARGET_DIR/agents/"
done

# Full profile extras
if [ "$PROFILE" = "full" ]; then
    ECC_AGENTS="$SCRIPT_DIR/../ecc-clone/agents"
    if [ -d "$ECC_AGENTS" ]; then
        cp "$ECC_AGENTS"/*.md "$TARGET_DIR/agents/" 2>/dev/null || true
        log "  ✓ Installed all ECC agents"
    fi

    mkdir -p "$TARGET_DIR/commands"
    cp "$SCRIPT_DIR/commands"/*.md "$TARGET_DIR/commands/"
    log "  ✓ Installed commands"
fi

# Save state
cat > "$STATE_FILE" <<EOF
{
  "version": "1.0.0-beta.1",
  "target": "$TARGET_DIR",
  "installed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "profile": "$PROFILE",
  "tools": [${TOOLS// /, }],
  "components": ["laravel-patterns", "laravel-tdd", "laravel-security", "laravel-core-internals", "rules"]
}
EOF

log "Installation complete!"
log "Profile: $PROFILE"
log "State saved."
