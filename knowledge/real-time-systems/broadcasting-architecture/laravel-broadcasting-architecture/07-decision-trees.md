# Metadata

**Domain:** Real-Time Systems
**Subdomain:** Event Broadcasting Architecture
**Knowledge Unit:** Laravel Broadcasting Architecture
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Category |
|---|----------|----------|
| 1 | Reverb vs Pusher vs Ably | architectural |
| 2 | Queued vs synchronous broadcast | performance |
| 3 | Dedicated vs shared queue connection | performance |

---

# Architecture-Level Decision Trees

---

## Reverb vs Pusher vs Ably

---

## Decision Context

Choosing the broadcast driver that backs Laravel's broadcasting system.

---

## Decision Criteria

* performance
* architectural
* security
* maintainability

---

## Decision Tree

Self-host WebSocket server preferred?
↓
YES → Need first-party Laravel support?
    ↓
    YES → **Reverb** (default, PHP/ReactPHP, Pusher protocol)
    NO → Uses Node.js stack?
        ↓
        YES → **Soketi** (Node.js, Pusher protocol, open-source)
        NO → **Reverb**
NO → Need guaranteed delivery or global edge?
    ↓
    YES → **Ably** (at-least-once, 205+ PoPs, enterprise)
    NO → Need simple managed service with low cost?
        ↓
        YES → **Pusher** (managed, free tier: 200 conn, 200K msg/day)
        NO → **Ably** (6M msg/month free tier, broader features)

---

## Rationale

Reverb is the recommended default for new Laravel projects due to first-party support, zero additional cost, and Pusher protocol compatibility. Managed services (Pusher, Ably) trade cost for operational simplicity and global edge distribution. Ably's guaranteed delivery differentiates it from Pusher's fire-and-forget. Soketi is the Node.js alternative for teams already on that runtime.

---

## Recommended Default

**Default:** Reverb
**Reason:** First-party support, no per-message cost, Pusher protocol compatibility makes migration seamless if scale demands later change.

---

## Risks Of Wrong Choice

Pusher at high volume becomes expensive ($500+/mo at 10k connections). Reverb requires operational overhead for self-hosting. Ably's enterprise pricing is premium.

---

## Related Rules

Always Run a Queue Worker for Broadcast Events, Configure a Dedicated Queue Connection for Broadcasts, Always Apply Auth Middleware and Rate Limiting to `Broadcast::routes()`

---

## Related Skills

Configure and Operate Laravel Broadcasting Architecture, Set Up Reverb for Self-Hosted WebSocket

---

---

## Queued vs Synchronous Broadcast

---

## Decision Context

Whether to use the default queued broadcast path or `ShouldBroadcastNow` to bypass the queue.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Event requires sub-100ms delivery from dispatch to WebSocket?
↓
YES → Accept HTTP response time impact?
    ↓
    YES → **ShouldBroadcastNow** (bypasses queue, blocks HTTP)
    NO → **Client events** (bypasses server entirely, fire-and-forget)
NO → Queue worker is running?
    ↓
    YES → **Default ShouldBroadcast** (queued, async)
    NO → Need broadcasting at all?
        ↓
        YES → Fix queue worker first; for dev use `QUEUE_CONNECTION=sync`
        NO → Remove broadcasting

---

## Rationale

The default queued path decouples HTTP response time from WebSocket delivery, preventing broadcast latency from degrading user-facing request handling. `ShouldBroadcastNow` should be reserved for events where the additional 10-50ms of queue processing is unacceptable.

---

## Recommended Default

**Default:** ShouldBroadcast (queued)
**Reason:** Protects HTTP response times; queue worker processes asynchronously; retry logic handles transient failures.

---

## Risks Of Wrong Choice

Excessive `ShouldBroadcastNow` causes HTTP response degradation under broadcast load. Always queuing latency-critical events adds unnecessary delay for time-sensitive features.

---

## Related Rules

Never Use `ShouldBroadcastNow` as the Default for All Events, Always Run a Queue Worker for Broadcast Events

---

## Related Skills

Create and Customize ShouldBroadcast Events

---

---

## Dedicated vs Shared Queue Connection

---

## Decision Context

Whether to route broadcast events to a dedicated queue connection or share the default connection with other job types.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Expected broadcast volume > 100 events/minute?
↓
YES → Other job types (emails, notifications) running on same queue?
    ↓
    YES → **Dedicated queue connection** (`broadcastQueue()`)
    NO → Single queue likely sufficient; monitor for contention
NO → Other job types latency-sensitive?
    ↓
    YES → **Dedicated queue connection**
    NO → Shared queue connection acceptable

---

## Rationale

A broadcast storm (e.g., 10k users triggering events simultaneously) can fill the default queue with millions of `BroadcastEvent` jobs, delaying time-sensitive jobs like password reset emails or payment processing confirmations.

---

## Recommended Default

**Default:** Dedicated queue for broadcasts
**Reason:** Prevents broadcast backlog from starving other job types; provides clear monitoring separation.

---

## Risks Of Wrong Choice

Queue contention under broadcast load; silent delays in critical job processing.

---

## Related Rules

Configure a Dedicated Queue Connection for Broadcasts

---

## Related Skills

Configure and Operate Laravel Broadcasting Architecture
