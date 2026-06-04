# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 04-resilience
**Knowledge Unit:** saloon-rate-limit
**Generated:** 2026-06-03

---

# Decision Inventory

1. Rate Limiter Configuration (Per-Connector vs Shared)
2. Cache Store Selection for Rate Limit State
3. Rate Limit Exceeded Behavior (Auto-Delay vs Fail)

---

# Architecture-Level Decision Trees

---

## Rate Limiter Configuration

---

## Decision Context

Choosing between per-connector and shared rate limiter instances.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Does the application use multiple Saloon connectors?
↓
YES → Use separate rate limiter instance per connector
  ↓
  Do connectors call the same upstream API?
  ↓
  YES → Shared rate limiter may be appropriate for coordinated limiting
  NO → Per-connector instances are mandatory for independent limits
NO → Single connector using the Saloon client?
  ↓
  YES → One rate limiter instance on that connector is sufficient
  NO → No rate limiter needed
  ↓
  Need different rate limits per connector?
  ↓
  YES → Separate instances with connector-specific tokens_per_second
  NO → Separate instances with identical config; isolation is still beneficial

---

## Rationale

Per-connector rate limiters ensure independent rate limit tracking. A slow connector can't consume another connector's rate limit budget. Shared limiters are only appropriate when connectors share the same upstream API.

---

## Recommended Default

**Default:** Separate rate limiter instance per connector with connector-specific limits
**Reason:** Independent rate tracking; no cross-contamination; per-service limit tuning

---

## Risks Of Wrong Choice

Shared rate limiter across different upstreams causes one API's rate limit to affect another API's requests. Per-connector without configuration doesn't enforce upstream-specific limits.

---

## Related Rules

Use Redis Cache for Distributed Rate Limit State

---

## Related Skills

Cache SaloonPHP Requests with the Cache Plugin

---

## Cache Store Selection

---

## Decision Context

Choosing the cache backend for rate limit state storage.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Is the application deployed across multiple servers?
↓
YES → Use Redis for distributed rate limit state
  ↓
  Need persistence across Redis restarts?
  ↓
  YES → Redis with AOF persistence; rate limits survive restart
  NO → Ephemeral rate limit; reset on restart is acceptable
NO → Is the application single-server in development?
  ↓
  YES → File cache is acceptable for local development
  NO → Redis recommended even for single-server production (accuracy)
  ↓
  Need atomic operations for rate limit increment?
  ↓
  YES → Redis INCR provides atomic operations
  NO → Cache::increment is non-atomic; risk of race conditions

---

## Rationale

Redis provides atomic INCR operations and TTL-based expiry for distributed rate limit counting. File cache is simple for single-server but inaccurate under concurrent access.

---

## Recommended Default

**Default:** Redis cache store for production; file cache for local development
**Reason:** Distributed accuracy for production; zero-config for development

---

## Risks Of Wrong Choice

File cache in multi-server provides inaccurate rate limit counts per server. Cache store without atomic operations allows race conditions near the limit boundary.

---

## Related Rules

Use Redis Cache for Distributed Rate Limit State

---

## Related Skills

Cache SaloonPHP Requests with the Cache Plugin

---

## Rate Limit Exceeded Behavior

---

## Decision Context

Determining behavior when the rate limiter blocks a request.

---

## Decision Criteria

* reliability
* performance

---

## Decision Tree

Is the request time-sensitive (user-facing)?
↓
YES → Fail immediately with 429 error; don't delay the request
  ↓
  Is fallback data available?
  ↓
  YES → Return fallback data instead of error
  NO → Return clear error indicating rate limit
NO → Is the request a background job (non-urgent)?
  ↓
  YES → Enable auto-delay; wait until rate limit allows
  NO → Is the request part of a batch/pagination sequence?
    ↓
    YES → Auto-delay is ideal; pagination can tolerate pacing
    NO → Manual delay handling in code; auto-delay default
  ↓
  Need to log rate limit hits?
  ↓
  YES → Log rate limit events with service and timestamp for monitoring
  NO → Silent rate limiting; no monitoring visibility

---

## Rationale

Auto-delay is the default Saloon plugin behavior and is appropriate for background work. User-facing requests should fail fast with clear error. Logging rate limit hits enables tuning.

---

## Recommended Default

**Default:** Auto-delay enabled for background jobs; fail-fast with 429 for user-facing requests
**Reason:** Matches expected behavior per context — transparent delay vs clear error

---

## Risks Of Wrong Choice

Auto-delay on user-facing requests causes invisible delays. Fail on background jobs drops requests that could succeed with a brief wait.

---

## Related Rules

Set Auto-Delay True for Non-Time-Sensitive Operations

---

## Related Skills

Cache SaloonPHP Requests with the Cache Plugin
