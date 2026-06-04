# Skill: Configure Mail Services in Laravel Dev

## Purpose
Set up Mailpit (or Mailtrap) in Laravel development environments to capture outgoing emails during development, preventing accidental delivery to real recipients while enabling email preview and testing.

## When To Use
- Local development email testing
- Automated email assertions in CI (via Mailpit API)
- Mailable and notification design iteration

## When NOT To Use
- Production (Mailpit captures emails without sending them)
- When real email delivery needs verification (send test through actual provider)
- When shared team email previews are needed (use Mailtrap)

## Prerequisites
- Laravel Sail (Mailpit included) or Docker Compose with Mailpit service
- `config/mail.php` configured

## Inputs
- `.env` — mail driver configuration
- `config/mail.php` — mailer settings

## Workflow

1. **Verify Mailpit Service:** Ensure Mailpit is running as a Docker container. In Sail, it's included by default. For custom Docker Compose, add `axllent/mailpit` image on ports 1025 (SMTP) and 8025 (web UI).

2. **Configure Laravel:** Set `.env` mail configuration: `MAIL_MAILER=smtp`, `MAIL_HOST=mailpit` (container service name), `MAIL_PORT=1025`. No authentication needed for Mailpit.

3. **Send Test Email:** Use `Mail::send()`, a Mailable, or a Notification to trigger an email. Verify it appears in the Mailpit web UI at `http://localhost:8025`.

4. **Preview and Iterate:** In Mailpit UI, review HTML rendering, plain-text version, attachment previews, and raw source. Iterate on email design.

5. **Automate CI Testing:** Use Mailpit's REST API: `GET /api/v1/messages` to check email was sent, inspect recipients and content. `DELETE /api/v1/messages` to clean up between test runs.

6. **Environment-Specific Config:** Keep Mailpit config in development `.env`. Production `.env` uses the real mail driver (SES, Mailgun, Postmark, SMTP).

## Validation Checklist

- [ ] Mailpit accessible on port 1025 (SMTP) and 8025 (Web UI)
- [ ] Emails sent from Laravel appear in Mailpit inbox
- [ ] HTML and plain-text versions render correctly
- [ ] Attachments visible and downloadable
- [ ] CI tests use Mailpit API for email assertions
- [ ] Production `.env` uses real mail driver
- [ ] Mailpit is NOT running in production

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Mailpit not running | SMTP connection refused on port 1025 |
| Wrong mail config | Laravel uses `log` mailer instead of `smtp` |
| Mailpit config in production | Emails captured, never delivered to real recipients |
| CI tests fail | Mailpit not running as CI service; add to CI service config |

## Decision Points

- **Use Mailpit for local development** — Captures emails without sending them
- **Never use Mailpit config in production** — Emails captured, never delivered
- **Use Mailtrap for shared team email previews** when needed

## Performance/Security Considerations

- **Development-only:** Never use Mailpit/SMTP capture in production
- **Storage:** Mailpit has built-in pruning to prevent unbounded memory growth
- **CI integration:** Add Mailpit as a CI service container for email test assertions

## Related Rules

- MAIL-RULE-001: Environment-specific mail config
- MAIL-RULE-002: Preview mailables
- MAIL-RULE-003: Use Mailpit API in tests
- MAIL-RULE-004: Clear between test runs
- MAIL-RULE-005: Start mail service

## Related Skills

- Set Up Mailpit for Email Previews
- Configure Laravel Sail
- Set Up Docker Compose for Laravel

## Success Criteria

- Outbound emails are captured and viewable in Mailpit UI
- Email design iteration is fast with instant visual preview
- CI tests use Mailpit API to verify email sending
- Production mail driver is distinct from development
