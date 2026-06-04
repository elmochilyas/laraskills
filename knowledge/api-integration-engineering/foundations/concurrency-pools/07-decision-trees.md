# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 01-foundations
**Knowledge Unit:** concurrency-pools
**Generated:** 2026-06-03

---

# Decision Inventory

1. Concurrency Strategy Selection
2. Pool Error Handling Strategy
3. Concurrency Limit Configuration

---

# Architecture-Level Decision Trees

---

## Concurrency Strategy Selection

---

## Decision Context

Choosing how to execute multiple HTTP requests to optimize wall-clock time.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Are the requests independent of each other (no data dependencies)?
↓
YES → Do they target the same upstream host?
  ↓
  YES → Use Http::pool() with connection reuse
  NO → Use separate pools per host for failure isolation
NO → Are they sequential but slow?
  ↓
  YES → Cannot parallelize (Amdahl's law); optimize each sequentially
  NO → Sequential execution is fine
  ↓
Is total count >50 concurrent requests?
↓
YES → Consider splitting into batches with pool per batch
NO → Single pool is sufficient

---

## Rationale

Independent requests benefit from concurrency proportional to upstream capacity. Sequential-dependent requests see no benefit from pooling. Batch splitting prevents resource exhaustion on large fan-outs.

---

## Recommended Default

**Default:** Use Http::pool() with named keys for same-host requests
**Reason:** Simplest pattern with connection reuse and deterministic response mapping

---

## Risks Of Wrong Choice

Pooling sequential-dependent requests wastes resources. Not pooling independent requests adds unnecessary latency.

---

## Related Rules

Reuse same connector instance across requests, Separate pools per upstream service

---

## Related Skills

Execute Concurrent HTTP Requests with Pools

---

## Pool Error Handling Strategy

---

## Decision Context

Handling individual request failures within a pool without affecting other concurrent requests.

---

## Decision Criteria

* performance
* security
* maintainability

---

## Decision Tree

Does one request failure affect the overall operation?
↓
YES → Use Promise-based error handling per request
  ↓
  Need partial results on failure?
  ↓
  YES → Catch individual rejections; aggregate successes with failures list
  NO → Fail entire pool with first exception
NO → Fire-and-forget: handle failures individually
  ↓
  Are failures retryable?
  ↓
  YES → Retry failed requests individually after pool completes
  NO → Log failure and continue

---

## Rationale

Pooling allows granular error handling — one slow/failed request doesn't block others. Promise-based handling gives fine-grained control over partial success scenarios.

---

## Recommended Default

**Default:** Catch individual rejections, aggregate results, log failures
**Reason:** Most resilient — never fails the entire operation for one bad request

---

## Risks Of Wrong Choice

Failing the entire pool on single failure amplifies transient errors. Silent failure handling loses critical error visibility.

---

## Related Rules

Handle individual pool request errors gracefully

---

## Related Skills

Execute Concurrent HTTP Requests with Pools

---

## Concurrency Limit Configuration

---

## Decision Context

Setting the maximum number of concurrent connections per pool.

---

## Decision Criteria

* performance
* security
* architectural

---

## Decision Tree

Does the upstream API document rate limits?
↓
YES → Set concurrency limit to 80% of rate limit / average latency
  ↓
  Is the upstream rate limit per-second or per-minute?
  ↓
  PER-SECOND → Set concurrency = rate_limit * 0.8 / (1/avg_latency)
  PER-MINUTE → Set concurrency = rate_limit * 0.8 / (60/avg_latency)
NO → Is the upstream internal (same datacenter)?
  ↓
  YES → Use higher concurrency (25-50) with TCP_NODELAY
  NO → Use conservative concurrency (5-10) with monitoring
  ↓
Monitor 429 rate from upstream?
↓
YES → Reduce concurrency by 50% if 429 rate >1%
NO → Current limit is appropriate

---

## Rationale

Concurrency limits must respect upstream capacity to avoid triggering rate limits. Internal services can handle higher concurrency due to lower latency and controlled load.

---

## Recommended Default

**Default:** 10 concurrent connections per pool for external APIs
**Reason:** Safe starting point that avoids rate limiting for most APIs

---

## Risks Of Wrong Choice

Too-high concurrency triggers rate limits (429 errors). Too-low concurrency underutilizes available bandwidth.

---

## Related Rules

Set concurrency based on upstream capacity

---

## Related Skills

Execute Concurrent HTTP Requests with Pools
