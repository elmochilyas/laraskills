# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Queue Engineering
- **Knowledge Unit:** K085 — Queueable Mail, Notifications, and Broadcast Events
- **Knowledge ID:** K085
- **Difficulty Level:** Intermediate
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Mail, Notifications, Broadcasting
  - Laravel Source — `Illuminate\Mail\SendMail`, `Illuminate\Notifications\SendQueuedNotifications`, `Illuminate\Broadcasting\BroadcastEvent`

---

# Overview

Beyond explicit job classes, Laravel supports queuing for mail, notifications, and broadcast events — each through a different internal wrapper but all sharing the same queue infrastructure. Mail becomes a `SendMail` job, notifications become a `SendQueuedNotifications` job, and broadcast events become a `CallQueuedBroadcast` job. A key insight: **notifications with multiple channels create one job, not multiple** — that single job processes all channels sequentially.

---

# Core Concepts

- **Queued mail:** `Mail::queue(new Mailable)` wraps in `SendMail` job. Mailable serialized with `SerializesModels`.
- **Queued notifications:** `Notification::send($users, new Notification)` creates `SendQueuedNotifications` — iterates channels sequentially in one job.
- **Broadcast events:** Events with `ShouldBroadcast` are wrapped in `CallQueuedBroadcast` — serializes event for the broadcasting system.
- **Per-type queue config:** Mailables use `$connection`/`$queue` properties. Notifications use `$connection`/`$queue` on the notification class.

---

# When To Use

- **Always queue mail in production** — SMTP calls are network-bound and unpredictable.
- **Queue external notification channels (mail, SMS, push).** Database notifications can be synchronous.
- **Use `ShouldBroadcastNow` for real-time events** (chat messages, live updates). Use `ShouldBroadcast` for non-critical events.

---

# When NOT To Use

- **Assuming multiple channels = multiple jobs.** A notification with 3 channels processes all 3 in one job — one slow channel blocks the others.
- **Forgetting `$timeout` on queueable mailables** — default timeout may be too short for large attachments or slow SMTP relays.
- **Using `ShouldBroadcast` for real-time needs** — broadcast happens on the next worker poll, introducing unpredictable delay.

---

# Best Practices

- **Separate notification channels into individual jobs for independent processing.** A slow SMS channel should not block email dispatch. *Why: `SendQueuedNotifications` iterates channels sequentially — if a push notification takes 10 seconds, the email and database channels wait. Separate jobs run in parallel.*
- **Set `$timeout` explicitly on mailables (30-60s).** SMTP calls with attachments are slow and unpredictable — the default 60s may be insufficient. *Why: A mailable connecting to an external SMTP relay with a 5MB attachment can take 30+ seconds. If `$timeout` is 60, a slow connection or retry can cause a timeout.*
- **Use `ShouldBroadcastNow` for user-facing real-time events.** Chat messages, live score updates, and collaborative editing should not wait for a queue worker. *Why: `ShouldBroadcast` puts the broadcast in the queue — the update reaches the client only after the worker processes it. For truly real-time interaction, this unpredictable delay is unacceptable.*

---

# Performance Considerations

- `SendQueuedNotifications` with 3 channels: total time = mail + SMS + database (sequential).
- High-volume notifications (newsletter to 10K users) should be batched — a single job can timeout processing 10K recipients.
- Broadcast event payloads go through two serializations: the job queue + the broadcasting driver.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Assuming multiple channels = multiple jobs | Missing documentation | One channel timeout blocks all channels | Separate into individual notification jobs |
| No `$timeout` on mailable | Default may be insufficient | Job times out on slow SMTP relay | Set `$timeout` to 30-60s |
| `ShouldBroadcast` for real-time | Using wrong interface | Broadcast delayed by queue backlog | Use `ShouldBroadcastNow` |

---

# Examples

```php
Mail::queue(new OrderConfirmation($order))->onQueue('mail');
Notification::send($users, new WelcomeNotification)->onQueue('notifications');
```

---

# Related Topics

- **K006 ShouldQueue Contract (K006)** — Contract mechanics
- **K028 Queued Event Listeners (K028)** — Similar pattern for events
