# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 04-resilience
**Knowledge Unit:** bulkhead-pattern
**Generated:** 2026-06-03

---

# Decision Inventory

1. Connection Pool Isolation Strategy
2. Queue Isolation Strategy
3. Worker Allocation Strategy

---

# Architecture-Level Decision Trees

---

## Connection Pool Isolation Strategy

---

## Decision Context

Choosing between shared and isolated connection pools per service.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Does the application integrate with multiple external services?
↓
YES → Use separate Guzzle client/connector instances per service
  ↓
  Do services have different latency profiles?
  ↓
  YES → Separate connection pools with pool-size based on service needs
  NO → Separate pools even for similar profiles; isolation protects against one slow service
NO → Single external service integration?
  ↓
  YES → One connection pool is sufficient; no isolation needed
  NO → No bulkhead needed for no external dependencies
  ↓
  Need to set pool size limits?
  ↓
  YES → Pool size = expected concurrent requests × 1.5 headroom (max 25)
  NO → Unbounded pools risk socket exhaustion under load

---

## Rationale

Separate connection pools prevent one service's latency spike from exhausting connections needed by another service. Pool size limits protect against runaway concurrency.

---

## Recommended Default

**Default:** Separate Saloon connector per service with pool size = max expected concurrency × 1.5
**Reason:** Resource isolation with headroom for traffic spikes

---

## Risks Of Wrong Choice

Shared Guzzle client across services allows one slow service to exhaust the shared connection pool. No pool size limits risk file descriptor exhaustion.

---

## Related Rules

Use Separate Guzzle Client Instances Per Service

---

## Related Skills

Implement Retry and Circuit Breaker

---

## Queue Isolation Strategy

---

## Decision Context

Choosing between shared and dedicated queues for integration jobs.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Does the application process queue jobs for multiple integrations?
↓
YES → Use dedicated queue per integration or integration tier
  ↓
  Are integrations mixed critical (payment) and non-critical (analytics)?
  ↓
  YES → Separate queues per criticality; critical gets more workers
  NO → Dedicated queues per integration for resource isolation
NO → Single integration with queue processing?
  ↓
  YES → Dedicated queue name (integration-specific) still recommended
  NO → Default queue is acceptable for low-volume single integration
  ↓
  Need per-queue worker scaling?
  ↓
  YES → Horizon auto-scaling pools per queue
  NO → Fixed worker allocation per queue

---

## Rationale

Dedicated queues prevent one integration's job backlog from delaying another integration's processing. Critical/non-critical tier separation ensures important processing isn't starved.

---

## Recommended Default

**Default:** Dedicated queue per integration; Horizon auto-scaling pools per criticality tier
**Reason:** Full isolation; priority-based worker allocation; auto-scaling

---

## Risks Of Wrong Choice

Shared queue allows a slow integration (webhooks) to block fast integration (payments). Fixed worker allocation doesn't adapt to changing load patterns.

---

## Related Rules

Configure Per-Service Queue Workers with Dedicated Horizon Pools

---

## Related Skills

Implement Retry and Circuit Breaker

---

## Worker Allocation Strategy

---

## Decision Context

Allocating queue workers across integration services.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Does the integration have strict latency requirements?
↓
YES → Allocate more workers (10-20) to this integration's queue
  ↓
  Does the integration involve slow external API calls?
  ↓
  YES → More workers needed (workers spend most time waiting on I/O)
  NO → Fewer workers sufficient for CPU-bound processing
NO → Is the integration non-critical with no latency SLA?
  ↓
  YES → Minimum workers (1-2) for this integration's queue
  NO → Standard allocation (3-5 workers) per integration
  ↓
  Total worker count within system resource limits?
  ↓
  YES → Allocate per integration as needed
  NO → Reduce allocation to fit within limits; prioritize critical integrations

---

## Rationale

Worker allocation should match integration criticality and I/O profile. I/O-bound (API-calling) jobs benefit from more workers since they spend most time waiting. CPU-bound jobs need fewer.

---

## Recommended Default

**Default:** 10 workers for critical I/O-bound integrations; 3 for standard; 1 for non-critical
**Reason:** Matches resource allocation to integration importance and I/O profile

---

## Risks Of Wrong Choice

Too few workers for I/O-bound integrations creates processing backlog. Too many workers for CPU-bound integrations exhausts CPU resources. Equal allocation wastes resources on non-critical work.

---

## Related Rules

Isolate Critical Integrations in Separate Workers

---

## Related Skills

Implement Retry and Circuit Breaker
