# Rules: Install Commands for Packages

## Metadata
- **Source KU:** install-commands-for-packages
- **Subdomain:** Package Development
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- INSTALL-RULE-001: **Install command for packages with publishable resources** — Any package with config, migrations, or assets should have a `package-name:install` command.
- INSTALL-RULE-002: **Idempotent** — Running the install command multiple times must be safe with no data loss or errors.
- INSTALL-RULE-003: **Non-interactive mode** — Must work with `--no-interaction` flag for CI/CD. All prompts must have sensible defaults.
- INSTALL-RULE-004: **Ask before overwriting** — Never silently overwrite consumer customizations. Support `--force` for automated environments.

## Architecture Rules
- INSTALL-RULE-005: **Tagged publishing** — Use `--tag=package-name-config`, `--tag=package-name-migrations` for targeted publishing, not publishing everything.
- INSTALL-RULE-006: **Progress feedback** — Use `newLine()`, `info()`, `warn()` for progress indication. Silent commands look frozen.
- INSTALL-RULE-007: **Post-install summary** — Display available commands, config keys, and next steps after installation.
- INSTALL-RULE-008: **Spatie InstallCommand** — Use Spatie tools' `->hasInstallCommand(InstallCommand::class)` which registers as `package-name:install`.

## Security Rules
- INSTALL-RULE-009: **No sensitive info in output** — Don't expose API keys or credentials in install command output or prompts.
- INSTALL-RULE-010: **No destructive operations without confirmation** — Migrations and schema changes should be confirmable or use `--force`.

## Anti-Pattern Rules
- INSTALL-RULE-011: **Avoid no install command for complex packages** — Requiring 3+ manual `vendor:publish` commands is poor DX.
- INSTALL-RULE-012: **Avoid destructive install commands** — Running migrations or modifying database without confirmation.
- INSTALL-RULE-013: **Avoid CI-ignorant commands** — Building an install command that only works in interactive terminal sessions.
