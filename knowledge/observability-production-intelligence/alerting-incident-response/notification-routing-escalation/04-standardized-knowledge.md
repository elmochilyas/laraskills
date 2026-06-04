# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 08-alerting-incident-response
**Knowledge Unit:** notification-routing-escalation
**Difficulty:** Advanced
**Category:** Alerting Infrastructure
**Last Updated:** 2026-06-03

# Overview

Notification routing and escalation define how alerts reach the right person at the right time — and what happens when they don't respond. For Laravel applications, this involves configuring Alertmanager (or equivalent) to route alerts to on-call schedules, escalate unanswered alerts, and deduplicate notifications.

Without proper routing, alerts go to the wrong person, are ignored because they're not actionable, or overwhelm responders with duplicates. Escalation ensures that every alert is acknowledged and handled, even when the primary responder is unavailable.

Engineers should care because alert routing and escalation are the bridge between "something is wrong" and "someone is fixing it." A well-configured notification system ensures incidents are detected and responded to 24/7, not just during business hours.

# Core Concepts

**Route:** A configuration that maps alert labels to notification targets. Alerts with `severity: critical` and `service: payments` route to the payments team's on-call schedule.

**Receiver:** A notification target. Examples: email, Slack channel, PagerDuty, Opsgenie, webhook. Each receiver handles a specific notification channel.

**On-Call Schedule:** A rotation of responders who receive alerts during their shift. Common patterns: primary/secondary, weekly rotation, daily rotation. Integrated with PagerDuty or Opsgenie.

**Escalation:** The process of notifying additional responders when the primary responder does not acknowledge an alert within a configured timeout. Example: primary on-call has 5 minutes to acknowledge → escalation to secondary → escalation to manager.

**Grouping:** Combining similar alerts into a single notification. Alerts for the same service with the same severity are grouped to prevent notification storms during cascading failures.

**Inhibition:** Suppressing low-severity alerts when a higher-severity alert is firing. When the database is down (SEV1), suppress database-connection-warning (SEV3) alerts.

**Silence:** Muting alerts for a specific period with a matcher expression. Used during maintenance windows to prevent known alerts from triggering.

**Acknowledgement:** A responder confirms they have seen the alert and are working on it. Acknowledgment stops escalation but does not resolve the alert.

# When To Use

- **All production alerting systems** that need to reach human responders
- **Teams with on-call rotations** — ensuring the right person is notified
- **24/7 operations** — alerts outside business hours need escalation chains

# When NOT To Use

- **Non-critical alerts** that can wait for business hours
- **Development environments** that don't need on-call response

# Best Practices

**Route alerts by service and severity.** Critical alerts for the payments service should route to the payments team's on-call. Low-severity infrastructure alerts route to the infrastructure team. Clear routing prevents alert fatigue for unrelated responders.

**Set acknowledgment timeouts.** Primary responder has 5-10 minutes to acknowledge. Escalate if not acknowledged. Unacknowledged alerts are the most common cause of missed incidents.

**Use grouping to prevent notification storms.** Group by `alertname` and `service` with 5-minute group wait. During a cascade, 50 database-connection alerts become 1 notification.

**Inhibit low-severity alerts during high-severity incidents.** When a SEV1 is declared, suppress related SEV3 alerts. Responders working on the outage do not need notifications about related non-critical issues.

**Test routing and escalation regularly.** Fire test alerts to verify routing, notification delivery, and escalation paths. Test during schedule handoffs to ensure new responders receive alerts.

# Architecture Guidelines

Alert routing pipeline:
1. **Alert fires** in monitoring system (Prometheus, Grafana)
2. **Alertmanager** receives the alert, evaluates routing rules
3. **Grouping & inhibition** applied
4. **Receiver** determined by route matching
5. **Notification sent** (PagerDuty, Slack, email)
6. **Acknowledgment timeout** starts
7. **Escalation** if not acknowledged
8. **Alert resolved** or manually closed

Routes are evaluated in order. First matching route wins. Specific routes (matching multiple labels) should be defined before generic routes (matching one label).

# Performance Considerations

- **Alert evaluation latency:** Prometheus evaluates alert rules every 30-60s. Alertmanager processes alerts sub-second
- **Notification delivery time:** PagerDuty/Slack: 1-5 seconds. SMS: 10-30 seconds. Email: 1-5 minutes
- **Group buffer:** Grouping delays notification by `group_wait` (default 30s). Acceptable for most alerts but consider reducing for critical alerts
- **Escalation timer resolution:** Most escalation systems check every minute. Escalation timing is approximate, not exact

# Security Considerations

- **Notification content security:** Alerts may contain sensitive information (endpoint names, IP addresses, error messages). Configure notification templates to include only necessary context
- **On-call responder privacy:** On-call schedules reveal team member availability. PagerDuty/Opsgenie handle this with appropriate access controls
- **Webhook receiver security:** Webhook receivers must validate incoming notifications. Configure shared secrets or mTLS

# Common Mistakes

**No grouping.** Every alert triggers a separate notification. During a cascade of 100 alerts, the responder receives 100 notifications. Critical alerts are buried in noise.

**No inhibition.** Low-severity alerts continue firing during a high-severity incident. Responders are distracted by "cache is slow" notifications while handling a complete database outage.

**Escalation timeout too long.** Primary responder has 30 minutes to acknowledge. By the time escalation reaches someone, the incident has been active for 45 minutes. Set acknowledgement timeout to 5 minutes.

**Catch-all route matches everything.** A generic route without specific label matchers catches alerts meant for other teams. Define specific routes first, catch-all last.

**No silence mechanism during maintenance.** Engineers disable alerting globally during maintenance instead of creating a silence. They forget to re-enable it.

# Anti-Patterns

**Email-only notifications.** Sending all alerts via email. Email notifications are easily missed, delayed, and not actionable from a phone. Use push notifications (PagerDuty, Slack) for critical alerts.

**No escalation for SEV1s.** Critical alerts go to one person with no escalation. If that person is in a meeting, asleep, or on vacation, the alert goes unhandled for hours.

**Duplicate notifications across channels.** Alert fires → sends to Slack, email, and PagerDuty simultaneously. Responders get 3 notifications for 1 alert. Choose one primary notification channel per severity.

**Routing by alert name only.** `alertname="HighErrorRate"` matches all services. A payments error alert goes to the infrastructure team. Route by `service` + `severity` combination.

# Examples

**Alertmanager route config:**
```yaml
route:
  group_by: ['alertname', 'service']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  routes:
  - match:
      severity: critical
    receiver: pagerduty-critical
    repeat_interval: 10m
  - match:
      severity: warning
    receiver: slack-warnings
```

# Related Topics

**Prerequisites:**
- Prometheus alerting rules or Grafana alerting

**Closely Related Topics:**
- Incident Management Workflows (what happens after notification)

**Advanced Follow-Up Topics:**
- Automated incident response (auto-remediation before escalation)
- Alertmanager configuration as code

**Cross-Domain Connections:**
- DevOps & Infrastructure — Alertmanager server deployment

# AI Agent Notes

- Route by service + severity labels for accurate targeting
- Group alerts to prevent notification storms during cascading failures
- Set acknowledgment timeout to 5 minutes for critical alerts
- Inhibit low-severity alerts during high-severity incidents
- Use PagerDuty/Opsgenie for 24/7 on-call with phone call notifications
- Test routing and escalation with fire drills
- Silence alerts during maintenance instead of disabling monitoring globally
