# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 01-foundations
**Knowledge Unit:** caching-responses
**Generated:** 2026-06-03

---

# Decision Inventory

1. Caching Strategy Selection
2. Cache Store Selection
3. Cache Invalidation Approach
4. Stampede Protection Strategy

---

# Architecture-Level Decision Trees

---

## Caching Strategy Selection

---

## Decision Context

Choosing whether and how to cache external API responses.

---

## Decision Criteria

* performance
* architectural
* security
* maintainability

---

## Decision Tree

Is the endpoint read-only (GET/HEAD)?
↓
YES → Does the data change frequently (<60s)?
  ↓
  YES → Is latency tolerance low?
    ↓
    YES → Use conditional caching (ETag/Last-Modified)
    NO → Skip caching; always fetch fresh
  NO → Use standard TTL-based caching
NO → Is the request idempotent with an idempotency key?
  ↓
  YES → Cache response with idempotency key as cache key
  NO → Never cache; pass through

---

## Rationale

GET endpoints are naturally cacheable. Conditional caching saves bandwidth when data changes often but validation is cheap. Idempotent writes can safely cache responses, preventing duplicate side effects on retry.

---

## Recommended Default

**Default:** Use TTL-based caching with Redis for GET endpoints
**Reason:** Simplest configuration with 90%+ hit rate for reference data

---

## Risks Of Wrong Choice

Caching non-idempotent writes causes duplicate side effects. Skipping cache on static data wastes API budget and increases latency 10-100x.

---

## Related Rules

Design Cache Keys with Service Namespace, Always Set TTL Based on Data Freshness, Don't Cache POST Without Idempotency

---

## Related Skills

Cache External API Responses to Reduce Latency and Costs

---

## Cache Store Selection

---

## Decision Context

Selecting the backend for cached API responses.

---

## Decision Criteria

* performance
* architectural
* maintainability

---

## Decision Tree

Is the application deployed across multiple servers?
↓
YES → Use Redis (distributed, TTL, atomic operations)
NO → Use file cache (simplest, no infrastructure dependency)
  ↓
  Need cache stampede protection or atomic operations?
  ↓
  YES → Use Redis anyway
  NO → File cache is sufficient

---

## Rationale

Redis provides distributed consistency, atomic lock operations, and TTL eviction. File cache is simpler for single-server but lacks coordination.

---

## Recommended Default

**Default:** Redis for production, file for local development
**Reason:** Production needs distributed state; file is zero-config for dev

---

## Risks Of Wrong Choice

File cache in multi-server deployment causes inconsistent responses across servers. Redis in single-server dev adds unnecessary infrastructure complexity.

---

## Related Rules

Implement Stampede Protection with Cache::lock()

---

## Related Skills

Cache External API Responses to Reduce Latency and Costs

---

## Cache Invalidation Approach

---

## Decision Context

Choosing when and how to invalidate cached responses.

---

## Decision Criteria

* performance
* architectural
* maintainability

---

## Decision Tree

Does the upstream API support webhooks for data changes?
↓
YES → Invalidate via webhook events (timely, targeted)
NO → Is the data highly time-sensitive?
  ↓
  YES → Set short TTL (60-300s) with conditional caching
  NO → Set long TTL (3600-86400s); rely on TTL expiry
  ↓
  Need manual refresh capability?
  ↓
  YES → Add Artisan command for cache flush per service
  NO → TTL-based invalidation is sufficient

---

## Rationale

Webhook-based invalidation provides immediate freshness without waiting for TTL. When webhooks aren't available, TTL-based expiry is the next best option, tuned to data volatility.

---

## Recommended Default

**Default:** TTL-based expiry with short TTL for volatile data
**Reason:** Works universally without upstream webhook support

---

## Risks Of Wrong Choice

No invalidation on data changes serves stale data until TTL expires. Aggressive invalidation increases API call volume, defeating caching's benefit.

---

## Related Rules

Design Cache Keys with Service Namespace

---

## Related Skills

Cache External API Responses to Reduce Latency and Costs

---

## Stampede Protection Strategy

---

## Decision Context

Preventing multiple concurrent requests from all hitting the upstream API when a cache key expires.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Does the endpoint receive high traffic (>100 req/s)?
↓
YES → Implement Cache::lock() with lock timeout
  ↓
  Is the upstream API slow (>1s response)?
  ↓
  YES → Also implement stale-while-revalidate pattern
  NO → Lock protection is sufficient
NO → Is the cache miss cost high (expensive API or credit-based)?
  ↓
  YES → Implement Cache::lock() anyway
  NO → Simple Cache::remember() without lock is acceptable

---

## Rationale

Lock-based stampede protection ensures only one request regenerates the cache while others wait. Stale-while-revalidate serves stale data immediately while asynchronously refreshing, eliminating wait time entirely.

---

## Recommended Default

**Default:** Use Cache::lock() for endpoints with >50 req/s
**Reason:** Balances protection overhead against stampede risk

---

## Risks Of Wrong Choice

No protection on high-traffic keys causes upstream overload and cascading timeouts on cache expiry. Lock overhead on low-traffic keys adds latency with zero benefit.

---

## Related Rules

Implement Stampede Protection with Cache::lock()

---

## Related Skills

Cache External API Responses to Reduce Latency and Costs
