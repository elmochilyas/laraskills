# `RateLimited` Job Middleware — Checklist

## Metadata
- **Domain:** Async & Distributed Systems
- **Subdomain:** Job Middleware
- **Knowledge Unit:** K050 — `RateLimited` Job Middleware
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand Laravel `RateLimiter` facade
- [ ] Know how to define named limiters via `RateLimiter::for()`
- [ ] Familiar with `middleware()` method on job classes

## Implementation Checklist
- [ ] Define named rate limiter in `AppServiceProvider` or `RouteServiceProvider`
- [ ] Return `new RateLimited('limiter_name')` from job's `middleware()` method
- [ ] Scope rate limit keys per resource using `->key(fn($j) => $j->property)`
- [ ] Match `decayMinutes` to external API's reset period
- [ ] Prefer `RateLimitedWithRedis` when using Redis cache driver
- [ ] Set release delay to match window reset (default behavior is correct)

## Verification Checklist
- [ ] Rate limit counter increments correctly under load
- [ ] Job releases back to queue when limit exceeded
- [ ] Release delay matches time until window reset
- [ ] Rate limited jobs don't consume queue retry attempts
- [ ] Scoped keys isolate rate limits per resource

## Security Checklist
- [ ] Rate limit keys don't leak sensitive information
- [ ] Rate limiting prevents API abuse and downstream service overload
- [ ] Rate limiter definition doesn't expose internal implementation details

## Performance Checklist
- [ ] Rate limit check adds ~1-5ms per job execution
- [ ] High key cardinality (100K+ users) evaluated for cache impact
- [ ] Rate-limited jobs expected wait time accounted for in queue sizing

## Production Readiness Checklist
- [ ] Rate limit thresholds match documented API limits
- [ ] Monitoring on rate-limited job release frequency
- [ ] Alerts for sustained rate limiting (potential API issue)
- [ ] Rate limiter definitions version-controlled

## Common Mistakes to Avoid
- [ ] Not scoping rate limit keys (global limit — one user blocks all)
- [ ] Window shorter than max job time (counter resets mid-execution)
- [ ] Confusing `RateLimited` with `ThrottlesExceptions` (proactive vs reactive)
- [ ] Tight release delay (< 1 second) — creates CPU-burning retry loop
