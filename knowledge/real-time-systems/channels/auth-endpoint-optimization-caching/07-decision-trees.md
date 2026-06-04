# Metadata

**Domain:** Real-Time Systems
**Subdomain:** Channel Types & Authorization
**Knowledge Unit:** Auth Endpoint Optimization & Caching
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Category |
|---|----------|----------|
| 1 | Auth caching strategy | performance |
| 2 | Cache TTL and stampede prevention | performance |
| 3 | Rate limiting for auth endpoint | security |

---

# Architecture-Level Decision Trees

---

## Auth Caching Strategy

---

## Decision Context

Whether to cache channel authorization decisions and at what level.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Expected concurrent connections > 1,000?
↓
YES → Auth callback performs database queries?
    ↓
    YES → **Cache auth decisions** — `Cache::remember("auth:{channel}:{user}", TTL, ...)`
    NO → Simple ID comparison (no queries)?
        ↓
        YES → Caching optional — ID comparisons are fast (<1ms)
        NO → **Cache auth decisions**
NO → Reconnection storms possible (deployments, network issues)?
    ↓
    YES → **Cache auth decisions** — prevent auth endpoint meltdown
    NO → Caching optional at low volume

---

## Rationale

Auth caching reduces database load during normal operation and is critical during reconnection storms when thousands of clients simultaneously request authorization. Each cache hit saves a database query and callback execution.

---

## Recommended Default

**Default:** Cache auth decisions with Redis backend and 5-minute TTL
**Reason:** Prevents database overload during reconnection storms; cache invalidation at 5min balances freshness with load reduction.

---

## Risks Of Wrong Choice

No caching causes cascading database failure during reconnection storms. Too-long TTL serves stale authorization decisions after permission changes.

---

## Related Rules

Always Cache Auth Decisions at Scale, Implement Cache Stampede Prevention

---

## Related Skills

Authorize Private and Presence Channels in routes/channels.php

---

---

## Cache TTL and Stampede Prevention

---

## Decision Context

How to set cache expiration and prevent stampede when many entries expire simultaneously.

---

## Decision Criteria

* performance
* security

---

## Decision Tree

Permissions change infrequently (hours/days)?
↓
YES → Expected concurrent auth requests > 100/sec?
    ↓
    YES → **Long TTL (5-15 min) + jitter** — randomize expiry to prevent stampede
    NO → **Standard TTL (5 min)** — acceptable
NO → Permissions change frequently (minutes)?
    ↓
    YES → **Short TTL (30-60s) + mutex locking** — prevent stampede on expiry
    NO → Cache at all?
        ↓
        YES → **TTL with early recomputation** — refresh cache before expiry

---

## Rationale

Cache stampede occurs when many auth decisions expire simultaneously (e.g., all users cached during a deploy). Without prevention, all clients trigger database queries simultaneously, overwhelming the database.

---

## Recommended Default

**Default:** 5-minute TTL with +/- 30s jitter to stagger expiry
**Reason:** Balances freshness with load reduction; jitter prevents synchronized expiry storms.

---

## Risks Of Wrong Choice

No jitter causes synchronized cache expiry, creating periodic load spikes. No stampede prevention causes database meltdown during post-deploy reconnection storms.

---

## Related Rules

Implement Cache Stampede Prevention

---

## Related Skills

Manage Redis Dependency and Failure Modes for Reverb

---

---

## Rate Limiting for Auth Endpoint

---

## Decision Context

How to configure rate limiting for the `/broadcasting/auth` endpoint.

---

## Decision Criteria

* security
* performance

---

## Decision Tree

Application expects > 100 concurrent WebSocket users?
↓
YES → Expected reconnection storms during deployments?
    ↓
    YES → **Higher rate limit (200-500/min per IP)** with burst allowance
    NO → **Standard throttle (60-120/min per IP)**
NO → Publicly accessible auth endpoint (not internal-only)?
    ↓
    YES → **Apply throttling** — prevent DoS via auth endpoint
    NO → Internal-only endpoint?
        ↓
        YES → Rate limiting optional but recommended

---

## Rationale

The auth endpoint is the chokepoint for all private/presence channel subscriptions. Without rate limiting, a reconnection storm or DoS attack can overwhelm the application server, database, and queue system.

---

## Recommended Default

**Default:** `throttle:100,1` middleware on `/broadcasting/auth`
**Reason:** Allows ~100 auth requests per second per IP, sufficient for most applications while preventing abuse. Adjust upward based on expected reconnect rate.

---

## Risks Of Wrong Choice

Too-low rate limits throttle legitimate reconnection traffic during storms. No rate limiting leaves the auth endpoint vulnerable to DoS and cascading failure.

---

## Related Rules

Always Apply Auth Middleware and Rate Limiting to `Broadcast::routes()`

---

## Related Skills

Configure and Operate Laravel Broadcasting Architecture
