# 07-Decision Trees: Mail Services

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | development-environments |
| **Knowledge Unit** | mail-services |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Mail Service Selection | Mailpit vs Mailtrap vs log driver | How do we capture and preview emails during development? |
| D02 | Environment Configuration | Which mail config per environment | Does each environment (dev, staging, prod) have different mail settings? |
| D03 | Email Testing Strategy | How to test email sending in CI | Do we assert email content and delivery in tests? |
| D04 | Mailable Preview Workflow | How to iterate on email templates | How do we preview and debug rendered mailables? |

## Architecture-Level Decision Trees

### D01: Mail Service Selection

```
START: How should we handle email in development?
│
├── Mailpit (default, recommended)
│   ├── Included in Sail by default
│   ├── SMTP capture on port 1025
│   ├── Web UI at localhost:8025
│   ├── REST API for test assertions
│   ├── Pro: local, fast, no network needed
│   ├── Pro: API for automated testing (GET /api/v1/messages)
│   └── Best for: all Laravel projects
│
├── Mailtrap (team collaboration)
│   ├── Cloud-based SMTP capture service
│   ├── Shared inbox for team email previews
│   ├── Pro: team can all see same emails
│   ├── Pro: email forwarding, spam analysis
│   ├── Con: needs internet, rate limits on free tier
│   └── Best for: distributed teams needing shared email previews
│
├── Log driver (simplest, no UI)
│   ├── Config: MAIL_MAILER=log
│   ├── Emails written to storage/logs/laravel.log
│   ├── Pro: zero setup, no service needed
│   ├── Pro: useful for debugging mail driver issues
│   ├── Con: no HTML preview, no test API
│   └── Best for: simple debugging, when Mailpit is unavailable
│
└── Production driver selection
    ├── SMTP (Mailgun, SendGrid, Postmark)
    ├── SES (Amazon Simple Email Service)
    ├── Mailgun API (via Laravel's Mailgun driver)
    └── Postmark API (via Laravel's Postmark driver)
```

### D02: Environment Configuration

```
START: What mail config should each environment use?
│
├── Development (.env)
│   ├── MAIL_MAILER=smtp
│   ├── MAIL_HOST=mailpit
│   ├── MAIL_PORT=1025
│   ├── MAIL_USERNAME=null
│   ├── MAIL_PASSWORD=null
│   └── MAIL_ENCRYPTION=null
│
├── Testing (phpunit.xml)
│   ├── MAIL_MAILER=array
│   ├── Mail::fake() in test methods
│   └── Assertions: Mail::assertSent(MailableClass::class)
│
├── Staging
│   ├── Option A: Mailpit (if staging has Docker)
│   ├── Option B: Mailtrap (shared team inbox)
│   ├── Option C: Real driver (send to team-only addresses)
│   └── Never send staging emails to real users
│
└── Production
    ├── MAIL_MAILER=smtp, ses, mailgun, postmark
    ├── Real credentials from deployment platform
    ├── Verify: emails actually deliver to real recipients
    └── Monitor: email deliverability, bounce rates
```

### D03: Email Testing Strategy

```
START: How should we test email sending?
│
├── Unit tests (Mail::fake())
│   ├── Assert email was sent: Mail::assertSent(OrderConfirmation::class)
│   ├── Assert email was sent to: ->assertSentTo($user, ...)
│   ├── Assert email count: Mail::assertSent(OrderConfirmation::class, 3)
│   └── Fast: no actual email delivery
│
├── Content assertions
│   ├── Assert subject, recipient, body content
│   ├── Mail::assertSent(OrderConfirmation::class, function ($mail) use ($order) {
│   │   return $mail->order->id === $order->id;
│   │ })
│   └── Assert specific data is present in the mailable
│
├── Integration tests (Mailpit API)
│   ├── Send real email via SMTP to Mailpit
│   ├── Assert: GET /api/v1/messages returns the sent email
│   ├── Assert: email subject, recipient, body
│   └── Slower but tests the full mail stack
│
└── CI setup
    ├── Run Mailpit as CI service
    ├── Use Mailpit API for test assertions
    └── Clear between test suites: DELETE /api/v1/messages
```

### D04: Mailable Preview Workflow

```
START: How should we preview and iterate on mailables?
│
├── Mailpit web UI (primary)
│   ├── Send email to Mailpit during development
│   ├── Open localhost:8025 in browser
│   ├── View: HTML, plain-text, headers, source
│   ├── Pro: instant preview, no code changes
│   └── Iterate: tweak template → refresh Mailpit → preview
│
├── Artisan commands
│   ├── php artisan make:mail OrderConfirmation (if not exists)
│   ├── Temporary route or command for mailable rendering
│   ├── Example: Route::get('/mailable/preview', fn() => new OrderConfirmation($order))
│   └── Useful for: isolated testing of a specific mailable
│
├── Browser testing (Dusk)
│   ├── Navigate to email verification links in Dusk tests
│   ├── Verify rendered email content in browser
│   └── End-to-end email flow testing
│
└── Production preview considerations
    ├── Mailpit HTML rendering differs from Gmail/Outlook
    ├── Test with real email client before deployment
    ├── Use Litmus or Email on Acid for comprehensive previews
    └── Send test emails to team members before shipping
```
