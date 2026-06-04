# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 03-webhooks
**Knowledge Unit:** rate-limiting-per-source
**Generated:** 2026-06-03

---

# Decision Inventory

1. Rate Limiting Strategy (Global vs Per-Provider)
2. Rate Limit Algorithm Selection
3. Rate Limit Response Strategy

---

# Architecture-Level Decision Trees

---

## Rate Limiting Strategy

---

## Decision Context

Choosing between global rate limiting and per-provider rate limiting for webhook endpoints.

---

## Decision Criteria

* security
* architectural

---

## Decision Tree

Does the application receive webhooks from multiple providers?
↓
YES → Use per-provider named rate limiters
  ↓
  Do providers have different documented delivery rates?
  ↓
  YES → Configure provider-specific limits (Stripe: 200/min, GitHub: 60/min)
  NO → Uniform per-provider limit with 20% headroom above expected peak
NO → Is there a single provider with consistent volume?
  ↓
  YES → Single rate limiter scoped to that provider is sufficient
  NO → Per-provider limiter with conservative default (100/min)
  ↓
  Need to handle burst traffic from provider retries?
  ↓
  YES → Allow bursts up to 2x the steady-state limit
  NO → Strict per-second enforcement; no burst allowance

---

## Rationale

Per-provider rate limiting prevents a misconfigured provider from starving others. Provider-specific limits let each source operate at its natural volume while protecting the application from any single source.

---

## Recommended Default

**Default:** Per-provider named rate limiters with provider-specific limits + 20% headroom
**Reason:** Fair resource allocation; prevents one provider from impacting others

---

## Risks Of Wrong Choice

Global rate limit causes all providers to be throttled when one provider spikes. No rate limiting allows provider bursts to overwhelm processing capacity.

---

## Related Rules

Configure Per-Provider Limits Based on Documented Maximum

---

## Related Skills

Queue Incoming Webhook Processing for Async Handling

---

## Rate Limit Algorithm Selection

---

## Decision Context

Choosing the rate limiting algorithm for webhook processing.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Is the application deployed across multiple servers?
↓
YES → Use Redis-backed sliding window or token bucket algorithm
  ↓
  Need precise per-second control?
  ↓
  YES → Use sliding window (fixed window with smooth boundaries)
  NO → Token bucket with 1s refill is simpler and sufficient
NO → Use Laravel's built-in RateLimiter with cache store
  ↓
  Single server with file cache?
  ↓
  YES → File-based rate limiter; restart resets counters
  NO → Redis-backed for single-server also preferred for durability
  ↓
  Need atomic increment across workers?
  ↓
  YES → Redis INCR with TTL is atomic and distributed-safe
  NO → Cache::increment() with file store is non-atomic

---

## Rationale

Redis-backed sliding window provides the most accurate rate limiting for distributed systems. Token bucket is simpler with smoother behavior for bursty webhook traffic.

---

## Recommended Default

**Default:** Redis-backed sliding window per-provider rate limiter
**Reason:** Distributed-safe, accurate boundaries, industry standard for production webhook systems

---

## Risks Of Wrong Choice

File-based rate limiter in multi-server deployments has inconsistent state across servers. Fixed window without smoothing causes traffic spikes at window boundaries.

---

## Related Rules

Configure Per-Provider Limits Based on Documented Maximum

---

## Related Skills

Queue Incoming Webhook Processing for Async Handling

---

## Rate Limit Response Strategy

---

## Decision Context

Determining how to respond when a rate limit is exceeded.

---

## Decision Criteria

* reliability
* maintainability

---

## Decision Tree

Is the webhook from a provider that respects 429 Retry-After?
↓
YES → Return 429 with Retry-After header; provider will back off
  ↓
  Is the webhook already queued (job processing rate limit)?
  ↓
  YES → Release job back to queue with delay instead of failing
  NO → Return 429 immediately at HTTP layer before job dispatch
NO → Is the provider known to ignore 429 responses?
  ↓
  YES → Drop excess requests; log the drop for provider review
  NO → Return 429 as standard; most providers respect it
  ↓
  Need to log rate limit hits for monitoring?
  ↓
  YES → Log per-provider rate limit hit count to metrics system
  NO → Silent discard; no visibility into rate limit frequency

---

## Rationale

429 with Retry-After is the standard HTTP rate limit response, and most webhook providers respect it. Queue-level rate limiting releases jobs instead of failing them, preserving the webhook for later processing.

---

## Recommended Default

**Default:** 429 with Retry-After at HTTP layer; release with delay at queue layer
**Reason:** Standard response respected by providers; queue delay preserves processing

---

## Risks Of Wrong Choice

No 429 response means provider keeps retrying at full speed. Failing rate-limited queue jobs instead of releasing them exhausts retries unnecessarily.

---

## Related Rules

Configure Per-Provider Limits Based on Documented Maximum

---

## Related Skills

Queue Incoming Webhook Processing for Async Handling
