# Rule Card: K048 — Horizon Notifications (Wait Time, Failure Thresholds)

---

## Rule 1

**Rule Name:** set-thresholds-based-on-sla

**Category:** Always

**Rule:** Always set wait thresholds based on job SLA, not current metrics.

**Reason:** Measuring against your own baseline hides degradation — thresholds should reflect business requirements.

**Bad Example:**
```php
'waits' => ['redis:emails' => 30], // Set based on current 10s wait — too low, constant alerts
```

**Good Example:**
```php
'waits' => ['redis:emails' => 300], // 5 minutes — matches business SLA for email delivery
```

**Exceptions:** Baseline measurement period (first week of deployment) to establish normal range.

**Consequences Of Violation:** Normal fluctuation of 20-40s triggers alerts constantly — the on-call team becomes desensitized and misses the day when wait time genuinely exceeds the business SLA of 5 minutes.

---

## Rule 2

**Rule Name:** restrict-hours-for-non-critical

**Category:** Prefer

**Rule:** Prefer configuring `hours` to restrict non-critical queue notifications.

**Reason:** Off-hours notifications for non-critical queues cause alert fatigue.

**Bad Example:**
```php
// No hours restriction — emails queue alerts at 3 AM
```

**Good Example:**
```php
'notifications' => [
    'hours' => [
        'redis:emails' => [
            (new DateTimeImmutable)->modify('08:00'),
            (new DateTimeImmutable)->modify('18:00'),
        ],
    ],
],
```

**Exceptions:** SLA-bound queues (payment processing) require 24/7 alerting.

**Consequences Of ViolATION:** A bulk email queue with 5-minute SLA triggers alerts at 3 AM — the on-call engineer checks and sees non-urgent processing delays, losing trust in the alerting system.

---

## Rule 3

**Rule Name:** prefer-slack-pagerduty-over-email

**Category:** Prefer

**Rule:** Prefer Slack or PagerDuty over email for actionable alerts.

**Reason:** Email notifications are asynchronous and often filtered to spam — real-time channels get attention.

**Bad Example:**
```php
// Default email notification — may be missed or filtered
```

**Good Example:**
```php
// After publishing notification class:
public function via($notifiable): array
{
    return ['slack']; // Real-time delivery
}
```

**Exceptions:** Non-urgent daily summary notifications can use email.

**Consequences Of Violation:** The email notification goes to a shared inbox that's checked hourly — a production queue backup goes unaddressed for 45 minutes while Slack would have gotten immediate attention.

---

## Rule 4

**Rule Name:** supplement-notifications-with-trending

**Category:** Always

**Rule:** Always supplement Horizon notifications with trend monitoring for persistent conditions.

**Reason:** Horizon rate-limits repeated notifications — after the first alert, sustained issues don't re-alert.

**Bad Example:**
```php
// Relying solely on Horizon notifications
// Condition persists for 3 hours but only one alert fired
```

**Good Example:**
```php
// External monitoring for sustained conditions
// Prometheus alert: wait_time > threshold for > 30 minutes
```

**Exceptions:** Transient conditions that resolve quickly without intervention.

**Consequences Of ViolATION:** A queue backlog starts at 10:00 — Horizon fires one notification. By 10:05 the backlog is worse, but Horizon's rate limiting suppresses further alerts. At 13:00, an operator finally notices the 3-hour backlog.
