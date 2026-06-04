# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Mocking, Fakes & Test Doubles
## Knowledge Unit: Mail/Notification Testing with Fakes

---

### Rule 1: Always call `Mail::fake()` or `Notification::fake()` before the action

| Field | Value |
|-------|-------|
| **Name** | Fake before sending |
| **Category** | Test Setup |
| **Rule** | Call `Mail::fake()` or `Notification::fake()` as the first step in any test that verifies mail or notification behavior. |
| **Reason** | Without faking, real mail is sent to real recipients. This is dangerous, slow, and unreliable. Assertions like `assertSent()` check the fake's recorded calls — without faking, there are no recorded calls to check against. |
| **Bad Example** | `$this->post('/register'); Mail::assertSent(WelcomeMail::class)` — no `Mail::fake()` call; real mail sent; assertion has nothing to check. |
| **Good Example** | `Mail::fake(); $this->post('/register'); Mail::assertSent(WelcomeMail::class);`. |
| **Exceptions** | Dedicated integration tests against real mail infrastructure. |
| **Consequences Of Violation** | Real emails sent to real recipients during testing. Assertions always fail because there's no fake to check. |

---

### Rule 2: Assert content via subject and recipient, not exact HTML

| Field | Value |
|-------|-------|
| **Name** | Flexible content assertions |
| **Category** | Content Assertion |
| **Rule** | Assert mail content using `$mail->hasTo($email)` and `$mail->hasSubject('Welcome!')`. For body content, assert key text fragments via `$mail->render()`. Never assert exact HTML output. |
| **Reason** | Exact HTML matching breaks on whitespace changes, class reordering, or minor template updates. Subject and recipient are stable — HTML structure is not. Key text fragments check meaningful content without brittleness. |
| **Bad Example** | `assertStringEqualsString($exactHtml, $mail->render())` — breaks on every template change. |
| **Good Example** | `$mail->hasTo($user->email) && $mail->hasSubject('Welcome!')` — stable, meaningful assertions. |
| **Exceptions** | Accessibility tests that verify specific HTML attributes or ARIA labels. |
| **Consequences Of Violation** | Tests are brittle. Template changes require updating test assertions. |

---

### Rule 3: Test each notification channel separately

| Field | Value |
|-------|-------|
| **Name** | Per-channel notification testing |
| **Category** | Notification Assertion |
| **Rule** | For notifications using multiple channels (mail, database, broadcast), write separate assertions for each channel. |
| **Reason** | `Notification::assertSentTo($user, $notif)` without a channel argument defaults to the mail channel. The database or broadcast channels may be broken while mail channel passes. Each channel is an independent failure mode. |
| **Bad Example** | `Notification::assertSentTo($user, OrderShipped::class)` — only checks the default (mail) channel. |
| **Good Example** | `Notification::assertSentTo($user, OrderShipped::class, 'mail')` and `Notification::assertSentTo($user, OrderShipped::class, 'database')`. |
| **Exceptions** | Notifications using only one channel. |
| **Consequences Of Violation** | Non-mail notification channels are untested. Database notifications silently fail. |

---

### Rule 4: Use `Mail::assertNothingSent()` for actions that should not send mail

| Field | Value |
|-------|-------|
| **Name** | Assert no unexpected mail |
| **Category** | Negative Assertion |
| **Rule** | After actions that should not trigger email, call `Mail::assertNothingSent()` to verify no accidental email was sent. |
| **Reason** | Accidental email sending (email leaks) is a common bug. A profile update that sends an unexpected email, or an API call that triggers a notification to the wrong person — these are caught by asserting nothing was sent when nothing should have been. |
| **Bad Example** | `$this->put('/profile', ['name' => 'New Name'])->assertOk()` — no check for email leak. |
| **Good Example** | `$this->put('/profile', ['name' => 'New Name'])->assertOk(); Mail::assertNothingSent();`. |
| **Exceptions** | Actions that are expected to send email. |
| **Consequences Of Violation** | Accidental email leaks go undetected. Users receive unexpected notifications. |

---

### Rule 5: For queued mailables, use both `Queue::fake()` and `Mail::fake()`

| Field | Value |
|-------|-------|
| **Name** | Fake queue and mail for queued mailables |
| **Category** | Queued Mail |
| **Rule** | When mailables implement `ShouldQueue`, call both `Queue::fake()` and `Mail::fake()`. Assert job dispatch with `Queue::assertPushed()` and mailable execution with `Mail::assertSent()`. |
| **Reason** | Queued mailables are serialized to the queue and executed by a worker. `Mail::fake()` alone won't capture them until the queue worker processes the job. `Queue::fake()` verifies the job was dispatched; test the mailable separately by calling `handle()` or by processing the queued job. |
| **Bad Example** | `Mail::fake()` only — queued mailable never reaches the mail fake within the test. |
| **Good Example** | `Queue::fake(); Mail::fake(); $this->post('/order'); Queue::assertPushed(SendOrderConfirmation::class);`. |
| **Exceptions** | Non-queued (sync) mailables. |
| **Consequences Of Violation** | Queued mail dispatch is untested. Test passes but the job is never dispatched in production. |
