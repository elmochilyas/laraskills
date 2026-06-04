# Rules: Git Hooks (CaptainHook)

## Metadata
- **Source KU:** git-hooks-captainhook
- **Subdomain:** Workflow Automation
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- CH-RULE-001: **Use pre-commit hooks for fast checks only** (<30s) — Pint on staged files, PHPStan on staged files.
- CH-RULE-002: **Use staged-files-only execution** for pre-commit — Reduces execution time by 90%+ for large projects.
- CH-RULE-003: **Add auto-installation via Composer scripts** — `post-install-cmd`, `post-update-cmd` for automatic hook install.
- CH-RULE-004: **Use CaptainHook over Husky for Laravel** — PHP-native, Composer-integrated, no Node/NPM dependency.
- CH-RULE-005: **Document the `--no-verify` skip policy** — Developers must know when bypassing hooks is acceptable.

## Architecture Rules
- CH-RULE-006: **Pre-commit:** Pint + PHPStan on staged files. **Commit-msg:** Conventional Commits format. **Pre-push:** Full test suite.
- CH-RULE-007: **Auto-install via Composer:** Register post-install-cmd and post-update-cmd scripts.
- CH-RULE-008: **Exclude hook installation from CI** — CI runs its own validation.
- CH-RULE-009: **Hook scope:** Pre-commit for fast checks (<30s); pre-push for full test suite.

## Decision Rules
- CH-RULE-010: **Use for Laravel teams** wanting to catch style/type errors before they reach CI.
- CH-RULE-011: **Skip for solo projects** where single developer controls quality without hooks.
- CH-RULE-012: **Skip when CI-only enforcement is sufficient** — Hooks add developer friction.
