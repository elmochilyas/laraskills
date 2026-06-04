# Rules: Automated Environment Setup Scripts

## Metadata
- **Source KU:** automated-environment-setup-scripts
- **Subdomain:** Onboarding and Standards
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- AUTOSETUP-RULE-001: **Make scripts idempotent** — Use `cp -n` for .env creation, check-before-create patterns. Run script confidently even if partially completed.
- AUTOSETUP-RULE-002: **Validate prerequisites early** — Fail fast with helpful error messages. Print platform-specific install instructions.
- AUTOSETUP-RULE-003: **Provide clear progress output** — Section headers, progress indicators, time estimates.
- AUTOSETUP-RULE-004: **Include a validation step** — End by confirming app works (HTTP health check, `artisan about`, or test run).
- AUTOSETUP-RULE-005: **Use the same script in CI** — CI-verify on every PR that the script still works.

## Architecture Rules
- AUTOSETUP-RULE-006: **Script language:** Bash (universal). Makefile as wrapper for dependency-ordered targets.
- AUTOSETUP-RULE-007: **Structure:** check-deps → env-setup → deps-install → containers-up → db-setup → validate.
- AUTOSETUP-RULE-008: **Database seeding:** Default to migrate only with `--seed` option. Seed times can be long.
- AUTOSETUP-RULE-009: **Secrets management:** .env.example with placeholder values. Document where to obtain real secrets.

## Decision Rules
- AUTOSETUP-RULE-010: **Use when new team members join regularly** and setup involves error-prone multi-step process.
- AUTOSETUP-RULE-011: **Skip for single developer** with existing working environment.
- AUTOSETUP-RULE-012: **Skip for trivial setup** (git clone && composer install && php artisan serve).
