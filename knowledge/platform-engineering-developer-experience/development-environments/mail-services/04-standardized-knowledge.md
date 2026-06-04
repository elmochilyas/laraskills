# 04-Standardized Knowledge: Mail Services

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | development-environments |
| **Knowledge Unit** | mail-services |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | mailpit-email-previews, laravel-sail, docker-compose-for-laravel |
| **Framework/Language** | Mailpit, MailHog, SMTP, Laravel Mail, Docker |

## Overview

Mail services in Laravel dev environments capture outgoing emails during development, preventing accidental delivery to real recipients. Sail's default is Mailpit (SMTP server on port 1025, web UI on port 8025). Laravel config uses SMTP driver pointing to Mailpit host:port. Handles mailables, notifications (mail channel), raw Mail facade sends. Alternative: Mailtrap (cloud-based).

## Core Concepts

- **Mailpit**: default Sail mail service; SMTP capture, web UI, REST API
- **SMTP Capture**: accepts all mail without forwarding; stored in internal database
- **Mail Driver Config**: `config/mail.php` with 'driver' => 'smtp' pointing to Mailpit host/port
- **Mailable Preview**: view rendered HTML/plain-text emails in Mailpit web UI
- **Notification Mail Preview**: mail channel notifications captured by Mailpit
- **Sail Service**: Mailpit in `docker-compose.yml` with SMTP (1025) and HTTP (8025) ports
- **Mailtrap**: cloud-based alternative with team collaboration features

## When to Use

- Local development email testing
- Automated email testing in CI (via Mailpit API)
- Mailable template design iteration
- Notification email preview

## When NOT to Use

- Production (emails are captured, never delivered)
- When real email delivery needs end-to-end verification
- Teams needing shared email previews (use Mailtrap instead)

## Best Practices (WHY)

- **Environment-specific mail config**: Mailpit in dev .env, real driver (SES/Mailgun) in production
- **Preview mailables**: iterate on HTML email rendering before committing
- **Use Mailpit API in tests**: `GET /api/v1/messages` for email send assertions
- **Clear between test runs**: `DELETE /api/v1/messages` via API for fresh state
- **Start mail service**: ensure Mailpit container is running (part of `sail up`)

## Architecture Guidelines

- Configure in `.env` per environment: SMTP for dev, SES/Mailgun for production
- Sail includes Mailpit in docker-compose.yml by default
- Each developer has their own Mailpit instance (part of Sail)
- For team collaboration, consider shared Mailtrap inbox

## Performance Considerations

- SMTP overhead: 10-50ms per email
- Memory: <50MB with 500 message limit
- Web UI: instant load for <1000 messages
- API: <10ms response for typical queries

## Security Considerations

- Development only — never in production
- No authentication on SMTP/HTTP endpoints (local-only access)
- Captured emails may contain sensitive data
- Run only on localhost or internal networks

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|-----------------|
| Mailpit config in production | Emails never sent | Delivery failures | Environment-specific .env |
| Not starting mail service | Connection refused | Silent email failures | Include in docker-compose |
| Sole Mailpit testing | Rendering differs from Gmail/Outlook | Broken emails in production | Test with real driver before deploy |
| Not clearing between tests | Stale emails in assertions | Flaky tests | Delete via API between runs |

## Anti-Patterns

- **Mailpit as production email server**: captures mail without delivery
- **Skipping production email verification**: Mailpit renders differently than real clients

## Examples

```env
# .env for Mailpit (development)
MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
```

## Related Topics

- mailpit-email-previews — Mailpit detailed usage
- laravel-sail — Sail's Mailpit integration
- docker-compose-for-laravel — Mailpit Docker service

## AI Agent Notes

- Default to Mailpit config in .env.example when scaffolding
- Include Mailpit as CI service for email testing

## Verification

- [ ] Mailpit service running (sail up)
- [ ] .env points to Mailpit in development
- [ ] Production .env uses real mail driver
- [ ] Web UI accessible at localhost:8025
- [ ] API used in test assertions
- [ ] Mailable templates verified in Mailpit
