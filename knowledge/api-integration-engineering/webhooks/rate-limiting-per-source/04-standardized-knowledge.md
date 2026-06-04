# ECC Standardized Knowledge — Rate Limiting Per Source

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | webhook-systems-incoming |
| Knowledge Unit ID | ku-05 |
| Knowledge Unit | Rate Limiting Per Source |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K011, K008, K020 |

## Overview (Engineering Value)
Rate limiting per webhook source protects the application from being overwhelmed by excessive webhook traffic from a single provider. Each provider has independent rate limits based on their typical webhook volume, preventing a misconfigured or malicious provider from flooding the system. Laravel's throttle middleware, combined with Redis-backed counters per provider, enables per-source rate limiting with configurable limits, burst allowances, and backpressure responses (429).

## Core Concepts
- **Per-Provider Limits**: Independent rate limits per webhook source (Stripe: 100/min, GitHub: 60/min)
- **Throttle Middleware**: Laravel's `throttle:60,1` middleware with named rate limiters
- **Redis-Backed Counters**: Distributed rate limit counters for multi-server consistency
- **Burst Allowance**: Short burst capacity within the rate limit window for legitimate traffic spikes
- **429 Response**: Standard HTTP rate limit response; providers respect and back off
- **Queue Backpressure**: When limit exceeded, queue jobs can be released with delay instead of failed

## When To Use
- All incoming webhook endpoints to prevent overload
- High-volume webhook providers (Stripe, payment gateways)
- Public webhook endpoints exposed to many sources

## When NOT To Use
- Webhooks from a single trusted internal source with known volume
- Very low-traffic webhooks (a few per day)

## Best Practices
- Configure per-provider limits based on their documented maximum webhook rate
- Use named rate limiters in Laravel: `RateLimiter::for('webhooks:stripe', ...)`
- Set limits with headroom (80% of expected peak) to allow for traffic variability
- Return standard 429 with Retry-After header for provider-side backoff
- Log rate limit hits per provider for capacity planning

## Architecture Guidelines
- Named rate limiters in `App\Providers\RouteServiceProvider` per provider
- Redis store for distributed rate limit state across workers
- Throttle middleware applied per webhook route group
- Queue job release with delay when rate limited (don't fail the job)
- Monitor rate limit hit rates per provider for threshold tuning

## Performance Considerations
- Rate limit check: single Redis counter read (~1-5ms)
- 429 response generation: near-instant (no processing)
- Increment operation: atomic Redis INCR with TTL
- Per-provider counters add Redis keys proportional to provider count

## Common Mistakes
- Single global rate limit when each provider has different volume and limits
- Not distinguishing between provider sources (all webhooks get same limit)
- Rate limit set too low for legitimate traffic (causes unnecessary 429s)
- Not monitoring rate limit hit rates (tuning blind without data)
- Rate limiting without 429 response (provider doesn't know to back off)

## Related Topics
- **Prerequisites**: Laravel rate limiting, throttle middleware
- **Closely Related**: Receiving endpoints (ku-01), queued processing (ku-03)
- **Advanced**: Token bucket vs sliding window per provider
- **Cross-Domain**: Traffic management, DDoS protection

## Verification
- [ ] Named rate limiters configured per webhook provider
- [ ] Redis-backed rate limit counters in production
- [ ] 429 response with Retry-After returned when limit exceeded
- [ ] Rate limit hits logged per provider
- [ ] Queue jobs release with delay, not fail, when rate limited
