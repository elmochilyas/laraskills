# SLA Timer

## Metadata
- **Domain:** Governance & Compliance Engineering
- **Subdomain:** sla-management
- **Knowledge Unit:** SLA Timer
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

SLA Timer implements precise time tracking for Service Level Agreement compliance, measuring elapsed time against agreed response and resolution targets for support tickets, service requests, and automated processes. For Laravel applications with SLA commitments, accurate timer management is essential for demonstrating compliance, identifying at-risk items, and triggering automated escalations.

---

## Core Concepts

- **SLA clock** measures elapsed time from an SLA start event (ticket creation, job queued, request received)
- **Pause conditions** stop the SLA clock during periods when the clock should not run (waiting on customer, out of hours)
- **SLA thresholds** define warning and breach points as a percentage of total allowed time
- **Business hours** define when the SLA clock is running — 24/7, business hours only, or custom schedules
- **SLA tiers** define different time targets for different service levels (premium, standard, basic)
- **SLA breach** occurs when elapsed time exceeds the target without resolution

---

## Mental Models

- **The Parking Meter:** Like a parking meter, the SLA timer starts when the ticket is created (parked). Time runs until the ticket is resolved (meter expires) or the ticket is paused (customer waiting is like a grace period).
- **The Shot Clock:** Like a basketball shot clock, the SLA timer counts down from the target time. If it reaches zero (breach) without resolution, a violation is recorded.
- **The Cooking Timer:** Different dishes (ticket types) have different cooking times (SLA targets). Some dishes need constant attention (active timer), others can be left to simmer (paused timer).

---

## Internal Mechanics

An SLA timer is implemented as a service that tracks elapsed time for each SLA-bound entity. The timer stores start time, total elapsed time (sum of active periods), current state (running/paused), pause history, and business hours schedule. The elapsed time is calculated as: current time minus start time minus total paused duration, adjusted for business hours if applicable. A scheduled job runs periodically (every minute) to check all active timers, update elapsed time, check thresholds (50%, 75%, 90%, 100%), and trigger events at each threshold.

---

## Patterns

**Business Hours SLA Pattern:** Only count time during defined business hours (Mon-Fri, 9 AM-5 PM, excluding holidays). Benefit: Realistic SLA targets for non-24/7 support operations. Tradeoff: Business hours configuration complexity, especially for global teams across time zones.

**Paused SLA Pattern:** Pause the SLA clock when waiting on customer action, resume when customer responds. Benefit: Fair SLA measurement — doesn't penalize for customer delays. Tradeoff: Requires accurate pause/resume event tracking.

**Tiered SLA Pattern:** Different SLA targets per customer tier — premium customers get shorter targets. Benefit: Differentiated service levels, incentivizes upgrades. Tradeoff: Multiple timer configurations to maintain.

---

## Architectural Decisions

Implement SLA timers as a dedicated service rather than embedded in ticket/job models for separation of concerns. Store timer state in the database for persistence, use cache for real-time monitoring. Use a scheduled command for timer updates (every minute is sufficient for most SLA targets). Trigger events at threshold percentages rather than polling timers continuously. Implement timer pausing as explicit pause/resume events rather than automatic detection of customer waiting state.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Precise SLA tracking | Timer infrastructure and processing | Accurate compliance data with processing overhead |
| Business hours support | Business hours configuration | Realistic targets but setup complexity for global teams |
| Threshold-based alerting | Threshold configuration per SLA tier | Proactive breach prevention with configuration effort |
| Tiered SLA support | Multiple SLA policies to manage | Differentiated service with policy maintenance |

---

## Performance Considerations

Timer updates run on a schedule (typically every 60 seconds) — minimal CPU impact. Timer state queries on each scheduled run — index entities by timer status. Real-time threshold alerts use event system — negligible latency. Business hours calculation adds processing per timer — cache business hours definitions. For large numbers of active timers (10,000+), process in batches and consider dedicated queue workers.

---

## Production Considerations

Monitor timer processing health — missed timer updates mean inaccurate SLA tracking. Test business hours configuration with time zone edge cases (DST transitions, holidays). Implement SLA breach replay — if timer was paused incorrectly, recalculate elapsed time. Export SLA compliance data for customer reporting. Implement SLA timer audit log — track timer pauses, resumes, and breaches. Set up SLA breach dashboard for real-time visibility.

---

## Common Mistakes

**Not accounting for business hours correctly** — a ticket created at 4:55 PM with a 1-hour SLA target should not breach at 5:55 PM. Pause timer after business hours end.

**Pausing timer for internal work** — timer should not be paused for internal processing, only for waiting on customer. Document pause criteria clearly.

**Inconsistent timer start times** — if SLA starts at ticket creation but the ticket system has delays, the timer is inaccurate. Start timer from confirmed receipt time.

---

## Failure Modes

- **Timer update skip:** Scheduled command fails to run, timers don't advance. Monitor command execution and alert on failures.
- **Business hours misconfiguration:** Holiday calendar not updated, timer runs during holiday. Maintain holiday calendar integration.
- **Pause/resume mismatch:** Timer paused but never resumed, showing artificially good SLA. Monitor long-running paused timers.
- **Time zone calculation error:** DST transition causes incorrect elapsed time calculation. Use UTC for storage, convert for display.

---

## Ecosystem Usage

Laravel applications implement SLA timers using: scheduled commands for timer processing, event system for threshold notifications, database or Redis for timer state, and custom service classes for timer logic. SLA timers integrate with service desk tickets (ticket lifecycle events trigger timer start/pause/resume), queue monitoring (job processing time tracking), and escalation workflows (SLA breach triggers escalation).

---

## Related Knowledge Units

### Prerequisites
- Laravel Scheduling
- Laravel Event System
- Business Hours and Time Zone Management

### Related Topics
- Escalated Laravel (SLA breach triggers escalation)
- Laravel Service Desk (SLA in ticket management)
- Queue Autoscale SLA (SLA for queue processing)

### Advanced Follow-up Topics
- Predictive SLA Breach Detection
- Multi-Region SLA Tracking with Time Zones
- Customer-Facing SLA Compliance Dashboards

---

## Research Notes

SLA timer accuracy is critical for both compliance (proving SLA targets were met) and operations (knowing when to escalate). The most common SLA timer errors come from: paused timers not being resumed, business hours configuration gaps, and inconsistent timer start/stop events. For Laravel applications, the scheduled command approach for timer updates (every 60 seconds) provides sufficient granularity for most SLA targets (measured in hours or days). For applications with sub-minute SLA targets, real-time timer updates via queue or event system are needed instead of scheduled polling.
