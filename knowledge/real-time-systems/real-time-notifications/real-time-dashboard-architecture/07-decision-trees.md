# Metadata

**Domain:** Real-Time Systems
**Subdomain:** Real-Time Notifications
**Knowledge Unit:** Real-Time Dashboard Architecture
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Category |
|---|----------|----------|
| 1 | Broadcast frequency and aggregation strategy | performance |
| 2 | Private vs presence channels for dashboards | architectural |

---

# Architecture-Level Decision Trees

---

## Broadcast Frequency and Aggregation

---

## Decision Context

How often to broadcast dashboard metrics and whether to pre-aggregate.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Metrics change more frequently than human perception threshold (200ms)?
↓
YES → **Pre-aggregate before broadcasting** — window summaries (count, avg, p95)
    ↓
    Window interval?
    ↓
    Real-time critical (ops monitoring)? → **1-5s window**
    Business metrics? → **5-15s window**
NO → Metrics change at human-perceivable rates?
    ↓
    YES → **Broadcast per-event** — acceptable for low-frequency updates
    NO → Consider not using real-time at all
    ↓
    Update frequency < 30s? → **Short polling** is simpler

---

## Rationale

Aggregate-first, broadcast-second prevents overwhelming the broadcast system. Broadcasting individual events at sub-second intervals creates unnecessary WebSocket messages and Redis pub/sub load. Human-dashboard users cannot perceive updates faster than 200ms.

---

## Recommended Default

**Default:** 5-second aggregation window, broadcast window summary
**Reason:** Matches human perception; reduces broadcast frequency by orders of magnitude; pre-aggregation avoids client-side computation.

---

## Risks Of Wrong Choice

Broadcasting individual events overwhelms the broadcast system. Too-long aggregation windows (>15s) make dashboards feel stale. Too-short windows waste resources on imperceptible updates.

---

## Related Rules

Pre-Aggregate Before Broadcasting, Use Timer-Based Metric Dispatch

---

## Related Skills

Architect Real-Time Dashboards

---

---

## Private vs Presence Channels for Dashboards

---

## Decision Context

Which channel type to use for dashboard metric delivery.

---

## Decision Criteria

* architectural
* performance

---

## Decision Tree

Dashboard shared by multiple users who need to see each other's presence?
↓
YES → Collaboration feature (multi-viewer, "who's watching")?
    ↓
    YES → **Presence channels** — join/leave awareness
    NO → **Private channel per user/team** — simpler, no join/leave overhead
NO → Single-user dashboard per session?
    ↓
    YES → **Private channel per user** — `dashboard.user.{id}`
    NO → Team-based dashboard?
        ↓
        YES → **Private channel per team** — `dashboard.team.{id}`

---

## Rationale

Presence channels add join/leave event overhead and Redis writes that are unnecessary for most dashboards. Private channels per user provide authorization without the social-awareness overhead. Only use presence when real-time collaborator visibility is a feature requirement.

---

## Recommended Default

**Default:** Private channel per user (`dashboard.user.{id}`)
**Reason:** Provides authorization without join/leave fan-out overhead; users only see their own data.

---

## Risks Of Wrong Choice

Presence channels for non-collaborative dashboards waste Redis bandwidth. Public channels for dashboards expose system metrics to unauthorized users.

---

## Related Rules

Use Private Channels Unless Multi-User Collaboration is Required

---

## Related Skills

Select and Implement Channel Types
