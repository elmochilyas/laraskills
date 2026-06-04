# Rules: Mail Services

## Metadata
- **Source KU:** mail-services
- **Subdomain:** Development Environments
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- MAIL-RULE-001: **Environment-specific mail config** — Mailpit in dev .env, real driver (SES/Mailgun) in production.
- MAIL-RULE-002: **Preview mailables** — Iterate on HTML email rendering before committing.
- MAIL-RULE-003: **Use Mailpit API in tests** — `GET /api/v1/messages` for email send assertions.
- MAIL-RULE-004: **Clear between test runs** — `DELETE /api/v1/messages` via API for fresh state.
- MAIL-RULE-005: **Start mail service** — Ensure Mailpit container is running (part of `sail up`).

## Decision Rules
- MAIL-RULE-006: **Use Mailpit for local development** — Captures emails without sending them.
- MAIL-RULE-007: **Never use Mailpit config in production** — Emails captured, never delivered.
- MAIL-RULE-008: **Use Mailtrap for shared team email previews** when needed.
