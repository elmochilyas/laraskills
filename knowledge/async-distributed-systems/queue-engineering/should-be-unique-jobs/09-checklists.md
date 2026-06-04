# `ShouldBeUnique` and Unique Job Locking — Checklist

## Metadata
- **Domain:** Async & Distributed Systems
- **Subdomain:** Job Middleware
- **Knowledge Unit:** K055 — `ShouldBeUnique` and Unique Job Locking
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand Laravel job dispatch lifecycle
- [ ] Familiar with `ShouldBeUnique` interface
- [ ] Know difference between dispatch prevention vs execution prevention

## Implementation Checklist
- [ ] Implement `ShouldBeUnique` interface on job class
- [ ] Override `uniqueId()` to scope per entity (never use default class name alone)
- [ ] Set `uniqueFor` to a reasonable TTL (max queue wait + max execution + buffer)
- [ ] Use `ShouldBeUniqueUntilProcessing` if lock should release when job starts processing
- [ ] Optionally override `uniqueVia()` for custom locking implementation

## Verification Checklist
- [ ] Duplicate dispatch is silently dropped (returns null from `dispatch()`)
- [ ] Lock is released after job completion or `uniqueFor` expiry
- [ ] Job with crash correctly releases lock after `uniqueFor` expires
- [ ] Scoped `uniqueId()` allows different entities to dispatch independently
- [ ] Behavior tested with concurrent dispatches of same key

## Security Checklist
- [ ] Unique keys don't leak sensitive entity identifiers
- [ ] Lock mechanism uses atomic cache operations (Redis, Memcached, Database)

## Performance Checklist
- [ ] Lock acquisition adds ~1-5ms per dispatch
- [ ] Lock release adds ~1-5ms per job completion
- [ ] Dropped dispatches save queue storage and worker time

## Production Readiness Checklist
- [ ] `uniqueFor` TTL is configured based on observed processing times
- [ ] Monitoring on unique job drop rate (too many drops may indicate issue)
- [ ] Fallback behavior if cache (lock backend) is unavailable
- [ ] Combination with `WithoutOverlapping` for strict guarantees if needed

## Common Mistakes to Avoid
- [ ] Not overriding `uniqueId()` (only ONE instance can ever be queued)
- [ ] Not setting `uniqueFor` (stale lock blocks ALL future dispatches after crash)
- [ ] Confusing with `WithoutOverlapping` (dispatch prevention vs execution prevention)
