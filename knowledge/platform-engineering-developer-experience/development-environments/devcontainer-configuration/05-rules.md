# Rules: Devcontainer Configuration

## Metadata
- **Source KU:** devcontainer-configuration
- **Subdomain:** Development Environments
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- DEVC-RULE-001: **Use Sail integration** — `sail:install --devcontainer` generates config consistent with Sail's services.
- DEVC-RULE-002: **PostCreateCommand for setup** — Keep Dockerfile minimal; install project deps in postCreate.
- DEVC-RULE-003: **Extension standardization** — Specify required VS Code extensions for consistent IDE tooling.
- DEVC-RULE-004: **Handle Codespace URLs** — `APP_URL` must include codespace hostname; use dynamic configuration.
- DEVC-RULE-005: **Use `.gitignore` for devcontainer** — Not needed in production but safe to commit.
- DEVC-RULE-006: **Lifecycle hooks** — `onCreateCommand` (once), `postCreateCommand` (after create), `postStartCommand` (every start).

## Decision Rules
- DEVC-RULE-007: **Use for teams using VS Code** wanting environment consistency.
- DEVC-RULE-008: **Use for GitHub Codespaces** for cloud-based development.
- DEVC-RULE-009: **Use Sail directly** for teams not using VS Code.
