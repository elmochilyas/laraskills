# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Horizon Scaling & Monitoring
- **Knowledge Unit:** K048 — Horizon Notifications (Wait Time, Failure Thresholds)
- **Knowledge ID:** K048
- **Difficulty Level:** Intermediate
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Horizon: Notifications
  - Laravel Source — `Laravel\Horizon\Notifications\Notification`

---

# Overview

Horizon can send notifications when queue wait times exceed thresholds or when long-running jobs are detected. Using Laravel's notification system, Horizon integrates with Slack, email, SMS, and other channels. Configuration in `config/horizon.php` defines `waits` (per-queue wait time thresholds in seconds) and `hours` (time of day for notifications). When a queue's wait time exceeds the threshold, Horizon dispatches a notification through the configured channel.

---

# Core Concepts

- **`waits` configuration:** Array of queue-name → seconds mapping. When wait time exceeds threshold, notification sent.
- **`horizon.notifications`:** Configuration array in `config/horizon.php` for notification settings.
- **Notification channels:** Uses Laravel's notification system — Slack, email, database, etc.
- **Recipient configuration:** Default `App\Notifications\HorizonNotification` class, customizable via `horizon:notification`.
- **Wait time monitoring:** Horizon compares current wait time against configured threshold.

---

# When To Use

- Alerting when critical queues exceed acceptable wait times
- Proactive detection of worker shortages or downstream outages
- Business hours-only alerting for non-critical queues
- Multi-channel escalation for critical queue violations

---

# When NOT To Use

- Real-time per-job failure alerting — use event-based alerting (`Queue::failing`) instead
- Metrics-based SLA monitoring — Pulse or external monitoring provides richer capabilities
- When thresholds can't be meaningfully set — bursty queues with normal spikes above threshold cause alert fatigue

---

# Best Practices

- **Set wait thresholds based on job SLA, not current metrics.** If email should send within 5 minutes, set threshold to 300 seconds. *Why: The threshold should reflect business requirements, not current performance — otherwise you're measuring against your own baseline, not customer expectations.*
- **Use `hours` to restrict non-critical queue notifications.** Bulk processing queues should only notify during business hours. *Why: Off-hours notifications for non-critical queues cause alert fatigue and desensitize the on-call team.*
- **Prefer Slack or PagerDuty over email.** Email notifications are easy to ignore or filtered to spam. *Why: Actionable alerts need real-time delivery channels — email is asynchronous and often missed.*
- **Understand Horizon's internal rate limiting.** After the first notification for a condition, subsequent notifications for the same condition are suppressed — the condition may persist but no re-alert fires. *Why: Rate limiting prevents alert storms but can hide ongoing issues — combine with trend monitoring for persistent conditions.*
- **Publish and customize the notification class.** Default routing may not reach the right people. *Why: `php artisan horizon:notification` generates a customizable notification class where you can set channels, recipients, and formatting.*

---

# Architecture Guidelines

- Horizon master process runs a periodic check against metrics snapshots.
- For each queue in `waits`, compare current wait time against threshold.
- If exceeded, dispatch `HorizonNotification` via `Notification::send()`.
- Notifications are rate-limited internally to prevent alert fatigue.
- `hours` restricts notification delivery to specific times.
- Notifications are queued by default — they don't block the Horizon master.

---

# Performance Considerations

- Wait time check is part of the snapshot cycle — no separate monitoring infrastructure.
- Notification dispatch is a queue job — doesn't block Horizon master.
- Rate limiting prevents notification floods — same condition won't re-notify immediately.
- Minimal performance impact from notification checks.

---

# Security Considerations

- Notification configuration in `config/horizon.php` may contain Slack webhook URLs — restrict file permissions.
- The notification recipient is configurable — ensure the right person or channel receives alerts.
- Notification payload contains queue and wait time information — may reveal business activity patterns.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Threshold too low for bursty queues | Not accounting for normal spikes | Constant false alerts, alert fatigue | Set threshold above normal peak wait time |
| No `hours` config | 24/7 notification for all queues | Off-hours alerts for non-critical issues | Set hours per queue priority |
| Defaulting to email | Using default notification channel | Alerts missed or ignored | Use Slack/PagerDuty for actionable alerts |
| Not publishing notification class | Using default routing | Wrong people notified or no delivery | Run `php artisan horizon:notification` |
| Ignoring rate limiting | Expecting repeated alerts | Persistent conditions appear resolved | Combine notifications with trend monitoring |

---

# Anti-Patterns

- **Single low threshold for all queues:** Critical and bulk queues get the same threshold — either the critical queues are noisy or bulk queues alert too late.
- **No notification routing by severity:** All notifications go to the same channel — a minor delay in the email queue triggers the same alert as a critical payment queue outage.
- **Thresholds set without baseline data:** Picking random threshold values without measuring normal queue behavior — causes either constant false alarms or never fires.

---

# Examples

```php
// config/horizon.php
'waits' => [
    'redis:emails' => 300,    // alert if email queue wait > 5 min
    'redis:webhooks' => 60,   // alert if webhook queue wait > 1 min
    'redis:default' => 600,   // alert if default queue wait > 10 min
],

'notifications' => [
    'hours' => [
        'redis:webhooks' => [
            (new DateTimeImmutable)->modify('08:00'),
            (new DateTimeImmutable)->modify('18:00'),
        ],
    ],
],

// Custom notification channel
// Run: php artisan horizon:notification
// Then customize the generated class:
public function via($notifiable): array
{
    return $notifiable->notificationPreference()
        ? ['slack']
        : ['mail'];
}
```

---

# Related Topics

- **K047 Horizon Metrics (K047)** — Source data for wait time notifications
- **K071 Horizon Wait Time Monitoring (K071)** — Wait time interpretation
- **K022 Failed Job Events (K022)** — Event-based failure alerting as complement

---

# AI Agent Notes

- When generating Horizon notification config, always set thresholds based on job SLA requirements, not arbitrary values.
- Recommend publishing the notification class (`php artisan horizon:notification`) to customize routing.
- For critical queues, recommend multiple notification channels (Slack + PagerDuty).
- Document that Horizon's rate limiting means sustained issues only generate one initial notification — additional monitoring is needed for persistent conditions.

---

# Verification

- [ ] Notification fires when wait threshold exceeded — verify by artificially increasing queue depth
- [ ] `hours` restriction works — verify no notifications outside configured hours
- [ ] Custom notification class used — verify `php artisan horizon:notification` generated class
- [ ] Rate limiting active — verify subsequent same-condition notifications suppressed
- [ ] Notification delivered via configured channel — verify Slack/email received alert
