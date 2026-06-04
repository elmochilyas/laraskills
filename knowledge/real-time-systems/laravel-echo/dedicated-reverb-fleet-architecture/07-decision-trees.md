# Metadata

**Domain:** Real-Time Systems
**Subdomain:** Client-Side Subscriptions (Echo)
**Knowledge Unit:** Dedicated Reverb Fleet Architecture
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Category |
|---|----------|----------|
| 1 | Single Reverb instance vs dedicated fleet | architectural |
| 2 | Co-located vs separate Redis for fleet | security |
| 3 | Sticky session strategy for fleet | performance |

---

# Architecture-Level Decision Trees

---

## Single Reverb Instance vs Dedicated Fleet

---

## Decision Context

Whether to deploy Reverb co-located with the application server or as a dedicated fleet.

---

## Decision Criteria

* performance
* architectural
* maintainability

---

## Decision Tree

Expected concurrent connections > 10,000?
↓
YES → Need independent scaling of HTTP and WebSocket?
    ↓
    YES → **Dedicated Reverb fleet** — separate scaling domains
    NO → Need blue-green deploys for WebSocket?
        ↓
        YES → **Dedicated Reverb fleet**
        NO → Evaluate single instance with scaling driver
NO → Expected connections < 1,000?
    ↓
    YES → **Single instance** co-located with app server
    NO → Use single instance with database scaling driver (Laravel 13+)

---

## Rationale

A dedicated fleet separates WebSocket connection lifecycle from HTTP request processing, allowing independent scaling. Below 10k connections, a single Reverb instance with the database scaling driver is simpler and sufficient.

---

## Recommended Default

**Default:** Single Reverb instance co-located with application server
**Reason:** Most applications stay below 10k concurrent connections; simpler infrastructure; the database scaling driver (Laravel 13+) removes Redis dependency for single-server setups.

---

## Risks Of Wrong Choice

Building a fleet prematurely adds infrastructure complexity without benefit. A single instance at scale overwhelms the connection limit and event loop.

---

## Related Rules

Scale Out Only When Single Instance Capacity is Exceeded

---

## Related Skills

Scale Reverb Horizontally with Redis Pub/Sub, Deploy and Operate a Dedicated Reverb Fleet

---

---

## Co-located vs Separate Redis for Fleet

---

## Decision Context

Whether to share Redis between Reverb pub/sub, cache, and queue, or use a dedicated instance.

---

## Decision Criteria

* security
* performance

---

## Decision Tree

Multiple Redis-dependent services (cache, queue, session, Reverb) running?
↓
YES → Reverb fleet critical to application?
    ↓
    YES → **Dedicated Redis for Reverb** — isolate blast radius, prevent contention
    NO → Budget allows separate instance?
        ↓
        YES → **Dedicated Redis for Reverb**
        NO → Shared Redis with strict monitoring and priorities
NO → Single service using Redis only for Reverb?
    ↓
    YES → Dedicated Redis beneficial but not critical

---

## Rationale

Shared Redis creates cross-contention: a cache stampede or queue backlog can starve Reverb's pub/sub, causing cross-instance event loss. A dedicated Redis for Reverb limits blast radius and ensures pub/sub throughput.

---

## Recommended Default

**Default:** Dedicated Redis instance for Reverb fleet pub/sub
**Reason:** Prevents contention with cache/queue; isolates blast radius; ensures consistent pub/sub latency.

---

## Risks Of Wrong Choice

Shared Redis causes broadcast drops under load; a single Redis failure takes down all systems simultaneously.

---

## Related Rules

Always Use a Dedicated Redis Instance for Reverb Scaling

---

## Related Skills

Manage Redis Dependency and Failure Modes for Reverb

---

---

## Sticky Session Strategy for Fleet

---

## Decision Context

Which sticky session method to use for the load balancer routing WebSocket traffic to the Reverb fleet.

---

## Decision Criteria

* performance
* security

---

## Decision Tree

Clients connect from diverse networks (mobile, NAT, corporate proxies)?
↓
YES → **Cookie-based affinity** — survives IP changes
NO → Clients have stable, unique IPs?
    ↓
    YES → **IP hash** — simpler, no cookie overhead
    NO → **Cookie-based affinity** — most reliable

---

## Rationale

IP hash breaks when clients share a NAT gateway (corporate networks, mobile carriers) — all users behind the same IP route to one server. Cookie-based affinity sets a stickiness cookie on the first request, maintaining affinity even through IP changes.

---

## Recommended Default

**Default:** Cookie-based sticky sessions
**Reason:** Works through NAT, proxies, and mobile networks where client IPs change; most reliable distribution for diverse client environments.

---

## Risks Of Wrong Choice

IP hash with NAT clients causes unbalanced server load and potential overload of the server receiving the NAT'd traffic.

---

## Related Rules

Always Configure Sticky Sessions on the Load Balancer

---

## Related Skills

Set Up Sticky Sessions for Multi-Server Reverb Deployments
