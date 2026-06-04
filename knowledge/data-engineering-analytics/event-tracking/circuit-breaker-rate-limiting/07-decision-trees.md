# Decision Trees: Circuit Breaker + Rate Limiting for External Analytics API Calls

## Decision: How to Protect External Analytics Enrichment Calls

**Q: Does the external service have a documented rate limit?**
- Yes → Implement rate limiting AND circuit breaker
- No → Implement circuit breaker only (rate limiting is optional cost control)

**Q: What is the traffic pattern?**
- Bursty (user-driven waves) → Token bucket rate limiter
- Smooth (constant stream) → Sliding window rate limiter
- Unknown → Start with token bucket; monitor and adjust

**Q: What happens when enrichment fails?**
- Null value acceptable → Return null, flag for reprocessing
- Null causes data quality issues → Use cached/fallback value, flag for review
- Critical for compliance → Block event processing, alert on-call engineer

**Q: How many external services does the pipeline call?**
- 1-3 → Manual circuit breaker configuration per service
- 4-10 → Circuit breaker registry with factory pattern
- 10+ → Service mesh or sidecar proxy circuit breaking

**Q: Is the system multi-tenant?**
- Yes → Per-tenant rate limiters, per-tenant circuit breaker thresholds
- No → Global rate limiters and circuit breakers

## Decision: Circuit Breaker Threshold Configuration

**Q: What is the service SLA?**
- < 99.9% uptime → Higher failure threshold (10+ failures in 60s)
- 99.9-99.99% → Moderate threshold (5 failures in 60s)
- > 99.99% → Low threshold (3 failures in 60s)

**Q: Is this a synchronous or async call path?**
- Synchronous (middleware) → Lower threshold; fail fast for UX
- Async (queue job) → Higher threshold; retries absorb transient failures

## Decision: Degraded Fallback Strategy

**Q: Can the call be skipped safely?**
- Yes → Return null/default, continue pipeline
- No → Cache last known good value, return cached
- Neither → Block pipeline, raise alert
