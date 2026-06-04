# ECC Standardized Knowledge — Rate Limit Tier Design

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Lifecycle & Governance |
| Knowledge Unit | Rate Limit Tier Design |
| Difficulty | Intermediate |
| Category | Governance |
| Last Updated | 2026-06-02 |

## Overview

Rate limit tier design defines the structure of consumer tiers, per-tier limits, burst allowances, and quota management for API access. A well-designed tier system balances resource protection with consumer needs, enables monetization through tier upgrades, and provides predictable API behavior under load. Uses hybrid sliding window + token bucket algorithm with Redis backend.

## Core Concepts

- **Consumer tier**: Classification with specific rate limits (Free, Pro, Enterprise — three minimum).
- **Rate limit**: Max requests per time window (e.g., 100 req/s). Different per tier.
- **Burst allowance**: Short-term spikes above sustained rate (2x sustained for max 10 seconds).
- **Quota**: Total requests per billing period (e.g., 1M requests/month).
- **Sliding window**: Accurate sustained rate limiting using Redis sorted sets.
- **Token bucket**: Burst support with tokens refilling at fixed rate.
- **Rate limit headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.
- **429 Too Many Requests**: Response when limit exceeded, with `Retry-After` header.

## When To Use

- All public APIs with consumer differentiation
- APIs needing resource protection from abusive traffic
- Monetized APIs with tier-based pricing
- Multi-tenant SaaS APIs

## When NOT To Use

- Internal-only APIs with trusted consumers
- Prototype APIs where rate limiting adds unnecessary complexity
- Real-time/low-latency systems where Redis latency is unacceptable

## Best Practices

- **Three tiers minimum**: Free, Pro, Enterprise with clear limit documentation.
- **Hybrid algorithm**: Sliding window for sustained accuracy + token bucket for burst handling.
- **Retry-After header on every 429**: Enables consumer-side proper backoff.
- **Per-endpoint sub-limits**: Expensive endpoints have lower limits within tier cap.
- **Graceful degradation**: Approach limits by increasing latency rather than hard-rejecting.
- **Rate limit headers on all responses**: Not just when throttled.

## Architecture Guidelines

- Redis backend for atomic rate limit operations (INCR + EXPIRE or Lua scripts for token bucket).
- Burst = 2x sustained rate for max 10 seconds.
- Quota resets per billing cycle. Stagger resets by consumer ID hash to avoid thundering herd.
- Tier override for testing/incident response by admin.
- Circuit breaker: fall back to local in-memory limiting if Redis unavailable.
- Global tier limit + per-endpoint sub-limits.

## Performance Considerations

- Redis rate limit check: ~2ms per request (INCR + EXPIRE).
- Sliding window log uses O(window size) memory per consumer.
- Token bucket requires periodic refill — use Redis Lua scripts for atomic refill + consumption.
- Rate limit header computation is negligible.

## Security Considerations

- Rate limits are a resource protection mechanism, not authentication. Authenticated consumers still need rate limiting.
- Free tier limits prevent abuse from malicious actors.
- Monitor 429 rates globally and per consumer for abuse patterns.
- Burst allowance can be abused — cap at reasonable multiplier.

## Common Mistakes

- Fixed-window without considering boundary spikes (consumer gets 2x at window edges).
- Burst allowances too high (effectively no rate limit for short periods).
- Not providing Retry-After headers (consumers cannot implement proper backoff).
- Same limits for all endpoints (read should have higher limits than write).
- Monthly quota reset on 1st for all consumers (thundering herd).

## Anti-Patterns

- **No burst allowance**: Rigid limits that reject legitimate traffic spikes.
- **No consumer tier differentiation**: Same limits for all consumers regardless of usage.
- **No rate limit headers**: Consumers flying blind with no feedback on remaining capacity.

## Examples

- Tier limits: Free = 10 req/s, 10K/month; Pro = 100 req/s, 1M/month; Enterprise = 1000 req/s, 10M/month.
- Headers: `X-RateLimit-Limit: 100, X-RateLimit-Remaining: 42, X-RateLimit-Reset: 1622505600`.
- 429 response: `HTTP 429 Retry-After: 30 { "error": { "code": "RATE_LIMIT_EXCEEDED", "message": "Rate limit exceeded. 100 requests per second allowed.", "reset_at": "1622505600" } }`.

## Related Topics

- **Prerequisites**: Backward Compatibility Policy, API Usage Tracking
- **Closely Related**: Idempotency Key Design, Request Size Limits
- **Advanced**: Distributed rate limiting with Redis Cluster, Rate limit analytics and heatmaps, Adaptive rate limiting by system load

## AI Agent Notes

When designing rate limit tiers: define minimum 3 tiers (Free/Pro/Enterprise), use hybrid sliding window + token bucket, set burst = 2x sustained for max 10s, include Retry-After on 429 responses, provide rate limit headers on all responses, stagger quota resets by consumer hash, implement circuit breaker for Redis outages.

## Verification

Sources: IETF RateLimit header fields draft, Stripe rate limits, GitHub API rate limits, Twilio rate limits, domain-analysis.md.
