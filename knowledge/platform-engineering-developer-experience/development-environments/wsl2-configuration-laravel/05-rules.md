# Rules: WSL2 Configuration for Laravel

## Metadata
- **Source KU:** wsl2-configuration-laravel
- **Subdomain:** Development Environments
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- WSL-RULE-001: **Store projects in WSL2 ext4 filesystem** — `~/projects/` not `/mnt/c/Users/` — 3-5x faster Docker I/O.
- WSL-RULE-002: **Configure .wslconfig** — Set memory limit (4-8GB) to prevent VM consuming all RAM.
- WSL-RULE-003: **Use VS Code Remote - WSL** — Edit files through WSL2; avoids permission/line-ending issues.
- WSL-RULE-004: **Use Windows Terminal** — Auto-detects WSL2 distros; Ubuntu as default profile.
- WSL-RULE-005: **Use Sail inside WSL2** — Don't install PHP natively; maintain environment consistency.
- WSL-RULE-006: **Shutdown WSL2 when not in use** — `wsl --shutdown` frees memory.

## Decision Rules
- WSL-RULE-007: **Use for Laravel development on Windows** with Sail/Docker.
- WSL-RULE-008: **Not applicable for native Linux or macOS** — WSL2 is Windows-specific.
