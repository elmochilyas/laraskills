# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 01-foundations
**Knowledge Unit:** rate-limit-avoidance
**Generated:** 2026-06-03

---

# Decision Inventory

1. Rate Limiting Algorithm Selection
2. 429 Handling Strategy
3. Rate Limit Store Selection

---

# Architecture-Level Decision Trees

---

## Rate Limiting Algorithm Selection

---

## Decision Context

Choosing between token bucket, sliding window, or fixed window for rate limiting.

---

## Decision Criteria

* performance
* architectural
* maintainability

---

## Decision Tree

Does the upstream API have documented rate limits?
↓
YES → Implement proactive rate limiting matching upstream spec
  ↓
  Is burst tolerance important (occasional spikes acceptable)?
  ↓
  YES → Use Token Bucket (fast, O(1), supports bursts)
  NO → Does the API require precise per-second limits?
    ↓
    YES → Use Sliding Window (most accurate, O(log N))
    NO → Use Fixed Window (simplest, boundary burst risk)
NO → Implement reactive handling only (parse 429 Retry-After)
  ↓
  Expect to approach rate limits?
  ↓
  YES → Add proactive limiting anyway with conservative estimates
  NO → Reactive-only is sufficient for low-volume traffic

---

## Rationale

Token bucket is fastest and best for burst-tolerant workloads. Sliding window is most precise for strict limits. Fixed window is simplest but has boundary burst issues where double the limit can be hit at window edges.

---

## Recommended Default

**Default:** Token bucket with 80% of upstream limit
**Reason:** Fast, burst-tolerant, safety margin prevents most 429s

---

## Risks Of Wrong Choice

Fixed window can allow double traffic at boundaries. Token bucket with wrong refill rate doesn't match upstream limits. No proactive limiting means all requests may hit 429 on traffic spikes.

---

## Related Rules

Set safety margin at 80% of upstream limit

---

## Related Skills

Implement Rate Limit Avoidance

---

## 429 Handling Strategy

---

## Decision Context

Reacting to 429 Too Many Requests responses from upstream.

---

## Decision Criteria

* performance
* security

---

## Decision Tree

Does the 429 response include a Retry-After header?
↓
YES → Parse Retry-After and pause all requests to that service
  ↓
  Is this a queue-based consumer?
  ↓
  YES → Release job back to queue with delay = Retry-After + buffer
  NO → Wait and retry once; if 429 again, escalate
NO → Use exponential backoff starting from reasonable default (5s)
  ↓
  Is the 429 consistent (>50% of requests)?
  ↓
  YES → Reduce rate limiter limit by 20% permanently
  NO → Transient limit hit; no config change needed
  ↓
  Log all 429 occurrences with context?
  ↓
  YES → Enables headroom monitoring and limit tuning
  NO → Missing data for capacity planning

---

## Rationale

Retry-After is the upstream's explicit instruction on when to retry. Combining proactive limiting (to prevent 429s) with reactive handling (for when they still happen) provides comprehensive protection.

---

## Recommended Default

**Default:** Respect Retry-After header; fall back to 5s exponential backoff
**Reason:** Follows upstream instructions when available; sensible default otherwise

---

## Risks Of Wrong Choice

Ignoring Retry-After may cause upstream ban. Exponentially backing off without Retry-After may wait too long. No logging makes capacity tuning impossible.

---

## Related Rules

Always respect Retry-After header, Log 429 occurrences

---

## Related Skills

Implement Rate Limit Avoidance

---

## Rate Limit Store Selection

---

## Decision Context

Choosing where to store rate limiter state.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Is the application deployed across multiple servers?
↓
YES → Use Redis (distributed, atomic, fast O(1) operations)
  ↓
  Need Lua scripting for atomic operations?
  ↓
  YES → Redis with Lua scripts for token bucket atomic updates
  NO → Redis simple key/value is sufficient
NO → Is the rate limiting for a single worker?
  ↓
  YES → In-memory array (fastest, sub-microsecond, no network)
  NO → File or database cache (avoid — too slow for rate limiting)
  ↓
  Need persistent state across restarts?
  ↓
  YES → Redis with persistence; in-memory loses state on restart
  NO → In-memory is acceptable; state reset on restart

---

## Rationale

Redis provides distributed atomic operations essential for accurate rate limiting across servers. In-memory is fastest for single-worker but loses state on restart. File/database caches are too slow.

---

## Recommended Default

**Default:** Redis for multi-server; in-memory for single-server dev
**Reason:** Accurate distributed limiting when needed; fast local limiting otherwise

---

## Risks Of Wrong Choice

File cache for rate limiting is too slow and not atomic. Single-server limiter in multi-server deployment drifts apart, causing inaccurate limits.

---

## Related Rules

Use Redis-backed limit stores for distributed state

---

## Related Skills

Implement Rate Limit Avoidance
