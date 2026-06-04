# Escalated Laravel

## Metadata
- **Domain:** Governance & Compliance Engineering
- **Subdomain:** sla-management
- **Knowledge Unit:** Escalated Laravel
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Escalated Laravel patterns implement automated incident escalation workflows within Laravel applications, ensuring that SLA breaches, system failures, and critical events are promptly escalated to the right team members through configurable notification channels. For SLA-bound applications, automated escalation prevents missed service level targets by engaging human operators before SLA violations occur.

---

## Core Concepts

- **Escalation policies** define who gets notified, when, and through which channel based on event severity
- **Escalation levels** (L1, L2, L3) represent increasing severity and response urgency
- **Timers and thresholds** trigger escalation after specific durations without resolution
- **Notification channels** include email, SMS, Slack, PagerDuty, webhooks, and custom channels
- **Acknowledgment tracking** ensures escalations are received and acted upon
- **Escalation paths** define the chain of contacts (on-call engineer, team lead, manager, director)

---

## Mental Models

- **The Fire Alarm:** Like a building fire alarm system — a small smoke detector issue escalates to audible alarm (L1), then building evacuation (L2), then fire department dispatch (L3).
- **The Hospital Code System:** Code Blue (immediate life threat), Code Yellow (significant concern), Code Green (routine escalation) — each triggers different response teams and procedures.
- **The Military Chain of Command:** An issue is first handled by the soldier (L1 on-call), escalated to sergeant (L2 lead), then lieutenant (L3 manager), and finally captain (executive).

---

## Internal Mechanics

An escalation engine runs as a scheduled Laravel command that checks active alerts, incidents, and SLA timers against escalation policies. When a condition triggers escalation, the engine dispatches notifications to the configured contacts for that level, creates an escalation record, and starts a timer for the next escalation level. Contacts acknowledge notifications, which halts further escalation. If acknowledgment is not received within the configured timeout, the next escalation level fires. The escalation chain continues until acknowledgment or the final level is reached.

---

## Patterns

**Time-Based Escalation Pattern:** Escalate if an incident or SLA breach is not resolved within defined time windows (10 min L1, 30 min L2, 60 min L3). Benefit: Predictable escalation cadence. Tradeoff: Rigid timeframes may not fit all incident types.

**Severity-Based Escalation Pattern:** Escalate based on incident severity (critical immediately escalates to L2, major escalates to L1, minor no escalation). Benefit: Proportional response effort. Tradeoff: Severity classification must be accurate.

**Chain-of-Command Escalation Pattern:** Predefined contact list with fallback — if first contact doesn't acknowledge, escalate to next in chain. Benefit: Guaranteed coverage without single points of failure. Tradeoff: Complex contact management.

---

## Architectural Decisions

Use severity-based escalation as the primary pattern with time-based triggers for acknowledgment. Implement notification channels that support acknowledgment (Slack with interactive buttons, PagerDuty, SMS with reply). Store escalation history for compliance and post-incident review. Integrate escalation with incident management (create and link escalation records). Implement escalation testing — automated tests that verify escalation paths work.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Automated incident response | Escalation policy configuration complexity | Faster response times but policy management overhead |
| Guaranteed escalation to available contact | Contact list maintenance | Reliable coverage but needs regular contact updates |
| Multi-channel notifications | Channel integration maintenance | Redundant delivery but integration failures |
| Escalation history for compliance | Escalation storage and management | Audit trail but additional data storage |

---

## Performance Considerations

The escalation engine runs on a schedule (typically every 1-5 minutes). Escalation checks are lightweight queries against active alerts. Notification delivery depends on channel latency (email: seconds to minutes, SMS/IM: seconds). Escalation records are low volume — minimal storage impact. For large-scale systems, use a dedicated queue for escalation processing.

---

## Production Considerations

Test escalation paths regularly — automated weekly tests that trigger test escalations and verify delivery. Maintain current contact information for all escalation levels. Implement escalation notification receipts — verify delivery success. Monitor escalation engine health — missed escalation checks are critical failures. Implement escalation override for known incidents (prevent spurious escalations during active incidents). Document escalation procedures in runbooks.

---

## Common Mistakes

**Escalation fatigue from too many triggers** — frequent low-severity escalations desensitize responders. Configure severity thresholds to minimize false alarms.

**Not testing escalation paths** — escalation that fires but nobody gets is worse than no escalation. Test all paths regularly.

**Single point of failure in escalation chain** — one person being unreachable blocks the entire escalation. Always have backup contacts for each level.

---

## Failure Modes

- **Notification channel failure:** Escalation never reaches the contact. Use multiple channels for critical escalations.
- **Contact information stale:** Fired employee still listed as on-call. Maintain contact list via HR system integration.
- **Acknowledgment system failure:** Acknowledgment received but not processed. Have manual acknowledgment fallback.
- **Escalation engine failure:** Scheduled command doesn't run. Monitor engine execution and alert on missed runs.

---

## Ecosystem Usage

Laravel applications implement escalation workflows using: Laravel's notification system with multiple channels, scheduled tasks for escalation checking, queue jobs for notification delivery, event system for escalation triggers, and database for escalation policy configuration. Packages like `spatie/laravel-webhook-client`, `laravel/slack-notification-channel`, and notification channels for PagerDuty and Twilio SMS provide integration options.

---

## Related Knowledge Units

### Prerequisites
- Laravel Notification System
- Laravel Scheduling
- Incident Management Fundamentals

### Related Topics
- SLA Timer (SLA tracking for escalation triggers)
- Queue Autoscale SLA (queue-based SLA monitoring)
- Laravel Service Desk (incident management integration)

### Advanced Follow-up Topics
- Automated Incident Response Runbooks
- On-Call Schedule Management
- Escalation Analytics and Post-Incident Review

---

## Research Notes

Effective escalation is about reliability of delivery, not speed — a 5-minute delay in escalation is acceptable if the escalation actually reaches someone. The most common failure in escalation systems is stale contact information. Integration with HR systems or identity providers (Active Directory, Okta) for contact management is essential. The escalation chain should have a "final resort" contact who is always available (after-hours service, executive contact) — this prevents escalation chains from reaching the end without resolution.
