# `ThrottlesExceptions` Middleware — Checklist

## Metadata
- **Domain:** Async & Distributed Systems
- **Subdomain:** Job Middleware
- **Knowledge Unit:** K051 — `ThrottlesExceptions` Middleware
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand difference between proactive (`RateLimited`) and reactive (`ThrottlesExceptions`) rate limiting
- [ ] Familiar with `RateLimiter` facade
- [ ] Know the difference between `$maxExceptions` (permanent fail) and `ThrottlesExceptions` (temporary release)

## Implementation Checklist
- [ ] Configure `new ThrottlesExceptions($maxExceptions, $decayMinutes)` with appropriate threshold
- [ ] Use `backoff(fn(Throwable $e) => ...)` for exception-specific release delays
- [ ] Apply `RateLimited` before `ThrottlesExceptions` in middleware array order
- [ ] Set `decayMinutes` longer than downstream service's typical recovery time
- [ ] Success callback properly clears the rate limiter counter

## Verification Checklist
- [ ] Job releases back to queue when exception threshold exceeded
- [ ] Release delay matches exception type (429 vs 503 backoff)
- [ ] Counter resets after `decayMinutes` window
- [ ] Success clears the counter (single success resets throttle)
- [ ] Released job doesn't consume queue retry attempt

## Security Checklist
- [ ] Exception details not logged in rate limiter keys
- [ ] Backoff callback doesn't leak internal error information
- [ ] Threshold prevents downstream abuse but doesn't mask real failures

## Performance Checklist
- [ ] Exception counting via `RateLimiter::hit()` adds ~1-3ms per exception
- [ ] Happy path overhead is minimal (just `clear()` call)
- [ ] Jobs in throttled state don't burn CPU (proper release delay)

## Production Readiness Checklist
- [ ] Threshold set based on observed failure rates (not guessed)
- [ ] Monitoring on throttled jobs (indicates downstream instability)
- [ ] Alert on persistent throttling (service may be down)
- [ ] Backoff strategy documented for each exception type

## Common Mistakes to Avoid
- [ ] Too-low threshold (jobs constantly back off on flaky services)
- [ ] Not using `backoff` callback (all exceptions get same delay)
- [ ] Confusing with `$maxExceptions` (throttling when meant to fail permanently)
