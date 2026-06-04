# Skill: Test Mail and Notification Sending

## Purpose
Verify that emails and notifications are sent with the correct content, to the right recipients, and at the expected times using `Mail::fake()` and `Notification::fake()`.

## When To Use
- When testing that a controller or service sends a specific email
- When testing notification channels (mail, database, broadcast, SMS)
- When verifying email content (subject, body, attachments)
- When testing conditional notification logic (admin notified only for large orders)

## When NOT To Use
- When testing the actual HTML rendering of email templates (use a visual regression test)
- When testing SMTP configuration or mail driver behavior (trust Laravel)
- For testing real email delivery (use a dedicated integration test or service)
- When you need to test email delivery timing (use a queue test instead)

## Prerequisites
- Mailables or Notification classes defined
- `Mail::fake()` and `Notification::fake()` facade methods
- Understanding of `assertSent()`, `assertSentTo()`, and `assertNothingSent()`

## Inputs
- Mailable or Notification class name
- Expected recipient(s)
- Expected content (subject, body lines, action URL)
- Notification channels to verify

## Workflow
1. Call `Mail::fake()` or `Notification::fake()` before the action
2. Execute the action that triggers the email/notification
3. For mail: assert sent with `Mail::assertSent(OrderShipped::class, fn ($mail) => $mail->hasTo('user@example.com'))`
4. Assert mail content: `$mail->assertSeeInHtml('Order Confirmed')`, `$mail->assertSeeInText('Order Confirmed')`
5. For notifications: assert sent to specific notifiable: `Notification::assertSentTo($user, InvoicePaid::class)`
6. Assert notification channels: `Notification::assertSentTo($user, InvoicePaid::class, fn ($notification, $channels) => in_array('mail', $channels))`
7. Assert nothing sent for error cases: `Mail::assertNothingSent()`
8. Verify queueing: `Mail::assertQueued()` instead of `assertSent()` for queued mail

## Validation Checklist
- [ ] `Mail::fake()` or `Notification::fake()` called before action
- [ ] Correct recipients are verified in assertions
- [ ] Email content is verified (subject, body, links)
- [ ] Notification channels are verified
- [ ] Queue assertions use `assertQueued` instead of `assertSent` for queued mail
- [ ] Error scenarios assert nothing was sent
- [ ] Conditional notification logic is tested

## Common Failures
- Using `assertSent` for queued mail (should use `assertQueued`)
- Not verifying recipients — only checking that some mail was sent
- Not testing notification channels — notification may go to wrong channel
- Asserting exact content match with HTML whitespace — use `assertSeeInHtml` for partial matching
- Forgetting to fake before action — real emails are sent

## Decision Points
- `Mail::assertSent()` vs `Mail::assertQueued()` — sent for sync mail, queued for async
- `Notification::assertSentTo()` vs raw `assertSent()` — always use `assertSentTo` for notifiable-specific assertions
- Content assertion: `assertSeeInHtml` vs `assertSeeInText` — HTML for rendered templates, text for plain text

## Performance Considerations
- Faked mail/notifications are instant (<1ms) vs real SMTP delivery (100-500ms)
- Mail content rendering still executes — minimize template complexity in tests
- Multiple assertion calls on the same fake are efficient (in-memory lookups)

## Security Considerations
- Email assertions may capture user PII in CI logs — use generic test emails
- Notification content in assertions may reveal business logic — review CI output visibility
- Test that sensitive actions (password reset, account deletion) always trigger notifications

## Related Rules
- [Rule: Use `assertQueued` for Queued Mail](./05-rules.md)
- [Rule: Verify Recipients and Content](./05-rules.md)
- [Rule: Test Notification Channels](./05-rules.md)

## Related Skills
- Event Testing
- Queue Job Testing
- Laravel Fakes

## Success Criteria
- [ ] Every mailable/notification class has a corresponding test
- [ ] Tests verify recipient, content, and channel for each notification
- [ ] Conditional notification logic is tested (when to send, when to skip)
- [ ] Queued mail is tested with `assertQueued`, not `assertSent`
