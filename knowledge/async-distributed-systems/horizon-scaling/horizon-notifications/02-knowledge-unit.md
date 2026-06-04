# Metadata
Domain: Async & Distributed Systems
Subdomain: Horizon Scaling & Monitoring
Knowledge Unit: Horizon Notifications (Wait Time, Failure Thresholds)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
Horizon can send notifications when queue wait times exceed thresholds or when long-running jobs are detected. Using Laravel's notification system, Horizon integrates with Slack, email, SMS, and other channels. Configuration in `config/horizon.php` defines `waits` (per-queue wait time thresholds in seconds) and `hours` (time of day for notifications). When a queue's wait time exceeds the threshold, Horizon dispatches a notification through the configured channel using the `HorizonNotification` class.

# Core Concepts
- **`waits` configuration**: Array of queue-name → seconds mapping. When wait time exceeds this threshold, a notification is sent.
- **`horizon.notifications`**: Configuration array in `config/horizon.php` for notification settings.
- **Notification channels**: Using Laravel's `via()` method on the notification, configurable for Slack, email, database, etc.
- **Recipient configuration**: The `App\Notifications\HorizonNotification` class is used by default (publishable for customization).
- **Wait time monitoring**: Horizon compares current wait time (from metrics) against the configured threshold. Notification fires when exceeded.

# Mental Models
- **Fire alarm thresholds**: Wait time notifications are like smoke detector thresholds. When the smoke (backlog) reaches a certain level, the alarm fires. You can set different thresholds for different rooms (queues).
- **SLA guard**: Notifications act as SLA guards — when a queue's wait time violates the target, someone is paged to investigate.

# Internal Mechanics
- Horizon master process runs a periodic check against metrics.
- For each queue defined in `waits`, it compares the current wait time against the threshold.
- If exceeded, a `HorizonNotification` is dispatched via `Notification::send()`.
- The notification is rate-limited internally to prevent alert fatigue — multiple notifications for the same condition are suppressed.
- The `hours` configuration restricts notifications to specific times (e.g., only during business hours).
- Notifications use Laravel's notification system — any channel (Slack, mail, database) supported by Laravel.
- The default notification class is `Laravel\Horizon\Notifications\Notification` — published and customizable via `horizon:notification`.

# Patterns
## Triage by Queue Priority
- **Purpose**: Set low thresholds for critical queues, high thresholds for bulk queues.
- **Benefit**: Critical queue violations get immediate attention.
- **Tradeoff**: Low thresholds may cause alert fatigue for noisy queues.

## Business Hours Only Notifications
- **Purpose**: Only notify during operational hours.
- **Benefit**: Reduced off-hours noise.
- **Tradeoff**: Critical issues overnight go unnoticed until morning.

## Escalation via Multiple Channels
- **Purpose**: Use multiple notification channels (Slack + email + PagerDuty).
- **Benefit**: Redundant delivery ensures someone sees the alert.
- **Tradeoff**: Multiple channels = multiple noise sources.

# Architectural Decisions
- **Set wait thresholds based on job SLA**: If email should be sent within 5 minutes, set wait threshold to 300 seconds for the email queue.
- **Use silent hours for non-critical queues**: Notifications for bulk processing queues can be limited to business hours.
- **Custom notification class for routing**: Publish and customize the notification to route to different channels per queue.
- **Combine with Pulse alerts**: Horizon notifications cover wait time; Pulse covers slow jobs and failure rates. Use both.

# Tradeoffs
Low wait threshold (30s) | Early warning, catches minor issues | Alert fatigue; many false positives during normal spikes
High wait threshold (600s) | Only meaningful issues alerted | Delayed response; SLA may be violated before alert fires
Single notification channel | Simple setup | Single point of failure if channel is down
Multiple notification channels | Redundant delivery | More noise; configuration complexity

# Performance Considerations
- Wait time check is part of the snapshot cycle. No separate monitoring infrastructure.
- Notification dispatch is a queue job (by default). Doesn't block Horizon master.
- Rate limiting prevents notification floods. Same condition won't re-notify immediately.
- Minimal performance impact from notification checks.

# Production Considerations
- Test wait thresholds in staging. Set thresholds higher than normal peak wait time but lower than SLA violation level.
- Monitor notification rate. A spike in wait-time notifications usually indicates a systemic issue (worker shortage, downstream outage).
- Configure `hours` carefully. An all-night notification run without response will lead to alert fatigue.
- The notification is sent to the first user returned by a configurable method. Ensure the right people receive it.
- Customize the notification channel (e.g., Slack webhook) for team-wide visibility.

# Common Mistakes
- **Setting thresholds too low for bursty workloads**: A queue that normally spikes to 30s wait time but averages 5s triggers false alerts constantly.
- **Not setting `hours` for off-hour workloads**: 3 AM notifications for non-critical queues wake up on-call unnecessarily.
- **Defaulting to email notifications**: Email notifications are easy to ignore or miss. Prefer Slack/PagerDuty for actionable alerts.
- **No rate limiting understanding**: If the same condition persists, notifications may be suppressed by Horizon's internal rate limiting. The condition is still ongoing but no new alerts fire — team may think it's resolved.
- **Not publishing the notification class**: Without publishing, the notification uses default routing. Custom routing requires `php artisan horizon:notification`.

# Failure Modes
- **Notification rate limiting hides ongoing issues**: After the first notification, subsequent notifications for the same condition are suppressed. The queue is still backlogged but no one is re-notified.
- **Wrong notification recipient**: If the configured notification user doesn't have a valid Slack/email, notifications are silently dropped.
- **Notification queue backlog**: Notifications themselves are queued. If the notification queue is backlogged, alerts are delayed.
- **Metric lag causing false notification**: Wait time metric is a snapshot. A brief spike captured by the snapshot may trigger a notification even though the condition resolved within seconds.

# Ecosystem Usage
- **Laravel Horizon**: Built-in notification system. Configurable via `config/horizon.php`.
- **Laravel Pulse**: Pulse complements Horizon notifications with additional alerting for slow jobs and failure rates via its own recorder system.
- **Spatie packages**: Not directly related, but teams using Horizon + Spatie packages should set up notifications for webhook-related queues.

# Related Knowledge Units
- K047 Horizon Metrics (source data for notifications) | K071 Horizon Wait Time Monitoring

## Research Notes
- Horizon's auto-balancing mode uses a scoring algorithm that reassigns worker processes between queues every few seconds — the scoring considers queue backlog depth and processing time to determine worker allocation.
- The alance:auto strategy in Horizon implements a "min/max" approach where each supervisor has a configured minProcesses and maxProcesses — the balancer adjusts within this range based on load.
- Horizon v5 (Laravel 11+) improved Redis cluster support by abstracting queue connections through a consistent hashing layer — jobs are distributed across cluster nodes based on job ID hash.
- The Horizon dashboard authorization gate can be customized via Horizon::auth() — exposing the dashboard without authentication in production is a common security gap.
- Horizon metrics (throughput, runtime, wait time) are stored in Redis with a retention period configured via 	rim — long retention can consume significant Redis memory in high-throughput environments.
- The horizon:snapshot command generates a work-in-progress report of all supervisors, processes, and queue metrics — useful for debugging queue backlogs during incidents.
- Silenced job tags in Horizon prevent specific job types from appearing in the "Completed Jobs" and "Failed Jobs" lists — this is a display-only filter that does not affect job processing or logging.
- Horizon's queue:monitor integration was added in Laravel 12 — it provides a Pulse integration for queue health dashboards beyond Horizon's own UI.
