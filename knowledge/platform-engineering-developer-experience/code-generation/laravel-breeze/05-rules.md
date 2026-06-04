# Rules: Laravel Breeze

## Metadata
- **Source KU:** laravel-breeze
- **Subdomain:** Code Generation
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- BREEZE-RULE-001: **Choose stack based on team skills** — Blade for backend teams; Livewire for interactive UIs; React/Vue for SPA.
- BREEZE-RULE-002: **Use `--dark` during install** — Adding dark mode later requires manual Tailwind variant additions.
- BREEZE-RULE-003: **Run `npm install && npm run build`** — Breeze views depend on Tailwind CSS; skipping leaves pages unstyled.
- BREEZE-RULE-004: **Enable `MustVerifyEmail`** on User model for production apps requiring verified accounts.
- BREEZE-RULE-005: **Add rate limiting** — Breeze controllers need rate limiting on login/register for production hardening.

## Architecture Rules
- BREEZE-RULE-006: **Install on fresh Laravel apps only** — Never on existing apps with custom auth.
- BREEZE-RULE-007: **Customize derived files** — Your own controllers/views, not Breeze's generated scaffolding.
- BREEZE-RULE-008: **Use Jetstream for multi-tenant apps** — Breeze has no team support.
- BREEZE-RULE-009: **Configure session driver** (Redis/Database) for production.

## Decision Rules
- BREEZE-RULE-010: **Use Breeze for most new Laravel web apps** needing auth but not teams/2FA.
- BREEZE-RULE-011: **Use Jetstream for apps needing teams, API tokens, or two-factor authentication.**
- BREEZE-RULE-012: **Don't install on existing apps** — Breeze overwrites auth files.
