# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Mocking, Fakes & Test Doubles
Knowledge Unit: Mail/Notification Testing with Fakes
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
Mail and notification testing verifies that the correct messages are sent to the right recipients with the expected content. `Mail::fake()` and `Notification::fake()` intercept mail/notification sending, enabling assertions without real email delivery. Testing mail/notification is critical for user onboarding, password resets, order confirmations, and alerting workflows—any failure here directly impacts user experience.

# Core Concepts
- **`Mail::fake()`**: Fakes all mail sending. `assertSent()`, `assertNotSent()`, `assertSentTo()`, `assertNothingSent()`.
- **`Notification::fake()`**: Fakes all notification sending (mail, database, broadcast, Slack). `assertSentTo()`, `assertNotSentTo()`, `assertNothingSent()`.
- **`Mail::assertSent(Mailable::class, $closure)`**: Asserts a specific mailable was sent. Optional closure for content verification.
- **`Mail::assertSentTo($user, Mailable::class)`**: Asserts a mailable was sent to a specific user/email.
- **`Notification::assertSentTo($notifiable, Notification::class)`**: Asserts a notification was sent to a specific notifiable.
- **Mailable inspection**: Access mailable properties: `$mail->subject`, `$mail->to`, `$mail->view`, `$mail->data`.
- **Notification channels**: Assert by channel: `assertSentTo($user, Notification::class)` asserts all channels. Use `assertSentTo($user, Notification::class, 'mail')` for specific channel.

# Mental Models
- **Mail/Notification fakes as email inbox**: All sent messages are captured. Assertions search this "inbox" for matching messages.
- **Mailable as data object**: A mailable carries subject, recipient, view, and data. Assertions verify each aspect.
- **Channel-agnostic assertions**: `Notification::fake()` captures across channels. Assert on the notification class, not the delivery mechanism.
- **Prevention first**: `Mail::fake()` at test start prevents any real email. Safety guarantee.

# Internal Mechanics
- **`MailFake::send()`**: Implements `Mailer::send()`. Stores the `Mailable` in an internal array indexed by mailable class and recipient.
- **`NotificationFake::send()`**: Implements `NotificationDispatcher`. Stores notification + notifiable in an internal array.
- **`assertSent($mailable, $closure)`**: Filters by mailable class name. If closure provided, applies `$closure` to each match. Asserts at least one match.
- **`assertSentTo($user, $mailable)`**: Extracts email from `$user` (checks for `routeNotificationForMail()`, email attribute, or explicit email).
- **Mailable body inspection**: Use `$mail->render()` to get rendered HTML. Assert with `assertSee()` on the rendered content.
- **Notification routing**: Fakes respect notification routing. If a user has multiple email addresses, the notification is sent to all of them.

# Patterns
- **Pattern: Mail sent assertion**
  - Purpose: Verify a specific email was sent after an action
  - Benefits: Confirms user communications
  - Tradeoffs: Doesn't verify email content (body text)
  - Implementation: `Mail::fake(); $this->post('/register', $data); Mail::assertSent(WelcomeMail::class)`

- **Pattern: Mail content assertion**
  - Purpose: Verify email body contains expected content
  - Benefits: Catches template rendering errors
  - Tradeoffs: Content assertions are brittle to copy changes
  - Implementation: `Mail::assertSent(WelcomeMail::class, fn ($mail) => $mail->hasTo($user->email) && $mail->hasSubject('Welcome!'))`

- **Pattern: Notification channel-specific assertion**
  - Purpose: Verify notification was sent via the correct channel
  - Benefits: Tests channel routing logic
  - Tradeoffs: Must understand notification channel configuration
  - Implementation: `Notification::assertSentTo($user, OrderShipped::class, 'mail')` and `assertSentTo($user, OrderShipped::class, 'broadcast')`

- **Pattern: No unexpected mail**
  - Purpose: Verify no mail was sent (safety check)
  - Benefits: Catches accidental email triggers
  - Tradeoffs: Only useful when you expect zero mail
  - Implementation: After action, `Mail::assertNothingSent()` to ensure no unintended emails

# Architectural Decisions
- **`Mail::fake()` vs `Notification::fake()`**: Use `Mail::fake()` when directly sending mailables. Use `Notification::fake()` when sending notifications (which may use multiple channels).
- **`Mailable` vs `Notification`**: Notifications can be sent via multiple channels (mail, database, broadcast). Mailables only go via email. Use notifications for multi-channel delivery.
- **Content assertions**: Assert subject and recipient. For body content, use `$mail->render()` and assert on the rendered HTML. Avoid asserting on full rendered output (brittle).
- **Queue faking with mail**: Use `Queue::fake()` when mailables are queued. Assert mailable was dispatched to queue, not sent (mail fake won't see it until it's processed).

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Fakes prevent real email delivery | Fake doesn't validate email templates compile correctly | Also test that mailables render without errors |
| `assertSentTo` verifies correct recipient | Recipient resolution logic may differ from fake vs real | Test routing logic with real notifiables |
| Channel-specific assertions are precise | Must test each channel separately | Important for multi-channel notifications |
| Mailable content inspection is thorough | Content assertion is brittle (copy changes) | Assert key dynamic content, not static text |

# Performance Considerations
- Fake registration: <0.5ms.
- Sending via fake: <0.1ms per message (no real delivery).
- Content rendering: `$mail->render()` compiles Blade. 5-20ms per render. Use only when content assertions are needed.
- Notification fake: <0.3ms per dispatch.

# Production Considerations
- **Email delivery monitoring**: Fakes don't test delivery infrastructure (SMTP, SES, Mailgun). Layer integration tests against a real mail server.
- **Email template testing**: Mailables reference Blade templates. Test template compilation separately from delivery.
- **Notification preferences**: Users may opt out of certain notification channels. Test that preferences are respected.
- **BCC/CC testing**: `assertSentTo()` checks primary recipient. For BCC/CC, use `assertSent()` with closure checking `$mail->bcc` or `$mail->cc`.

# Common Mistakes
- **Mistake: Asserting mail without faking first**
  - Why: `Mail::assertSent()` called without `Mail::fake()`
  - Why harmful: Real mail is sent; assertion has nothing to check against
  - Better: Always call `Mail::fake()` before the action that triggers mail

- **Mistake: Testing queued mail with Mail fake**
  - Why: `Mail::fake()` is called, but mail is queued (Mail::queue())
  - Why harmful: Queued mailables don't go through `send()` immediately; fake doesn't record them
  - Better: Use `Queue::fake()` + `Mail::fake()`. Assert job dispatch and then mailable sending.

- **Mistake: Asserting exact email body**
  - Why: `assertSent(fn ($mail) => $mail->render() === $exactHtml)`
  - Why harmful: Any whitespace change breaks the test
  - Better: Assert presence of key text: `str_contains($mail->render(), 'Welcome, John!')`

- **Mistake: Only testing the mail channel**
  - Why: `Notification::assertSentTo($user, $notif)` (defaults to mail)
  - Why harmful: Database or broadcast channels may fail
  - Better: Test each channel the notification uses: `assertSentTo($user, $notif, 'database')`

# Failure Modes
- **Mailable not sent**: Action didn't trigger mail. `Mail::assertSent()` fails. Verify action path.
- **Wrong recipient**: `Mail::assertSentTo($user)` fails. Check email address resolution.
- **Notification channel not configured**: `Notification::assertSentTo($user, $notif, 'mail')` fails if `mail` channel not configured for the notifiable.
- **Mail `render()` throws exception**: Mailable references missing template or data. Catches Blade rendering errors early.

# Ecosystem Usage
- **Laravel core**: Auth notifications (password reset, email verification) are tested with `Notification::fake()`.
- **Laravel Cashier**: Invoice, receipt, and payment confirmation emails are tested with `Mail::fake()`.
- **Laravel Spark**: Subscription confirmation, team invitation, and payment method update notifications use both `Mail::fake()` and `Notification::fake()`.
- **Laravel Nova**: Notifications for resource actions and failures are tested via `Notification::fake()`.

# Related Knowledge Units
- **Prerequisites**: Laravel fakes, Mailable/Notification development, Blade templating
- **Related Topics**: Queue/job testing, Event testing, Storage fake testing
- **Advanced Follow-up**: Mailgun/SES integration testing, Notification channel development, Custom mail transports

# Research Notes
- Laravel's fakes (Bus, Event, Mail, Notification, Queue, Storage) provide in-memory implementations that capture dispatched jobs/events/mails for assertion without side effects
- The Http facade faking intercepts outgoing HTTP requests and returns predefined responses — critical for testing external API integrations without network calls
- Time manipulation via Carbon::setTestNow() and Pest's 	ravel() helper enables testing time-sensitive features (rate limits, subscription expirations, scheduled tasks)
- Mockery is the underlying mocking framework integrated with Laravel; $this->mock() and $this->partialMock() are the primary test helpers
- Storage fake testing confirms files are written with correct content, naming, and disk location — use Storage::fake('s3') to test S3 uploads without cloud costs
