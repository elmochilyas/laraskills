# Metadata

**Domain:** Real-Time Systems
**Subdomain:** Channel Types & Authorization
**Knowledge Unit:** Ghost Member Cleanup in Presence Channels
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Category |
|---|----------|----------|
| 1 | Cleanup mechanism: Redis TTL vs pulse/prune vs both | performance |
| 2 | Activity timeout tuning | performance |

---

# Architecture-Level Decision Trees

---

## Cleanup Mechanism Selection

---

## Decision Context

Which ghost member cleanup strategy to use based on scaling driver.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Using Reverb with Redis scaling driver?
↓
YES → **Both Redis TTL + pulse/prune** — Redis TTL for auto-cleanup, pulse for state persistence
NO → Using database scaling driver (Laravel 13+)?
    ↓
    YES → **Scheduled prune job** — `reverb:prune` via scheduler; no Redis TTL available
    NO → Single-server with default driver?
        ↓
        YES → **Redis TTL** — simplest, automatic cleanup

---

## Rationale

Redis TTL provides automatic ghost member removal without application-level scheduling. Pulse/prune provides eventual consistency for connection state. The database scaling driver lacks TTL-based auto-cleanup and requires a scheduled prune command.

---

## Recommended Default

**Default:** Redis TTL (2x activity timeout) + pulse/prune cycle for Redis-based deployments
**Reason:** Defense in depth: TTL catches ghosts missed by pulse, pulse catches ghosts before TTL expiry.

---

## Risks Of Wrong Choice

Redis TTL alone may prematurely remove legitimate connections during network blips if set too aggressively. Pulse/prune alone may miss ghosts if the prune interval is too long. Database scaling driver without scheduled prune leaves ghosts indefinitely.

---

## Related Rules

Always Configure Both TTL and Pulse/Prune for Redis, Schedule Prune Command for Database Driver

---

## Related Skills

Clean Up Ghost Members in Presence Channels

---

---

## Activity Timeout Tuning

---

## Decision Context

Setting the activity timeout threshold that determines when a connection is considered dead.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Connection churn rate is high (frequent joins/leaves)?
↓
YES → Network conditions reliable (low packet loss)?
    ↓
    YES → **Shorter timeout (15-30s)** — aggressive cleanup
    NO → **Longer timeout (30-60s)** — prevent premature pruning during network blips
NO → Connections are long-lived and stable?
    ↓
    YES → **Longer timeout (60-120s)** — reduce unnecessary keepalive traffic
    NO → **Default (30s)** — balanced for most applications

---

## Rationale

Activity timeout determines how long Reverb waits without receiving data before initiating a ping. If the ping goes unanswered, the connection is considered dead and cleaned up. Setting this too short prunes legitimate connections during network hiccups; too long leaves ghosts persisting.

---

## Recommended Default

**Default:** 30s activity timeout, 60s pulse interval
**Reason:** Balances ghost cleanup speed with tolerance for transient network issues; matches typical reconnection window.

---

## Risks Of Wrong Choice

Too-short timeout causes legitimate disconnections during brief network interruptions. Too-long timeout allows ghosts to persist for minutes, inflating member counts and Redis memory.

---

## Related Rules

Tune Activity Timeout to Connection Churn Rate

---

## Related Skills

Clean Up Ghost Members in Presence Channels
