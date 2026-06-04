# Rules: Environment File Management

## Metadata
- **Source KU:** environment-file-management
- **Subdomain:** Development Environments
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- ENV-RULE-001: **`env()` only in config files** — Application code uses `config()` — ensures config caching works.
- ENV-RULE-002: **Cache config in production** — `php artisan config:cache` resolves `env()` calls and speeds bootstrap.
- ENV-RULE-003: **Never cache in development** — Env changes need `config:clear` to take effect.
- ENV-RULE-004: **Keep .env.example updated** — Add new required variables immediately.
- ENV-RULE-005: **Validate required vars at bootstrap** — Fail early if critical env vars are missing.
- ENV-RULE-006: **Gitignore .env** — Add to `.gitignore` immediately on project creation.
- ENV-RULE-007: **Use environment-specific files** — `.env.testing` for tests, `.env.dusk.local` for Dusk.

## Decision Rules
- ENV-RULE-008: **Every Laravel project** must use `.env` for environment-specific configuration.
- ENV-RULE-009: **Never commit `.env`** to version control.
- ENV-RULE-010: **Never hard-code secrets in config files** — Always use `env()` with `.env` overrides.
