# Skill: Use SaloonPHP Rate Limit Plugin for Automated Throttling

## Purpose
Leverage SaloonPHP's `RateLimitPlugin` to automatically track rate limits from response headers and throttle requests accordingly.

## When To Use
- SaloonPHP-based API clients hitting rate-limited endpoints
- APIs that return rate limit headers (X-RateLimit-*)
- Automating rate limit compliance without manual tracking

## When NOT To Use
- Non-Saloon HTTP clients (use Http facade or Guzzle retry)
- APIs without rate limit headers
- Rate limit avoidance via queue-based pacing

## Prerequisites
- SaloonPHP installed
- API that returns rate limit headers

## Workflow
1. Add `RateLimitPlugin` to Connector
2. Configure rate limiter class (e.g., `StoreRateLimiter`)
3. Configure store driver (cache, database)
4. Map response headers to rate limit configuration
5. Plugin automatically delays requests when approaching limit
6. Handle `RateLimitReachedException` for fallback
7. Test rate limit behavior with mocked rate limit headers
8. Monitor rate limit state via plugin accessors

## Validation Checklist
- [ ] `RateLimitPlugin` added to Saloon Connector
- [ ] Rate limiter configured with correct store
- [ ] Response headers mapped to rate limit config
- [ ] Plugin throttles requests automatically
- [ ] `RateLimitReachedException` handled
- [ ] Rate limit behavior tested with mock headers
- [ ] Rate limit state monitored
