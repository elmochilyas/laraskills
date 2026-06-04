# Rules: Mailpit Email Previews

## Metadata
- **Source KU:** mailpit-email-previews
- **Subdomain:** Developer Tooling
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- MAILPIT-RULE-001: **Development-only** — Mailpit captures emails without sending them. Never use in production.
- MAILPIT-RULE-002: **Sail includes Mailpit** — Default mail service in Laravel Sail. Configure via `MAIL_MAILER=smtp`, `MAIL_PORT=1025`.
- MAILPIT-RULE-003: **Use API for CI testing** — REST API endpoints for automated email assertions: `GET /api/v1/messages`, `DELETE /api/v1/messages`.
- MAILPIT-RULE-004: **Automatic pruning** — Configure max messages, max age, max storage for development lifecycle.

## Decision Rules
- MAILPIT-RULE-005: **Use Mailpit** for local development email testing and CI automated assertions.
- MAILPIT-RULE-006: **Do NOT use** for verifying actual email delivery. Send a test through real provider.
