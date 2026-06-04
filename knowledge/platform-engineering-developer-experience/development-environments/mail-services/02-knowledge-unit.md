# Knowledge Unit: Mail Services

## Metadata
- **Subdomain:** Development Environments
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** development-environments/mail-services
- **Maturity:** Mature
- **Related Technologies:** Mailpit, MailHog, SMTP, Laravel Mail, Mailgun, Postmark, SES

## Executive Summary

Mail services in Laravel development environments capture outgoing emails during development and display them for preview, preventing accidental delivery to real recipients. The default mail service in Sail is Mailpit, which acts as an SMTP server (port 1025) and provides a web UI (port 8025) for viewing captured emails. Laravel's mail configuration (config/mail.php) uses SMTP driver pointing to Mailpit's host:port. The mail service handles: mailables (Mailable classes), notifications (via mail channel), and raw mail sends (Mail facade). Alternative services include MailHog (predecessor to Mailpit) and cloud-based testing services (Mailtrap). The mail service is configured as part of the development Docker stack and runs in its own container.

## Core Concepts

- **Mailpit:** Default mail service in Sail; captures all outgoing emails, displays them in a web UI, and provides a REST API for programmatic access
- **SMTP Capture:** The mail service runs an SMTP server that accepts all incoming mail without forwarding; stored emails are viewable in the web UI
- **Mail Driver Configuration:** config/mail.php with 'driver' => 'smtp' pointing to mail service host (mailpit) and port (1025)
- **Mailable Preview:** View rendered HTML and plain-text versions of emails in Mailpit's web UI, including attachments and inline images
- **Notification Mail Preview:** Notifications sent via the mail channel are captured by Mailpit, showing the notification's rendered templates
- **Mailtrap:** Alternative cloud-based email testing service; captures emails on their SMTP server and displays in their web dashboard
- **Sail Service Configuration:** Mailpit runs as a service in docker-compose.yml with SMTP (1025) and HTTP (8025) ports mapped

## Mental Models

- **Mail Service as Email Firewall:** The dev mail service blocks all outgoing emails from reaching real recipients—acts like a firewall for email during development
- **Mailpit as Email Inbox:** Mailpit's web UI functions like an email client (inbox, read, delete) but only shows emails sent by the application during development
- **Mail Service as QA Proxy:** The mail service intercepts emails between the application and the mail delivery service, acting as a QA proxy for previewing before actual sending

## Internal Mechanics

1. **SMTP Handshake:** When Laravel sends an email via the Mail facade or mail notification, it connects to Mailpit's SMTP server (host: mailpit, port: 1025) and performs the SMTP handshake (EHLO, MAIL FROM, RCPT TO, DATA)
2. **Email Capture:** Mailpit stores the received email (headers, body, attachments) in its internal database without attempting delivery to the recipients
3. **Web UI Rendering:** The stored email is accessible via Mailpit's web UI at http://localhost:8025; it parses and renders the MIME structure (HTML, plain text, headers)
4. **API Access:** Mailpit's REST API (GET /api/v1/messages, GET /api/v1/message/{id}) enables programmatic access for testing assertions
5. **Pruning:** Mailpit automatically prunes old messages based on configurable limits (default: max 500 messages or 7 days) to prevent memory growth
6. **Reset on Sail Down:** When sail down is run, the Mailpit container is removed along with all captured emails; persistent storage is not configured for Mailpit by default

## Patterns

- **Email Preview Pattern:** Trigger an email (registration confirmation, password reset, invoice) in the application during development; open Mailpit at http://localhost:8025 to preview the rendered email
- **Notification Preview Pattern:** Trigger a notification with mail channel (e.g., InvoicePaid notification with mail data); view the notification's email rendering in Mailpit
- **Mailable Iteration Pattern:** During mailable template development, send test emails repeatedly and preview changes in Mailpit after each adjustment
- **Automated Testing with Mailpit Pattern:** In tests, configure Mailpit as the mail driver and use Mailpit's API to assert emails were sent with specific content, recipients, and attachments
- **Mailtrap Team Collaboration Pattern:** For teams, use Mailtrap instead of Mailpit to share email previews across team members without requiring local access to each developer's Mailpit instance
- **Environment-Based Mail Config Pattern:**
  ```
  MAIL_MAILER=smtp       # dev/test
  MAIL_MAILER=ses        # production
  MAIL_HOST=mailpit      # dev (Docker service name)
  MAIL_HOST=smtp.gmail.com  # production
  ```
  Use .env per environment for automatic mail service selection.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Mail service | Mailpit vs MailHog vs Mailtrap vs null | Mailpit (default in Sail, actively maintained) |
| SMTP port | 1025 (default) vs 25 vs 587 | 1025 (non-privileged, no conflict with system mail) |
| Web UI port | 8025 (default) vs custom | 8025 (default); change if port conflict |
| Retention | Max messages vs max age vs size limit | Max 500 messages (default); adjust for high-volume testing |
| Persistence | Ephemeral vs persistent storage | Ephemeral for development (no stale data); persistent for CI debugging |

## Tradeoffs

- **Mailpit vs Mailtrap:** Mailpit is free, runs locally (no internet needed), and has no rate limits. Mailtrap is a paid cloud service with team collaboration features and email analysis tools. Mailpit for individual development; Mailtrap for team-based email review.
- **SMTP Capture vs Mail Facade Fake:** Mailpit captures actual SMTP traffic—it tests the real email sending pipeline (MIME construction, SMTP handshake, attachments). Mail::fake() in tests is faster but only tests that the send method was called, not the actual email content.
- **Local vs Shared Mail Service:** Each developer has their own Mailpit instance (part of Sail). For team email review, a shared Mailtrap inbox or a central Mailpit instance is needed.

## Performance Considerations

- **SMTP Overhead:** Sending an email through Mailpit adds 10-50ms (SMTP handshake + data transmission). This is negligible during development but can add up if sending bulk emails.
- **Memory Usage:** Mailpit's memory usage scales with stored message count. Default limits (500 messages) keep memory under 50MB.
- **Web UI Load:** Mailpit's web UI loads instantly for normal usage (<1000 messages). For large datasets, search and filtering may take 1-2 seconds.
- **API Response Time:** Mailpit's REST API responds in <10ms for typical queries, making it suitable for test assertions.

## Production Considerations

- **Development Only:** Mailpit is for development environments only. In production, configure real mail drivers (SES, Mailgun, Postmark, SMTP). Never run Mailpit in production.
- **Environment Configuration:** Ensure MAIL_MAILER and MAIL_HOST are correctly set per environment. A production deployment with Mailpit configuration won't deliver any emails.
- **No Authentication:** Mailpit has no authentication on its SMTP or HTTP endpoints. It should only run on localhost or internal networks, never exposed publicly.
- **Data Privacy:** Mailpit stores all sent email data locally. For compliance with data privacy regulations, ensure captured emails don't contain real PII in development.
- **CI Considerations:** In CI, run Mailpit as a service container; clear the database between test runs via Mailpit's DELETE API.

## Common Mistakes

- **Using Mailpit configuration in production:** .env with MAIL_MAILER=smtp and MAIL_HOST=mailpit in production YAML; production emails are never delivered
- **Not configuring mail per environment:** Using the same .env for local and production; emails work locally but fail in production (wrong driver, wrong host)
- **Forgetting to start the mail service:** Running Sail without the mailpit service in docker-compose.yml; emails silently fail (connection refused by SMTP server)
- **Relying solely on Mailpit for email testing:** Not testing with the actual production mail driver (SES, Mailgun) before deployment; email rendering may differ between Mailpit and the real mail service
- **Not clearing mail between tests:** Mailpit accumulates emails across test runs; test assertions for email count or content may use stale data from previous tests

## Failure Modes

- **SMTP Connection Refused:** Laravel can't connect to Mailpit (service not running, wrong host/port). Mitigate: verify docker-compose.yml; check service status.
- **Mailpit Database Corruption:** Clean shutdown of Mailpit preserves data; force kill may corrupt the database. Mitigate: restart container; use DELETE API to clear data.
- **Port Conflict:** Port 1025 (SMTP) or 8025 (HTTP) is in use. Mitigate: change ports in docker-compose.yml; check for other services using these ports.
- **Storage Full:** Mailpit reaches message limit and stops accepting new emails. Mitigate: increase limit or prune old messages via API.
- **MIME Parsing Issues:** Mailpit may not render complex MIME structures correctly (multipart alternative, embedded images, custom headers). Mitigate: test with the actual mail service for production-ready email verification.

## Ecosystem Usage

- **Laravel Sail:** Mailpit is the default and recommended mail service, pre-configured in docker-compose.yml
- **Laravel Documentation:** The mail documentation references Mailpit as the recommended local development mail capture tool
- **Laravel Forge:** Forge uses real mail drivers (SES, Postmark, Mailgun) for production; Mailpit is the local development counterpart
- **Laravel Vapor:** Mailpit provides local email testing; Vapor dispatch uses SES in production
- **Laravel Telescope/Debugbar:** Mail watchers in Telescope and Debugbar capture mail data alongside Mailpit's SMTP capture

## Related Knowledge Units

- mailpit-email-previews
- laravel-sail
- docker-compose-for-laravel
- automated-testing-in-ci

## Research Notes

- Mailpit replaced MailHog as the default Laravel mail service in Sail v1.20+ after MailHog's maintainer archived the project
- Mailpit is written in Go and distributed as a single binary, making it efficient and easy to deploy
- Mailpit supports IMAP-like features (view, delete, search) and can be configured to relay certain emails to real recipients
- Mailpit's API is largely compatible with MailHog's API, facilitating migration from MailHog
