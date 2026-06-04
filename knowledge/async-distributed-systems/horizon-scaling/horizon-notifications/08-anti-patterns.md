---
Domain: Async & Distributed Systems
Subdomain: Horizon Scaling & Monitoring
Knowledge Unit: K048 — Horizon Notifications (Wait Time, Failure Thresholds)
Knowledge ID: K048
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | Single Low Threshold for All Queues | Operations | Medium |
| 2 | No `hours` Config — 24/7 Notifications for Non-Critical Queues | Operations | Medium |
| 3 | Defaulting to Email for Actionable Alerts | Observability | Medium |
| 4 | No Notification Routing by Severity | Architecture | Low |
| 5 | Relying Solely on Horizon Notifications (Ignoring Rate Limiting) | Operations | High |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| Alert Fatigue from Low Thresholds | Medium — constant false alarms desensitize on-call | Set thresholds based on business SLA, not current metrics |
| Single Notification Channel | Low — all alerts look the same | Route by severity: Slack for critical, email for summaries |
| Rate-Limiting Blindness | Critical — sustained issues go undetected | Supplement with external trend monitoring |

---

## 1. Single Low Threshold for All Queues

### Category
Operations

### Description
Setting the same wait time threshold for all queues regardless of their SLA requirements. Critical queues (payment processing, 60-second SLA) and bulk queues (email notifications, 10-minute SLA) have the same threshold — either critical queues are noisy or bulk queues alert too late.

### Why It Happens
- Copying config from one queue to all others without adjusting thresholds
- Not knowing each queue's business SLA requirements
- Setting thresholds based on what "looks reasonable" rather than SLA analysis
- Threshold review happens only once during initial setup, never revisited
- Not considering that different job types have different acceptable wait times

### Warning Signs
- All queues have the same `waits` value in `config/horizon.php`
- Bulk queues trigger alerts as often as critical queues
- On-call cannot distinguish between "urgent" and "informational" alerts
- Team starts ignoring alerts from certain queues
- Queue priority mapping doesn't exist in documentation

### Why Harmful
A single threshold cannot satisfy both a payment queue (must process within 60 seconds) and a bulk email queue (acceptable within 10 minutes). Setting the threshold to 60 seconds means the email queue fires alerts for normal operation (backlogged during batch sends). Setting it to 600 seconds means the payment queue waits 10 minutes to alert — violating its SLA by 9 minutes.

### Consequences
- Alert fatigue: bulk queue normal spikes desensitize the on-call team
- Delayed response: critical queue violations detected too late
- On-call overhead: every queue spike triggers investigation
- SLA violations for critical queues hidden by high threshold
- Trust in the alerting system erodes over time

### Alternative
- Set per-queue thresholds based on business SLA:
  ```php
  'waits' => [
      'redis:payments'  => 60,   // 1 minute — payment processing SLA
      'redis:webhooks'  => 120,  // 2 minutes — webhook delivery SLA
      'redis:emails'    => 300,  // 5 minutes — email notification SLA
      'redis:default'   => 600,  // 10 minutes — batch processing
  ],
  ```

### Refactoring Strategy
1. Document each queue's business SLA
2. Set per-queue wait thresholds based on those SLAs
3. Use higher thresholds for bulk queues, lower for critical
4. Consider `hours` restriction for non-critical queues (see anti-pattern #2)
5. Review thresholds quarterly with business stakeholders

### Detection Checklist
- [ ] Each queue has its own wait threshold
- [ ] Thresholds are based on business SLA, not uniform default
- [ ] Critical queues have lower thresholds than bulk queues
- [ ] Alert volume is proportional to queue priority
- [ ] On-call team can distinguish critical vs informational alerts

### Related Rules
- set-thresholds-based-on-sla

### Related Skills
- Configure Horizon Notifications for Wait Time Alerts

### Related Decision Trees
- Horizon Notification Channels and Alert Strategy

---

## 2. No `hours` Config — 24/7 Notifications for Non-Critical Queues

### Category
Operations

### Description
Omitting the `hours` configuration for all queues, causing Horizon to send wait time notifications at all hours of the day and night. Non-critical queues (bulk emails, report generation) trigger alerts at 3 AM, waking up on-call engineers for non-urgent issues.

### Why It Happens
- Not knowing `hours` restriction exists
- Assuming all queues need 24/7 monitoring
- Not considering the difference between critical and non-critical queues
- Copying a config template that doesn't include `hours`
- "We'll add hours later" — never does

### Warning Signs
- On-call engineer receives alerts for non-critical queues at 2 AM
- Team complains about "too many alerts" (especially for batch/cron-related queues)
- Alerts from personal notification tests (non-critical queues) wake team members
- No `hours` key in `config/horizon.php` `notifications` section
- Bulk/scheduled job processing triggers off-hours alerts

### Why Harmful
A bulk email queue that processes 10,000 emails in batches may normally have 5-minute waits during batch processing. Without hours restriction, this triggers alerts at 2 AM, 3 AM, 4 AM — every time a batch runs. The on-call engineer checks, sees it's normal batch processing, and goes back to sleep. Over time, they stop checking — but one day a critical real queue has a genuine issue and the alert is ignored.

### Consequences
- Alert fatigue: on-call desensitized by off-hours non-critical alerts
- Sleep disruption for on-call engineers
- Team morale degradation from 24/7 alert noise
- Critical alerts lost in the noise of non-critical off-hours notifications
- On-call rotation becomes a burnout risk

### Alternative
- Configure `hours` for non-critical queues:
  ```php
  'notifications' => [
      'hours' => [
          'redis:emails' => [
              (new DateTimeImmutable)->modify('08:00'),
              (new DateTimeImmutable)->modify('18:00'),
          ],
          'redis:reports' => [
              (new DateTimeImmutable)->modify('09:00'),
              (new DateTimeImmutable)->modify('17:00'),
          ],
      ],
  ],
  ```
- Only critical queues (payments, auth, real-time features) should have 24/7 alerting

### Refactoring Strategy
1. Identify which queues are critical (require 24/7 alerting)
2. Set `hours` restriction for all non-critical queues
3. Ensure critical queues have no `hours` restriction (24/7)
4. Document which queues are on-call and which are business-hours only
5. Monitor alert volume before and after — expect reduction

### Detection Checklist
- [ ] `hours` configured for non-critical queues
- [ ] Critical queues have no `hours` restriction (24/7 alerting)
- [ ] On-call team only receives off-hours alerts for genuinely critical queues
- [ ] Alert volume at night is near-zero
- [ ] Queue criticality classification documented

### Related Rules
- restrict-hours-for-non-critical

### Related Skills
- Configure Horizon Notifications for Wait Time Alerts

### Related Decision Trees
- Horizon Notification Channels and Alert Strategy

---

## 3. Defaulting to Email for Actionable Alerts

### Category
Observability

### Description
Using the default email notification channel for Horizon alerts without configuring Slack, PagerDuty, or other real-time channels. Actionable queue alerts go to email where they are easily missed, filtered to spam, or checked infrequently.

### Why It Happens
- Email is the default Laravel notification channel
- Not running `php artisan horizon:notification` to customize the notification class
- Assuming email is sufficient for alert delivery
- Not considering that queue alerts need immediate attention
- "We all check email constantly" — assumption that is rarely true for urgent issues

### Warning Signs
- `php artisan horizon:notification` has never been run
- The `App\Notifications\HorizonNotification` class uses default `via()` method (mail)
- Production queue alerts go to a shared email inbox checked every 30-60 minutes
- Alert emails are found in spam or filtered by email rules
- On-call engineer says "I didn't see the alert" after a queue incident

### Why Harmful
Email is asynchronous and passive — it requires the recipient to be actively checking email. A production queue backup goes unaddressed for 45 minutes while Slack would have gotten immediate attention. Email filters may route Horizon alerts to spam or promotions folders. Shared inboxes suffer from "diffusion of responsibility" — everyone assumes someone else will handle it.

### Consequences
- Delayed incident response (30-60+ minutes)
- Missed alerts (spam, filtered, ignored)
- Responsibility diffusion in shared inboxes
- SLA violations from delayed queue issue response
- On-call team doesn't trust the alerting system

### Alternative
- Prefer Slack or PagerDuty for actionable alerts:
  ```bash
  php artisan horizon:notification
  # Then customize the generated class:
  ```
  ```php
  public function via($notifiable): array
  {
      return ['slack']; // Real-time delivery
  }
  ```
- Use email for non-actionable daily summaries only

### Refactoring Strategy
1. Run `php artisan horizon:notification` to publish custom notification class
2. Configure Slack webhook or PagerDuty integration
3. Update `via()` method to use Slack/PagerDuty
4. Test notification delivery by temporarily lowering a queue threshold
5. Keep email for daily failed job summaries (non-urgent)

### Detection Checklist
- [ ] Custom notification class published (`php artisan horizon:notification` done)
- [ ] `via()` method uses Slack or PagerDuty (not email default)
- [ ] Notification delivery tested and verified
- [ ] Email only used for non-urgent daily summaries
- [ ] On-call team receives alerts in real-time channel

### Related Rules
- prefer-slack-pagerduty-over-email

### Related Skills
- Configure Horizon Notifications for Wait Time Alerts

### Related Decision Trees
- Horizon Notification Channels and Alert Strategy

---

## 4. No Notification Routing by Severity

### Category
Architecture

### Description
Sending all Horizon notifications — regardless of severity — through the same channel. A minor 30-second wait time spike in a non-critical queue triggers the same Slack alert as a critical payment queue outage. No escalation path or channel differentiation.

### Why It Happens
- Not customizing the notification class to differentiate by severity
- Assuming one channel fits all alert types
- Not considering different response times for different severities
- Limited notification infrastructure (no PagerDuty, no tiered Slack channels)
- "We'll route alerts when we have more queues" — never happens

### Warning Signs
- All queue alerts go to the same Slack channel
- No distinction between "warning" and "critical" alerts in notification content
- On-call team treats all alerts as equally urgent
- High-severity alerts lost in the noise of low-severity notifications
- No automated escalation path for persistent alerts

### Why Harmful
A minor delay in the email queue triggers the same alert as a critical payment queue outage. The on-call team cannot triage by channel — they must read each alert to determine severity. Over time, they treat all alerts as noise, and a genuinely critical outage is lost in the stream of minor notifications.

### Consequences
- All alerts treated equally — no triage by severity
- Critical alerts noisily competing with routine notifications
- Delayed response to high-severity issues
- Alert fatigue from low-severity notifications on critical channel
- No escalation path (first alert ignored, no follow-up to higher tier)

### Alternative
- Route by severity using custom notification logic:
  ```php
  public function via($notifiable): array
  {
      if ($this->waitTime > 600) {
          return ['slack', 'pagerduty']; // Critical — multiple channels
      }
      return ['slack']; // Warning — single channel
  }
  ```
- Use different Slack channels for different severity levels (#queue-critical, #queue-warnings)
- Implement escalation: no response in 15 minutes → notify next tier

### Refactoring Strategy
1. Classify queues by severity tier (critical, warning, informational)
2. Customize notification class to route by severity
3. Set up multiple Slack channels (#queue-critical, #queue-warnings)
4. Configure PagerDuty for critical-tier alerts
5. Implement escalation policy for persistent unacknowledged alerts

### Detection Checklist
- [ ] Notification routing differs by severity tier
- [ ] Critical alerts go to dedicated channel (Slack + PagerDuty)
- [ ] Warning alerts go to separate channel (Slack only)
- [ ] On-call team can triage by channel/severity
- [ ] Escalation path exists for unacknowledged critical alerts

### Related Rules
- supplement-notifications-with-trending

### Related Skills
- Configure Horizon Notifications for Wait Time Alerts

### Related Decision Trees
- Horizon Notification Channels and Alert Strategy

---

## 5. Relying Solely on Horizon Notifications (Ignoring Rate Limiting)

### Category
Operations

### Description
Depending entirely on Horizon's built-in notifications for queue issue detection, without understanding that Horizon rate-limits repeated notifications. After the first notification for a condition, subsequent notifications for the same condition are suppressed — a sustained queue backup only generates one initial alert.

### Why It Happens
- Not reading that Horizon has internal rate limiting for notifications
- Assuming notifications fire continuously while condition persists
- Not testing what happens when a condition lasts 30+ minutes
- No external monitoring to supplement Horizon notifications
- "We'll get an alert if something goes wrong" — one time only

### Warning Signs
- Queue backup starts at 10:00 — one notification fires
- By 10:05 the backup is worse — no additional notification
- At 13:00, operator finally notices the 3-hour backlog
- Team says "We never got an alert" — they got one, hours ago
- No external monitoring of queue depth or wait time

### Why Harmful
A queue backlog starts at 10:00 — Horizon fires one notification. By 10:05 the backlog is worse, but Horizon's rate limiting suppresses further alerts. At 13:00, an operator finally notices the 3-hour backlog. The team says "we never got an alert" — they got one at 10:00, but after acknowledging it or ignoring it, there's no follow-up. The rate limiting prevents alert storms but creates a blind spot for sustained issues.

### Consequences
- Sustained issues go undetected after initial notification
- 3+ hour queue backlogs discovered by chance, not alerting
- False confidence: "We have alerts configured"
- No escalation for worsening conditions (backlog growing from 1K to 100K jobs)
- Post-mortems reveal "we were alerted once but thought it resolved"

### Alternative
- Supplement Horizon notifications with external trend monitoring:
  - Prometheus alert: wait_time > threshold for > 30 minutes
  - Pulse dashboard with persistent queue depth tracking
  - Custom health check that checks queue depth every minute
- Implement external monitoring with real-time, repeated alerting
- Use Horizon notifications as first alert, external monitoring for sustained conditions

### Refactoring Strategy
1. Document Horizon's rate limiting behavior in the team runbook
2. Implement external queue monitoring (Prometheus, DataDog, Pulse)
3. Set up persistent condition alerts (e.g., wait_time high for > 30 min)
4. Configure escalation: first alert → 15 minutes → page again
5. Test end-to-end: simulate sustained queue backup, verify repeated alerts

### Detection Checklist
- [ ] Team understands Horizon notification rate limiting
- [ ] External monitoring supplements Horizon notifications
- [ ] Persistent condition alerts in place (e.g., high wait time for > 30 min)
- [ ] Escalation for unacknowledged alerts
- [ ] Sustained queue backups generate repeated alerts
- [ ] Rate limiting documented in runbook

### Related Rules
- supplement-notifications-with-trending

### Related Skills
- Configure Horizon Notifications for Wait Time Alerts

### Related Decision Trees
- Horizon Notification Channels and Alert Strategy
