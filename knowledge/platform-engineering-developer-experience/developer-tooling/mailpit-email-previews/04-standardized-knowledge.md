# 04-Standardized Knowledge: Mailpit Email Previews

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | developer-tooling-debugging |
| **Knowledge Unit** | mailpit-email-previews |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | laravel-sail, mail-services, log-viewer-debugging-patterns |
| **Framework/Language** | Mailpit, Laravel, Mail, Docker |

## Overview

Mailpit is a lightweight email testing tool for development that captures outbound emails and displays them in a web UI. Acts as an SMTP server accepting all emails without sending them. Features: web UI for HTML/plain-text preview, attachment previews, source code view, recipient info, REST API for automated testing. Default mail service in Laravel Sail. Written in Go — single binary, no runtime dependencies. Replace MailHog (discontinued).

## Core Concepts

- **SMTP Capture**: runs SMTP server on port 1025, stores emails in embedded database (BoltDB)
- **Web UI**: port 8025 for viewing captured emails — inbox, detail (HTML, text, raw source), attachment download
- **API Endpoints**: REST API for programmatic access: `GET /api/v1/messages`, `DELETE /api/v1/messages`
- **Laravel Integration**: `MAIL_MAILER=smtp`, `MAIL_HOST=0.0.0.0`, `MAIL_PORT=1025` routes all mail through Mailpit
- **Automatic Pruning**: configurable max messages, max age, max storage size

## When to Use

- Local development email testing
- Automated email testing in CI (via API assertions)
- Transactional email design iteration
- Integration testing of mailables, notifications, and mail-sending code

## When NOT to Use

- Production (captures emails without sending them)
- When real email delivery needs verification (send a test through actual provider)
- High-volume email testing beyond 500 messages (prune or increase limits)

## Best Practices (WHY)

- **Environment-specific config**: Mailpit in `.env` for local; real driver (SES, Mailgun) in production
- **Use API for test assertions**: `GET /api/v1/messages` to verify email sends in automated tests
- **Preview all mailables**: iterate on HTML email rendering before committing
- **Run alongside Sail**: Mailpit is pre-configured in `docker-compose.yml` — just set env vars
- **Clear before testing**: API `DELETE /api/v1/messages` to start fresh for each test run

## Architecture Guidelines

- Configure via environment variables in `.env` for local development
- Run as Docker service (Sail default) or standalone binary for non-Docker projects
- Mailpit's API is compatible with MailHog's API in most cases
- Default 500-message limit prevents unbounded storage

## Performance Considerations

- SMTP overhead: 5-20ms per email (SMTP conversation, parsing, storage)
- Storage: 5-50KB per email incl. attachments; 500-message limit = <25MB
- API response: <10ms for typical queries
- Web UI: smooth up to 10,000 messages

## Security Considerations

- Development only — never deploy Mailpit in production
- Captured emails may contain sensitive data (PII, tokens, links); secure access to web UI
- Default ports: 1025 (SMTP), 8025 (HTTP); ensure no port conflicts

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|-----------------|
| Production Mailpit config | Email never delivered | Silent email failure | Environment-specific .env |
| Mailpit not running | No emails captured | App appears to work, no emails in UI | Start Sail/sail up |
| Sole reliance on Mailpit | Different rendering than Gmail/Outlook | Broken emails in production | Test with real provider before deploy |
| Not using API for tests | Manual UI checking | No automation | Use REST API assertions |
| Port conflicts | Another service on 1025/8025 | Mailpit fails to start | Check port availability |

## Anti-Patterns

- **Mailpit as production mail server**: captures all mail without delivery — development only
- **Ignoring Mailpit in automated tests**: missing email send verification in CI

## Examples

```bash
# .env for local Mailpit
MAIL_MAILER=smtp
MAIL_HOST=0.0.0.0
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
```

## Related Topics

- laravel-sail — Sail's Mailpit integration
- mail-services — production mail configuration
- log-viewer-debugging-patterns — log-based debugging approach

## AI Agent Notes

- Include Mailpit configuration in `.env.example` when scaffolding new Laravel projects
- Configure Mailpit as CI service for email testing pipelines

## Verification

- [ ] Mailpit configured in `.env` for local development
- [ ] Production `.env` uses real mail driver
- [ ] Mailpit service running (Sail or Docker)
- [ ] Web UI accessible at localhost:8025
- [ ] API used in test assertions for email verification
- [ ] Ports 1025/8025 available
