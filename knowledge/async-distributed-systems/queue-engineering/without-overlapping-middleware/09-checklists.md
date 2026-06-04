# `WithoutOverlapping` Middleware — Checklist

## Metadata
- **Domain:** Async & Distributed Systems
- **Subdomain:** Job Middleware
- **Knowledge Unit:** K052 — `WithoutOverlapping` Middleware
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand cache-based locking mechanism
- [ ] Know difference between `ShouldBeUnique` (dispatch prevention) and `WithoutOverlapping` (execution prevention)
- [ ] Cache driver supports atomic locks (Redis, Memcached, Database)

## Implementation Checklist
- [ ] Apply `new WithoutOverlapping($key)` in job's `middleware()` method
- [ ] Use `->byKey(fn($j) => $j->entityId)` for entity-level scoping (never use global lock)
- [ ] Set `releaseAfter($seconds)` to meaningful backoff (5-30 seconds)
- [ ] Set `expireAfter($seconds)` to 2x job's p99 execution time
- [ ] Return middleware in array from `middleware()` method

## Verification Checklist
- [ ] Lock acquired before job execution
- [ ] Second dispatch of same key releases back to queue
- [ ] Lock released after job completes or `expireAfter` expires
- [ ] Key scoping allows parallel processing of different entities
- [ ] Concurrent same-key jobs don't run simultaneously

## Security Checklist
- [ ] Lock keys don't contain sensitive entity identifiers
- [ ] Cache driver used supports atomic locks

## Performance Checklist
- [ ] Lock acquisition adds ~1-5ms per cache operation
- [ ] Multiple overlapping attempts on same key create lock contention
- [ ] Lock entries persist for `expireAfter` seconds — monitor cache memory

## Production Readiness Checklist
- [ ] `expireAfter` is long enough to prevent mid-execution lock expiry
- [ ] `releaseAfter` prevents tight retry loops
- [ ] Fallback strategy if cache (lock backend) is unavailable
- [ ] Jobs using `WithoutOverlapping` don't dispatch themselves (deadlock risk)

## Common Mistakes to Avoid
- [ ] Not setting `releaseAfter` (default 0 — infinite CPU burn retry loop)
- [ ] Not scoping with `byKey()` (global lock — all instances serialize)
- [ ] `expireAfter` shorter than job duration (lock expires mid-execution, overlap occurs)
- [ ] Using with `array` cache driver (no atomic lock support)
