# Rate Limiting Per Source — Checklist

## Metadata
- **Domain:** API Integration Engineering
- **Subdomain:** Incoming Webhooks
- **Knowledge Unit:** Rate Limiting Per Source
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand Laravel rate limiting and throttle middleware
- [ ] Knowledge of provider-specific webhook volume characteristics
- [ ] Familiarity with Redis-backed rate limit counters

## Implementation Checklist
- [ ] Named rate limiters configured per webhook provider
- [ ] Redis-backed rate limit counters in production
- [ ] 429 response with `Retry-After` header returned when limit exceeded
- [ ] Rate limit hits logged per provider
- [ ] Queue jobs release with delay, not fail, when rate limited
- [ ] Per-provider limits based on documented maximum webhook rate

## Verification Checklist
- [ ] Rate limit hit rates monitored per provider for threshold tuning
- [ ] Burst allowance tested for legitimate traffic spikes
- [ ] Distributed rate limit state consistent across workers

## Security Checklist
- [ ] Rate limiting protects against misconfigured or malicious provider flooding
- [ ] Standard 429 response causes providers to back off
- [ ] Backpressure prevents downstream processing overload

## Performance Checklist
- [ ] Rate limit check: single Redis counter read (~1-5ms)
- [ ] 429 response generation: near-instant (no processing)
- [ ] Increment operation: atomic Redis INCR with TTL

## Production Readiness Checklist
- [ ] Named rate limiters in `App\Providers\RouteServiceProvider` per provider
- [ ] Redis store for distributed rate limit state across workers
- [ ] Throttle middleware applied per webhook route group
- [ ] Limits set with headroom (80% of expected peak)

## Common Mistakes to Avoid
- [ ] Avoid single global rate limit when each provider has different volume
- [ ] Avoid not distinguishing between provider sources (all same limit)
- [ ] Avoid rate limit set too low for legitimate traffic (causes unnecessary 429s)
- [ ] Avoid not monitoring rate limit hit rates (tuning blind without data)
- [ ] Avoid rate limiting without 429 response (provider doesn't know to back off)
