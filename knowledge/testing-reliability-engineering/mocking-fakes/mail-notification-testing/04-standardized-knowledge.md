# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Mocking, Fakes & Test Doubles |
| Knowledge Unit | Mail/Notification Testing with Fakes |
| Difficulty | Foundation |
| Maturity | Stable |
| Priority | P1 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Laravel fakes, Mailable/Notification development, Blade templating |
| Related KUs | Queue/job testing, Event testing, Storage fake testing |
| Source | domain-analysis.md K032 |

# Overview

Mail and notification testing verifies that the correct messages are sent to the right recipients with the expected content. `Mail::fake()` and `Notification::fake()` intercept mail/notification sending, enabling assertions without real email delivery. Testing mail/notification is critical for user onboarding, password resets, order confirmations, and alerting workflows — any failure here directly impacts user experience.

# Core Concepts

- **`Mail::fake()`**: Fakes all mail sending. `assertSent()`, `assertNotSent()`, `assertSentTo()`, `assertNothingSent()`.
- **`Notification::fake()`**: Fakes all notification sending (mail, database, broadcast, Slack).
- **`Mail::assertSent(Mailable::class, $closure)`**: Asserts a specific mailable was sent. Optional closure for content verification.
- **`Mail::assertSentTo($user, Mailable::class)`**: Asserts a mailable was sent to a specific user/email.
- **`Notification::assertSentTo($notifiable, Notification::class)`**: Asserts a notification was sent to a specific notifiable.
- **Mailable inspection**: `$mail->subject`, `$mail->to`, `$mail->view`, `$mail->data`.
- **Channel-specific assertions**: `assertSentTo($user, Notification::class, 'mail')` for specific channel.

# When To Use

- For every mail-sending action (user registration, order confirmation, password reset)
- For every notification workflow (multi-channel: mail, database, broadcast)
- For testing that emails contain expected content (subject, recipient, body)
- For testing notification channel routing
- For ensuring no unexpected mail is sent

# When NOT To Use

- For testing email template rendering (test templates separately or use `$mail->render()`)
- For testing actual email delivery infrastructure (SMTP, SES, Mailgun)
- When the mailable is queued without also using `Queue::fake()`
- For testing third-party notification channels (Slack, Nexmo) behavior

# Best Practices (WHY)

- **Always call `Mail::fake()`/`Notification::fake()` before the action**: Without it, real mail is sent. Assertions have nothing to check against. Make it the first line of any mail/notification test.
- **Test content with subject and recipient assertions, not exact HTML**: `assertSent(fn ($mail) => $mail->hasTo($user->email) && $mail->hasSubject('Welcome!'))` is robust. Exact HTML matching breaks on whitespace changes.
- **Use `assertNothingSent()` to catch accidental mail**: After actions that shouldn't send mail, assert no mail was sent. Prevents email leaks.
- **Test each notification channel separately**: Notifications can use multiple channels. `assertSentTo($user, $notif, 'database')` may pass while `'mail'` channel fails. Test each channel the notification uses.
- **For queued mail, use both `Queue::fake()` and `Mail::fake()`**: Queued mailables don't go through `send()` immediately. Assert job dispatch, then mailable sending.

# Architecture Guidelines

- **`Mail::fake()` vs `Notification::fake()`**: Use `Mail::fake()` for direct mailables. Use `Notification::fake()` for notifications (multi-channel).
- **Content assertions**: Assert subject and recipient. For body, use `$mail->render()` and assert key text. Avoid full rendered output assertions.
- **Queue faking with mail**: Use `Queue::fake()` when mailables are queued. Assert job dispatch.

# Performance Considerations

- Fake registration: <0.5ms.
- Sending via fake: <0.1ms per message (no real delivery).
- Content rendering via `$mail->render()`: 5-20ms. Use only when content assertions are needed.
- Notification fake: <0.3ms per dispatch.

# Security Considerations

- Test that sensitive data (passwords, tokens, PII) is not included in email bodies or headers.
- Test that notification preferences are respected (users who opted out don't receive notifications).
- Test that email verification/password reset tokens are correctly addressed to the right user.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Asserting mail without faking first | `Mail::assertSent()` called without `Mail::fake()` | Real mail is sent; assertion has nothing to check against | Always call `Mail::fake()` before the action |
| Testing queued mail with Mail fake only | `Mail::fake()` but mail is queued | Queued mail doesn't go through `send()` immediately | Use `Queue::fake()` + `Mail::fake()`. Assert job dispatch then mailable |
| Asserting exact email body | `$mail->render() === $exactHtml` | Whitespace changes break test | Assert key text: `str_contains($mail->render(), 'Welcome')` |
| Only testing the mail channel | `Notification::assertSentTo($user, $notif)` defaults to mail | Database or broadcast channels may fail | Test each channel the notification uses |
| Not testing mail was NOT sent | No `assertNothingSent()` | Accidental email goes undetected | Use `Mail::assertNothingSent()` for actions that shouldn't send mail |

# Anti-Patterns

- **No fake call**: Sending real emails in tests. Dangerous for production data, slow, and unreliable.
- **Exact HTML matching**: Asserting full rendered email HTML. Brittle on every template change.
- **Only mail channel testing**: Testing notification only via the mail channel while database/broadcast channels are untested.
- **No recipient verification**: Asserting mail was sent but not verifying the recipient. Mail may go to the wrong person.

# Examples

```php
// Mail sent assertion
public function test_welcome_email_is_sent_after_registration()
{
    Mail::fake();

    $this->post('/register', [
        'name' => 'John',
        'email' => 'john@example.com',
        'password' => 'password',
    ]);

    Mail::assertSent(WelcomeMail::class);
    Mail::assertSentTo('john@example.com', WelcomeMail::class);
}

// Mail content assertion
public function test_welcome_email_has_correct_subject()
{
    Mail::fake();
    $user = User::factory()->create(['name' => 'John']);

    $this->post('/register', $validData);

    Mail::assertSent(function (WelcomeMail $mail) use ($user) {
        return $mail->hasTo($user->email)
            && $mail->hasSubject('Welcome to our app!');
    });
}

// Notification channel-specific assertion
public function test_order_shipped_notification()
{
    Notification::fake();
    $user = User::factory()->create();

    $this->actingAs($user)->post('/orders', $data);

    Notification::assertSentTo(
        $user,
        OrderShipped::class,
        'mail'
    );
    Notification::assertSentTo(
        $user,
        OrderShipped::class,
        'database'
    );
}

// No unexpected mail
public function test_profile_update_does_not_send_email()
{
    Mail::fake();

    $this->actingAs($user)->put('/profile', ['name' => 'New Name']);

    Mail::assertNothingSent();
}

// Queued mail testing
public function test_queued_order_confirmation()
{
    Queue::fake();
    Mail::fake();

    $this->actingAs($user)->post('/orders', $data);

    Queue::assertPushed(SendOrderConfirmation::class);
    // In the job execution test: Mail::assertSent(OrderConfirmation::class)
}
```

# Related Topics

- **Prerequisites**: Laravel fakes, Mailable/Notification development, Blade templating
- **Related**: Queue/job testing, Event testing, Storage fake testing
- **Advanced**: Mailgun/SES integration testing, Notification channel development, Custom mail transports

# AI Agent Notes

- Always pair `Mail::fake()` with `Mail::assertSent()`. A fake without assertion is a test that could pass without any mail being sent.
- For multi-channel notifications, assert each channel separately. A common bug is the mail channel working but the database channel failing silently.
- When mailables are queued, the `Mail::fake()` won't capture them until the queue worker processes the job. Test dispatch with `Queue::fake()` and execution with `Mail::fake()`.

# Verification

- [ ] `Mail::fake()` or `Notification::fake()` is called before every mail/notification test
- [ ] Every mail-sending action has a corresponding `assertSent` or `assertSentTo`
- [ ] Email content is verified with subject/recipient assertions, not exact HTML
- [ ] Each notification channel is tested separately (mail, database, broadcast)
- [ ] `assertNothingSent()` is used for actions that shouldn't send mail
- [ ] Queued mailables use both `Queue::fake()` and `Mail::fake()`
- [ ] Sensitive data in mail content is verified (not leaked)
- [ ] Notification preferences are respected in tests
