# Skill: Configure Horizon Notifications for Wait Time Alerts

## Purpose
Set up Horizon notification configuration in `config/horizon.php` to alert when queue wait times exceed business-defined thresholds.

## When To Use
Alerting when critical queues exceed acceptable wait times; proactive detection of worker shortages; business hours-only alerting for non-critical queues.

## When NOT To Use
Real-time per-job failure alerting (use `Queue::failing`); metrics-based SLA monitoring (Pulse or Prometheus richer); bursty queues where thresholds can't be meaningfully set.

## Prerequisites
- Pipeline notifications configured (Slack, PagerDuty, etc.)
- Baseline wait time data for threshold setting

## Inputs
- Queue names and their SLA requirements
- Notification channel (Slack, PagerDuty, email)
- Business hours restriction per queue

## Workflow
1. Set wait thresholds based on job SLA — not current metrics
2. Configure `waits` in `config/horizon.php`: `'redis:emails' => 300`
3. Set `hours` to restrict non-critical queue notifications to business hours
4. Publish custom notification class: `php artisan horizon:notification`
5. Configure notification channel: prefer Slack/PagerDuty over email
6. Supplement with external trend monitoring — Horizon rate-limits repeated notifications
7. Set thresholds above normal peak wait time to avoid alert fatigue

## Validation Checklist
- [ ] Thresholds set based on business SLA (not current metrics)
- [ ] `hours` configured for non-critical queues
- [ ] Custom notification class published and configured
- [ ] Notification channel set to Slack/PagerDuty (not email default)
- [ ] External trend monitoring supplements notifications
- [ ] Thresholds above normal peak (no alert fatigue)
- [ ] Rate limiting understood — only first notification for each condition

## Common Failures
- Threshold too low for bursty queues — constant false alerts
- No `hours` config — 24/7 alerts for non-critical queues
- Defaulting to email — alerts missed or ignored
- Not publishing notification class — wrong people notified
- Ignoring rate limiting — sustained issues don't re-alert

## Decision Points
- Critical queue (payment): 24/7 alerting, low threshold
- Bulk queue (emails): business hours only, higher threshold
- Channel: Slack for actionable, email for summaries

## Related Rules
- Rule 1: set-thresholds-based-on-sla
- Rule 2: restrict-hours-for-non-critical
- Rule 3: prefer-slack-pagerduty-over-email
- Rule 4: supplement-notifications-with-trending

## Related Skills
- Monitor Horizon Metrics — Throughput, Runtime, Wait Time
- Monitor Horizon Wait Time and Set Alerts
- Listen to `Queue::failing` for Global Failure Monitoring

## Success Criteria
Horizon notifications use SLA-based thresholds, restrict non-critical queues to business hours, deliver via real-time channels (Slack/PagerDuty), and are supplemented by external trend monitoring.
