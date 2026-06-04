# Rule Card: K085 — Queueable Mail, Notifications, and Broadcast Events

---

## Rule 1

**Rule Name:** dont-assume-multiple-channel-jobs

**Category:** Never

**Rule:** Never assume multiple notification channels create multiple jobs.

**Reason:** A notification with 3 channels processes all 3 in one job sequentially — one slow channel blocks all others.

**Bad Example:**
```php
Notification::send($user, new WelcomeNotification);
// Assumes mail, SMS, and database channels run as 3 separate jobs
```

**Good Example:**
```php
$user->notify(new WelcomeMailNotification);
$user->notify(new WelcomeSmsNotification);
$user->notify(new WelcomeDatabaseNotification);
```

**Exceptions:** When channels are all fast and independent processing is unnecessary, the default single-job behavior is acceptable.

**Consequences Of Violation:** A slow SMS provider blocks email delivery — users don't receive critical emails for minutes.

---

## Rule 2

**Rule Name:** set-mailable-timeout-explicitly

**Category:** Always

**Rule:** Always set `$timeout` explicitly on queueable mailables to 30-60 seconds.

**Reason:** SMTP calls with attachments are slow and unpredictable — the default timeout may be insufficient.

**Bad Example:**
```php
class OrderConfirmation extends Mailable
{
    // No $timeout set — default 60s may be too short for large attachments
}
```

**Good Example:**
```php
class OrderConfirmation extends Mailable
{
    public $timeout = 60;
}
```

**Exceptions:** Mailables without attachments or those using local mail transport may not need an increased timeout.

**Consequences Of Violation:** Job times out before email sends — user never receives confirmation, no retry captures the failure clearly.

---

## Rule 3

**Rule Name:** prefer-broadcast-now-for-realtime

**Category:** Prefer

**Rule:** Prefer `ShouldBroadcastNow` for user-facing real-time events.

**Reason:** `ShouldBroadcast` puts the broadcast in the queue — the update reaches the client only after the worker processes it.

**Bad Example:**
```php
class MessageSent implements ShouldBroadcast
{
    // Broadcast queued — unpredictable delay while worker polls
}
```

**Good Example:**
```php
class MessageSent implements ShouldBroadcastNow
{
    // Broadcast immediately — no queue latency
}
```

**Exceptions:** Non-critical broadcasts (activity feeds, analytics) can use `ShouldBroadcast` to avoid blocking the request.

**Consequences Of Violation:** Chat messages, live updates, and collaborative edits reach users with unpredictable delays, creating a poor real-time experience.

---

## Rule 4

**Rule Name:** always-queue-mail-production

**Category:** Always

**Rule:** Always queue mail in production environments.

**Reason:** SMTP calls are network-bound and unpredictable — synchronous mail adds latency to web requests.

**Bad Example:**
```php
Mail::send(new OrderConfirmation($order)); // Synchronous — blocks response
```

**Good Example:**
```php
Mail::queue(new OrderConfirmation($order)); // Queued — returns immediately
```

**Exceptions:** In development/testing environments, synchronous mail is acceptable to simplify debugging.

**Consequences Of Violation:** Web response times increase by 100ms-5s per email, reducing request throughput and user experience.

---

## Rule 5

**Rule Name:** separate-notification-channels

**Category:** Prefer

**Rule:** Prefer separating notification channels into individual jobs for independent processing.

**Reason:** `SendQueuedNotifications` processes channels sequentially — separating channels enables parallel processing and independent timeout handling.

**Bad Example:**
```php
class WelcomeNotification extends Notification
{
    public function via($notifiable): array
    {
        return ['mail', 'sms', 'database']; // All in one job
    }
}
```

**Good Example:**
```php
// Three separate notification classes, dispatched individually
$user->notify(new WelcomeMail);
$user->notify(new WelcomeSms);
$user->notify(new WelcomeDatabase);
```

**Exceptions:** When channels are fast and not critical (e.g., database + broadcast), the default single-job behavior is acceptable.

**Consequences Of Violation:** A slow SMS channel delays email delivery; a timeout on one channel causes the entire notification to fail and retry.
