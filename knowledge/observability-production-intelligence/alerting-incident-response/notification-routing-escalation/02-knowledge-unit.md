# Notification Routing & Escalation

## Metadata
- **Domain:** Observability & Production Intelligence
- **Subdomain:** 08-alerting-incident-response
- **Knowledge Unit:** notification-routing-escalation
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

Notification routing and escalation define how alerts reach the right person at the right time — and what happens when they don't respond. Proper routing ensures every alert is acknowledged and handled 24/7, while grouping, inhibition, and escalation prevent notification storms and missed incidents.

---

## Core Concepts

- **Route:** Configuration mapping alert labels to notification targets — `severity: critical` + `service: payments` → payments team on-call
- **Receiver:** Notification target — email, Slack channel, PagerDuty, Opsgenie, webhook
- **On-Call Schedule:** Rotation of responders — primary/secondary, weekly, daily rotation, integrated with PagerDuty or Opsgenie
- **Escalation:** Notifying additional responders when primary does not acknowledge within timeout — primary (5min) → secondary → manager
- **Grouping:** Combining similar alerts into one notification — prevents notification storms during cascading failures
- **Inhibition:** Suppressing low-severity alerts when higher-severity alert is firing — database down (SEV1) suppresses connection warnings (SEV3)
- **Silence:** Muting alerts for a specific period — used during maintenance windows

---

## Mental Models

- **Phone Tree Model:** Alert routing works like a phone tree — start at the top (primary on-call), if no answer, move to the next person, then the next, until someone picks up
- **Water Valve Model:** Grouping is a valve that controls the flow of notifications — during a cascade (100 database timeout alerts), the valve groups them into one notification instead of 100
- **Security Guard Model:** Inhibition is a security guard that says "don't bother the boss with the parking lot light being out when the building is on fire" — low-severity alerts wait during high-severity incidents

---

## Internal Mechanics

Alert routing follows a pipeline: Alert fires in monitoring system (Prometheus, Grafana) → Alertmanager receives the alert → evaluates routing rules → applies grouping and inhibition → determines receiver → sends notification → acknowledgment timeout starts → if not acknowledged, escalates to next responder. Routes are evaluated in order — first matching route wins. Specific routes (matching multiple labels) should be defined before generic routes (matching one label).

---

## Patterns

- **Route by Service + Severity:** Critical payments alerts → payments team on-call; warning infrastructure alerts → platform team. Benefit: accurate targeting reduces alert fatigue. Tradeoff: requires label standardization across alerts.
- **Grouping with Inhibit:** Group by `alertname` and `service` with 5-minute group wait; inhibit SEV3 during SEV1. Benefit: one notification per event type during cascade. Tradeoff: grouping delays first notification by `group_wait`.
- **Layered Escalation:** Primary responder has 5 minutes to acknowledge → secondary → manager → incident commander. Benefit: ensures every alert is handled. Tradeoff: escalation time accumulates — SEV1 could take 15+ minutes to reach manager.

---

## Architectural Decisions

**Route alerts by service and severity combination.** Critical alerts for payments should route to the payments team on-call. Low-severity alerts route to the infrastructure team. Clear routing prevents alert fatigue for unrelated responders.

**Set acknowledgment timeouts to 5 minutes for critical alerts.** Primary responder has 5-10 minutes to acknowledge. Escalate if not acknowledged. Unacknowledged alerts are the most common cause of missed incidents.

**Use grouping to prevent notification storms.** Group by `alertname` and `service` with 5-minute group wait. During a cascade, 50 alerts become 1 notification.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Route by service + severity targets the right person | Requires consistent label configuration | Define label standards upfront |
| Grouping prevents notification storms | Group wait delays first notification (30s default) | Acceptable for most alerts; reduce for critical |
| Escalation ensures no alert goes unanswered | Escalation chains add time before resolution | Set shorter timeouts for SEV1 alerts |

---

## Performance Considerations

Prometheus evaluates alert rules every 30-60s; Alertmanager processes sub-second. Notification delivery: PagerDuty/Slack 1-5s, SMS 10-30s, email 1-5min. Group buffer delays notification by `group_wait` (default 30s). Escalation timer resolution is approximate — most systems check every minute.

---

## Production Considerations

Alerts may contain sensitive information — configure notification templates to include only necessary context. On-call schedules reveal team member availability — PagerDuty/Opsgenie handle this with appropriate access controls. Webhook receivers must validate incoming notifications — configure shared secrets or mTLS.

---

## Common Mistakes

**No grouping** — every alert triggers a separate notification. During a 100-alert cascade, the responder receives 100 notifications. Critical alerts are buried in noise.

**No inhibition** — low-severity alerts continue during a high-severity incident. Responders are distracted by "cache is slow" while handling a complete database outage.

**Escalation timeout too long** — primary has 30 minutes to acknowledge. By the time escalation reaches someone, the incident has been active for 45 minutes.

**Catch-all route matches everything** — a generic route without specific label matchers catches alerts meant for other teams.

**No silence mechanism during maintenance** — engineers disable alerting globally instead of creating a silence, then forget to re-enable.

---

## Failure Modes

**Escalation chain fatigue:** Repeated escalations to the same responders cause burnout. Detection: responders ignore escalations. Mitigation: rotate on-call schedules; distribute escalation across team.

**Notification channel failure:** PagerDuty or Slack goes down. Detection: alerts not delivered. Mitigation: configure multiple notification channels per receiver (e.g., Slack + email + phone).

**Grouping hides important variation:** Two different alert causes grouped into one notification. Detection: responders miss distinct failure signals. Mitigation: group by `alertname` + `service` combination, not just `alertname`.

---

## Ecosystem Usage

Prometheus Alertmanager handles routing, grouping, inhibition, and silencing for Prometheus-based monitoring. Grafana alerting provides similar functionality within Grafana. PagerDuty and Opsgenie provide on-call scheduling, escalation, and notification delivery. Laravel applications typically use Alertmanager for infrastructure alerts and Sentry/Flare for application-level error alerts.

---

## Related Knowledge Units

### Prerequisites
- Prometheus alerting rules or Grafana alerting

### Related Topics
- Incident Management Workflows (what happens after notification)

### Advanced Follow-up Topics
- Automated incident response (auto-remediation before escalation)
- Alertmanager configuration as code

---

## Research Notes

Route by service + severity labels for accurate targeting. Group alerts to prevent notification storms during cascading failures. Set acknowledgment timeout to 5 minutes for critical alerts. Inhibit low-severity alerts during high-severity incidents. Use PagerDuty/Opsgenie for 24/7 on-call with phone call notifications. Test routing and escalation with fire drills.
