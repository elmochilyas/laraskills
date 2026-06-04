# `RateLimiter` Facade for Job Rate Limiting — Checklist

## Metadata
- **Domain:** Async & Distributed Systems
- **Subdomain:** Job Middleware
- **Knowledge Unit:** K076 — `RateLimiter` Facade for Job Rate Limiting
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand Laravel cache system and atomic operations
- [ ] Familiar with `RateLimiter` facade methods (`hit`, `attempt`, `tooManyAttempts`, `availableIn`, `clear`)
- [ ] Cache driver supports atomic operations (Redis, Memcached, DynamoDB)

## Implementation Checklist
- [ ] Use `RateLimiter::for()` for named limiters with centralized configuration
- [ ] Use `attempt()` for simple N-attempts-per-window scenarios (wraps check + callback atomically)
- [ ] Use `hit()` + `tooManyAttempts()` when counter state inspection is needed
- [ ] Call `clear()` on success in throttle implementations to reset failure history
- [ ] Register named limiters in `AppServiceProvider`

## Verification Checklist
- [ ] `RateLimiter::attempt()` correctly gates execution
- [ ] `RateLimiter::tooManyAttempts()` returns true when limit exceeded
- [ ] `RateLimiter::availableIn()` returns accurate time until reset
- [ ] `RateLimiter::clear()` resets counter on success
- [ ] Atomic operations work correctly under concurrent access

## Security Checklist
- [ ] Rate limit keys don't expose sensitive identifiers
- [ ] Named limiters use safe key generation (no user-controlled key injection)
- [ ] Cache driver with proper atomicity guarantees is used

## Performance Checklist
- [ ] `hit()` is ~1-3ms per call (cache increment + TTL set)
- [ ] `availableIn()` is ~1ms per call
- [ ] Redis handles 100K+ INCREMENT ops/sec — not a bottleneck
- [ ] `file` cache driver does NOT support atomic increments — avoid

## Production Readiness Checklist
- [ ] Rate limiter configuration is environment-aware (staging vs production)
- [ ] Monitoring on rate limiter hit rates
- [ ] Fallback behavior if cache is unavailable
- [ ] Rate limit definitions documented in operations runbook

## Common Mistakes to Avoid
- [ ] Using with `array` cache driver (request-scoped, no rate limiting)
- [ ] Ignoring `attempt()` return value (callback runs even when rate limited)
- [ ] Not `clear()` on success in throttle (counter accumulates, false throttling)
