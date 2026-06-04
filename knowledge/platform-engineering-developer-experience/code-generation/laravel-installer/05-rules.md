# Rules: Laravel Installer

## Metadata
- **Source KU:** laravel-installer
- **Subdomain:** Code Generation
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- INSTALL-RULE-001: **Keep the installer updated** — `composer global update laravel/installer` for latest features and Laravel versions.
- INSTALL-RULE-002: **Use `--no-interaction` in CI** — Automation must never hang on prompts; pass all flags explicitly.
- INSTALL-RULE-003: **Check PHP version** — Ensure system PHP meets Laravel version requirements (8.2+ for Laravel 11+).
- INSTALL-RULE-004: **Use custom templates for teams** — `--using=org/laravel-template` standardizes project structure.
- INSTALL-RULE-005: **Prefer SQLite for development** — Simplest setup; switch to MySQL/PostgreSQL for production.

## Architecture Rules
- INSTALL-RULE-006: **Install globally via Composer** — `composer global require laravel/installer`.
- INSTALL-RULE-007: **Use `--no-starterkit`** for API-only projects with minimal installation.
- INSTALL-RULE-008: **Custom templates on GitHub** should follow Laravel skeleton structure.
- INSTALL-RULE-009: **Create fresh projects only** — Never run over existing codebases.

## Decision Rules
- INSTALL-RULE-010: **Use for every new Laravel project** — Fastest path from terminal to new project.
- INSTALL-RULE-011: **Use `composer create-project`** for micro-services within a monorepo.
- INSTALL-RULE-012: **Don't use on existing projects** — The installer creates new projects only.
