# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 04-resilience
**Knowledge Unit:** response-caching
**Generated:** 2026-06-03

---

# Decision Inventory

1. Cache Freshness Strategy (TTL-based vs Conditional)
2. Cache Stampede Protection Strategy
3. Cache Invalidation Strategy (TTL vs Event-based)

---

# Architecture-Level Decision Trees

---

## Cache Freshness Strategy

---

## Decision Context

Choosing how to determine cache freshness for API responses.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Does the upstream API support conditional request headers (ETag/Last-Modified)?
↓
YES → Use conditional caching with short TTL (validates freshness cheaply)
  ↓
  Is bandwidth cost significant (>100KB responses)?
  ↓
  YES → ETag caching saves 90%+ bandwidth via 304 responses
  NO → Conditional caching still reduces latency
NO → Does the data have a known change frequency?
  ↓
  YES → Set TTL proportional to change frequency (static: 24h, volatile: 60s)
  NO → Default TTL (3600s) with periodic manual invalidation
  ↓
  Need to serve stale data when upstream is unavailable?
  ↓
  YES → Implement stale-while-revalidate pattern
  NO → Cache miss on expiry; no fallback to stale data

---

## Rationale

Conditional caching (ETag) validates freshness without transferring the response body, ideal for large responses. TTL-based caching is simpler but may serve stale data or waste requests.

---

## Recommended Default

**Default:** Conditional caching (ETag) when supported; TTL-based with 3600s otherwise
**Reason:** Minimizes bandwidth for unchanged data; reasonable freshness for static data

---

## Risks Of Wrong Choice

TTL-only without ETag wastes bandwidth on unchanged responses. Conditional-only without TTL fallback may repeatedly validate when upstream is slow.

---

## Related Rules

Cache with TTL Proportional to Data Change Frequency, Use Cache Tags for Group Invalidation

---

## Related Skills

Cache External API Responses to Reduce Latency and Costs

---

## Cache Stampede Protection Strategy

---

## Decision Context

Preventing multiple concurrent requests from all missing cache simultaneously.

---

## Decision Criteria

* performance
* reliability

---

## Decision Tree

Does the endpoint receive high traffic (>100 req/s)?
↓
YES → Implement Cache::lock() with lock timeout
  ↓
  Is the upstream API slow (>1s)?
  ↓
  YES → Also implement stale-while-revalidate pattern
  NO → Lock protection alone is sufficient
NO → Does the cache miss cost include expensive computation?
  ↓
  YES → Implement Cache::lock() even for moderate traffic
  NO → Simple Cache::remember() without lock is sufficient
  ↓
  Need probabilistic early expiration?
  ↓
  YES → Use probabilistic expiration (random early refresh before TTL)
  NO → Standard TTL with lock protection

---

## Rationale

Lock-based stampede protection ensures only one request regenerates the cache while others wait. Stale-while-revalidate eliminates wait time entirely by serving stale data while asynchronously refreshing.

---

## Recommended Default

**Default:** Cache::lock() for endpoints with >50 req/s
**Reason:** Prevents stampede without adding complexity to low-traffic endpoints

---

## Risks Of Wrong Choice

No protection on high-traffic keys causes upstream overload on cache expiry. Lock overhead on low-traffic keys adds latency with zero benefit.

---

## Related Rules

Implement Cache Stampede Protection, Use Stale-While-Revalidate for High Availability

---

## Related Skills

Cache External API Responses to Reduce Latency and Costs

---

## Cache Invalidation Strategy

---

## Decision Context

Choosing when and how to invalidate cached responses.

---

## Decision Criteria

* maintainability
* performance

---

## Decision Tree

Does the upstream provide webhooks for data change events?
↓
YES → Invalidate cache via webhook events (timely, targeted)
  ↓
  Does the cache store support tagging?
  ↓
  YES → Tag by resource type; flush tags on relevant webhook events
  NO → Clear specific keys based on webhook payload content
NO → Is the data manually updated (admin panel)?
  ↓
  YES → Implement manual cache flush button for specific keys/tags
  NO → TTL-based expiry is sufficient
  ↓
  Need to flush cache after bulk data changes?
  ↓
  YES → Tag-based flush (Redis) for precision; avoid full cache flush
  NO → TTL expiry handles individual entries

---

## Rationale

Webhook-based invalidation provides immediate freshness without TTL wait. Tag-based flushing clears only related entries, avoiding the spike of cache misses from full flush.

---

## Recommended Default

**Default:** Tag-based invalidation via webhooks + TTL as safety net
**Reason:** Immediate freshness; precise invalidation; TTL catches missed invalidation events

---

## Risks Of Wrong Choice

No invalidation on data changes serves stale data until TTL expires. Full cache flush on every change causes unnecessary cache miss spikes.

---

## Related Rules
Monitor Cache Hit Ratio (Target >90%)

---

## Related Skills
Cache External API Responses to Reduce Latency and Costs
