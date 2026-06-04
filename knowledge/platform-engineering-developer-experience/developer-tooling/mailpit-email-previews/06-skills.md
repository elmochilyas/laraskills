# Skill: Set Up Mailpit for Email Previews

## Purpose
Configure Mailpit as a local SMTP server for capturing and previewing outbound emails during development and for automated email assertions in CI.

## When To Use
- Local development email testing
- Automated email testing in CI (via API assertions)
- Transactional email design iteration
- Integration testing of mailables, notifications, and mail-sending code

## When NOT To Use
- Production (captures emails without sending them)
- When real email delivery needs verification (send a test through actual provider)
- High-volume email testing beyond 500 messages without pruning

## Prerequisites
- Mailpit installed (included with Laravel Sail; standalone binary available)
- Docker (for Sail) or Go runtime (for standalone binary)

## Inputs
- `.env` — Mail configuration (`MAIL_MAILER`, `MAIL_HOST`, `MAIL_PORT`)
- Mailpit configuration (pruning limits, API settings)

## Workflow

1. **Verify Mailpit Availability:** If using Laravel Sail, Mailpit is the default mail service. For non-Sail projects, install the Mailpit binary or run via Docker: `docker run --name mailpit -p 1025:1025 -p 8025:8025 axllent/mailpit`.

2. **Configure Laravel:** Set `.env` mail configuration: `MAIL_MAILER=smtp`, `MAIL_HOST=localhost`, `MAIL_PORT=1025`. For Sail, these are pre-configured.

3. **Send Test Email:** Use `Mail::send()` or `Notification::route()` to trigger an email. Verify it appears in the Mailpit web UI at `http://localhost:8025`.

4. **Review Email Content:** In the Mailpit UI, check HTML rendering, plain-text version, attachment previews, and raw source. Verify recipients, subject, and body are correct.

5. **Write CI Assertions:** In test suites, use Mailpit's REST API: `GET /api/v1/messages` to check email was sent, `DELETE /api/v1/messages` to clean up between tests.

6. **Configure Pruning (Optional):** Set max messages, max age, or max storage size to prevent memory/storage exhaustion during long development sessions.

## Validation Checklist

- [ ] Mailpit SMTP accessible on port 1025
- [ ] Web UI accessible on port 8025
- [ ] Emails sent from Laravel appear in Mailpit inbox
- [ ] HTML and plain-text versions render correctly
- [ ] Attachments visible and downloadable
- [ ] CI tests can access Mailpit API for assertions

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Mailpit not running | Connection refused on port 1025 |
| Mail config wrong | Laravel uses different mailer (e.g., log) |
| High volume without pruning | Mailpit memory grows large |
| Mailpit not in CI service | CI tests fail because no SMTP server available |

## Decision Points

- **Mailpit vs real email:** Use Mailpit for development and CI; send test through real provider to verify delivery
- **Sail included:** Laravel Sail includes Mailpit by default; no extra setup needed

## Performance/Security Considerations

- **Development-only:** Never use in production — captures emails without delivering them
- **Storage limits:** Configure pruning for long sessions to prevent memory issues
- **API security:** In CI environments, restrict Mailpit API access to the testing network

## Related Rules

- MAILPIT-RULE-001: Development-only
- MAILPIT-RULE-002: Sail includes Mailpit
- MAILPIT-RULE-003: Use API for CI testing
- MAILPIT-RULE-004: Automatic pruning

## Related Skills

- Debug with Log Viewer Patterns
- Configure Laravel Sail
- Set Up Mail Services

## Success Criteria

- Outbound emails captured and viewable in Mailpit UI during development
- CI tests use Mailpit API to verify email sending
- Email design iteration is fast with instant preview
- Pruning prevents storage issues during long sessions
