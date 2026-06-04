# Knowledge Unit: Mailpit Email Previews

## Metadata
- **Subdomain:** Developer Tooling & Debugging
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** developer-tooling-debugging/mailpit-email-previews
- **Maturity:** Mature
- **Related Technologies:** Mailpit, Laravel, Mail, SMTP, Docker, Sail

## Executive Summary

Mailpit is a lightweight email testing tool for development environments that captures emails sent by the application and displays them in a web UI for preview. It acts as an SMTP server that accepts all emails without sending them, storing them for inspection. Mailpit features: a web UI for viewing HTML and plain-text email content, attachment previews, source code view, recipient/from/CC/BCC information, and a REST API for automated testing. It's the default mail service in Laravel Sail and is also installable standalone. Mailpit replaces older tools like MailHog (discontinued) and provides better performance, a modern UI, and Docker-native operation.

## Core Concepts

- **SMTP Capture:** Mailpit runs an SMTP server on port 1025 that accepts emails; it stores them in an internal database without forwarding
- **Web UI:** A web interface on port 8025 for viewing captured emails: inbox view, email detail (HTML, text, raw source), attachment download
- **API Endpoints:** REST API for programmatic access: `GET /api/v1/messages` lists emails, `GET /api/v1/message/{id}` shows details, `DELETE /api/v1/messages` clears all
- **Message Storage:** Emails are stored in an embedded database (BoltDB) with configurable retention and size limits
- **Laravel Integration:** Configure `MAIL_MAILER=smtp`, `MAIL_HOST=0.0.0.0`, `MAIL_PORT=1025` in .env to send all emails through Mailpit
- **HTML Rendering:** Mailpit renders HTML emails in its web UI using iframe isolation, preventing scripts from executing

## Mental Models

- **Mailpit as Fake SMTP Server:** Mailpit is like a test SMTP server—it receives and stores emails but never delivers them, acting as a firewall between your app and real email
- **Mailpit as Email Preview Tool:** Like a print preview for emails—you design an email notification, send it through Mailpit, and preview exactly how it will look
- **Mailpit as Debugging Proxy:** Mailpit intercepts all outbound email traffic during development, allowing you to verify that emails are sent correctly (right recipients, right content, right attachments)

## Internal Mechanics

1. **SMTP Server:** Mailpit runs a full SMTP server implementing the SMTP protocol (RFC 5321); it accepts connections on port 1025, receives email data, and acknowledges receipt
2. **Email Parsing:** Received emails are parsed (MIME headers, body, attachments, inline images) and stored in the embedded database
3. **Web Server:** A built-in HTTP server serves the React-based web UI and REST API on port 8025
4. **Message Retention:** Old messages are automatically pruned based on configurable limits (max messages, max age, max storage size)
5. **Laravel Mail Configuration:** When `MAIL_MAILER=smtp` with Mailpit's host/port, Laravel's `Mail` facade and `mail` helper send emails through Mailpit's SMTP server

## Patterns

- **Email Testing Pattern:** Configure Laravel to use Mailpit in development/test environments. All mailables, notifications, and raw mail sends are captured. Verify emails in Mailpit's web UI.
- **Automated Email Testing Pattern:** In `phpunit.xml`, set `MAIL_MAILER=smtp` and `MAIL_HOST=mailpit` with Dusk/Sail. Assert emails were sent via Mailpit's API after tests.
- **Notification Preview Pattern:** Trigger notifications (welcome email, password reset, invoice) during development; preview rendered HTML in Mailpit.
- **Transaction Email Design Pattern:** Design and iterate on transactional emails locally using Mailpit's HTML preview. Send test emails, view in Mailpit, adjust template, repeat.
- **Mailpit in CI Pattern:** Run Mailpit as a service container in CI (Docker Compose or GitHub Actions service). Tests send emails through Mailpit; assertions check Mailpit API for sent emails.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Email tool | Mailpit vs MailHog vs Mailtrap vs HELO | Mailpit (modern, maintained, Sail-integrated) |
| Installation | Sail service vs Docker vs standalone | Sail service (simplest); Docker for non-Sail projects; standalone for local dev |
| Storage limits | Unlimited vs max messages vs max size | Max 500 messages (default); adjust for high-volume email testing |
| Web UI access | Direct port vs reverse proxy vs authenticated | Direct port (localhost:8025); reverse proxy for team accessibility |

## Tradeoffs

- **Mailpit vs Mailtrap:** Mailpit is free, self-hosted, and runs locally with no request limits. Mailtrap is a paid cloud service with a web UI that works anywhere but has sending limits and requires internet access.
- **SMTP vs Mail Facade Mocking:** Using Mailpit tests the actual email sending pipeline (mailables, views, attachments). Using `Mail::fake()` in tests is faster but doesn't verify HTML rendering or attachment handling.
- **Docker vs Standalone:** Docker (Sail) is convenient for Laravel developers but requires Docker. Standalone binary works anywhere but needs manual configuration.

## Performance Considerations

- **SMTP Overhead:** Mailpit adds 5-20ms per email sent (SMTP conversation, parsing, storage). This is negligible for development and test environments.
- **Storage:** Each email takes ~5-50KB of storage depending on attachments. With default 500-message limit, storage stays under 25MB.
- **Web UI Performance:** The Mailpit web UI handles up to 10,000 messages smoothly. Beyond that, UI responsiveness decreases. Use pruning to keep the database small.
- **API Response Time:** The REST API responds in <10ms for typical queries. Message detail retrieval is proportional to email size.

## Production Considerations

- **Development Only:** Mailpit is for development and testing environments only. Never deploy Mailpit in production—it would capture and expose sensitive email data.
- **No Email Delivery:** Mailpit never delivers emails. Ensure .env is correctly configured per environment: Mailpit in local, real mail driver (SES, Mailgun, Postmark, SMTP) in production.
- **Port Conflicts:** Mailpit uses ports 1025 (SMTP) and 8025 (HTTP). Ensure these ports are not used by other services. In Sail, they're configured in `docker-compose.yml`.
- **Data Cleanup:** Mailpit stores emails in memory/disk. Before production-like testing (load testing, staging), clear Mailpit's database via API or restart to avoid stale data.

## Common Mistakes

- **Not configuring MAIL_MAILER for each environment:** Using Mailpit configuration in production .env; production email is not delivered and the application appears to send emails without errors
- **Forgetting to start Mailpit:** Checking Mailpit's web UI and seeing no emails; Mailpit service isn't running (or Sail hasn't started the mail service)
- **Relying solely on Mailpit for email testing:** Not testing with real email delivery services before production; Mailpit renders emails differently than Gmail, Outlook, etc.
- **Not testing attachments in Mailpit:** Sending emails with attachments but not verifying attachment rendering in Mailpit's web UI
- **Ignoring Mailpit's API for test assertions:** Manually checking Mailpit's UI instead of using the API in automated tests for email send assertions

## Failure Modes

- **SMTP Connection Refused:** Laravel can't connect to Mailpit's SMTP port (1025). Mitigate: verify Mailpit service is running; check docker-compose.yml port mapping.
- **Database Corruption:** Mailpit's embedded database gets corrupted on unclean shutdown. Mitigate: restart Mailpit; delete and recreate the database file.
- **Storage Full:** Mailpit reaches its message limit and stops accepting new emails (silently or with error). Mitigate: increase limit; prune old messages; monitor storage.
- **Port Conflict:** Another service on port 1025 (SMTP) or 8025 (HTTP) prevents Mailpit from starting. Mitigate: change Mailpit's ports in configuration.

## Ecosystem Usage

- **Laravel Sail:** Mailpit is the default mail service in Sail (configured in `docker-compose.yml` as `mailpit` service)
- **Laravel Documentation:** Laravel's mail documentation references Mailpit as the recommended local email testing tool
- **Laravel Testing:** Teams use Mailpit with Dusk and Pest/PHPUnit for email send verification and content testing
- **Laravel Development:** Individual developers use Mailpit to preview email notifications, reset password emails, and invoices during feature development
- **Laravel Package Development:** Package developers use Mailpit to test mail-sending features of their packages

## Related Knowledge Units

- laravel-sail
- mail-services
- log-viewer-debugging-patterns
- automated-testing-in-ci

## Research Notes

- Mailpit was created as a modern replacement for MailHog, which was discontinued after its maintainer joined GitHub
- Mailpit is written in Go, providing a single binary with no runtime dependencies (no PHP, no Node.js required)
- Mailpit includes a SPA-style React web UI with TypeScript, providing real-time email preview with search and filter
- Mailpit's API is compatible with MailHog's API in most cases, making it a drop-in replacement for existing MailHog integrations
