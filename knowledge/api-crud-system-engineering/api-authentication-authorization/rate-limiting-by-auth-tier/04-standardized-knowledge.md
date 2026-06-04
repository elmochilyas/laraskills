# ECC Standardized Knowledge — Rate Limiting by Auth Tier

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Authentication & Authorization |
| Knowledge Unit | Rate Limiting by Auth Tier |
| Difficulty | Intermediate |
| Category | Rate Limiting |
| Last Updated | 2026-06-02 |

## Overview

Rate limiting by authentication tier assigns different limits based on the client's auth status and subscription level. Guest requests get restrictive limits, authenticated users get moderate limits, premium subscribers get higher limits, and internal services get the highest limits. This approach incentivizes authentication, enables API monetization, protects infrastructure, and ensures fair resource allocation.

## Core Concepts

- **Auth tier**: Authentication/subscription level: guest, user, premium, internal service.
- **Rate limit scope**: Granularity of limit application — IP (guest), user ID (user/premium), API key (service).
- **Tier multiplier**: Base rate × multiplier per tier. Guest: 1x, User: 10x, Premium: 100x, Service: 1000x.
- **Burst vs sustained**: Short-term per-minute limits and long-term per-hour/day limits.
- **Over-limit behavior**: HTTP 429 with `Retry-After` header. Optionally queue for later processing.

## When To Use

- Public APIs with multiple consumer types (guest, authenticated, premium)
- SaaS APIs with tiered subscription plans
- APIs where you want to incentivize user registration
- APIs serving both browser and programmatic consumers
- Any production API exposed to the internet

## When NOT To Use

- Internal-only APIs with uniform access (all internal services)
- APIs with a single consumer type
- APIs without authentication (guest-only) — use simple IP-based limits
- Development/staging environments where testing multi-tier behavior is not needed

## Best Practices

- **IP for guests, user ID for authenticated**: IP-based guest limits prevent one user from exhausting the guest pool. User ID for authenticated provides per-user fairness.
- **Tier detection in middleware**: Detect tier at the middleware layer, not in controllers. Keeps rate limiting transparent to business logic.
- **Include tier in response headers**: `X-RateLimit-Tier` helps clients understand which limits apply.
- **Fallback on auth failure**: If authentication fails mid-request, fall back to guest tier. Never bypass rate limiting.
- **Document tier limits**: Publish exact limits per tier in API documentation.
- **Graceful degradation on 429**: Return clear error message, retry-after time, and link to upgrade.

## Architecture Guidelines

- Define separate named limiters per tier or a single limiter with dynamic limits based on tier.
- Rate limiting middleware runs before controllers — rejected requests never hit business logic.
- For multi-bucket tier limits, the most restrictive bucket governs.
- Use Redis-backed rate limiting for atomic INCR + EXPIRE across tiers.
- Override limits per customer via database lookup for enterprise clients.

## Performance Considerations

- Each rate-limited request performs one Redis INCR operation — sub-millisecond.
- Multi-bucket limits generate separate cache calls per bucket. Use Redis pipelining.
- Rate limit keys should include timestamp component to prevent unbounded Redis key growth.
- Redis TTL auto-expires old keys. Set TTL = window duration + 1 minute.

## Security Considerations

- Rate limit health check endpoints (should always respond — exempt from limits).
- Tier misclassification due to token validation failure defaults to guest, not bypass.
- Key collision risk: prefix keys with type (`guest:`, `user:`, `service:`, `premium:`).
- Cache outage causes fail-open (unlimited requests). Implement circuit breaker.
- Shared IP abuse: corporate NAT users blocked indiscriminately at guest tier. Encourage authentication.

## Common Mistakes

- **Rate limiting health check endpoints**: They must always respond for monitoring systems.
- **IP-based limits for authenticated users**: Unfair to users behind NAT when user ID is available.
- **Same limit for all tiers**: Defeats the purpose of tiered limiting.
- **No tier in response headers**: Clients cannot see which tier limits apply.
- **Key collision between types**: User ID 123 and service ID 123 share key — always prefix.
- **Rate limiting after expensive operations**: Check early in middleware, before resource-intensive work.

## Anti-Patterns

- **Single global limit for all consumers**: Premium users and unauthenticated scrapers get the same budget.
- **Guest limit too high**: No incentive to authenticate. Attackers consume free tier bandwidth.
- **No per-customer override**: Enterprise clients hit the same limits as individual users.

## Examples

- Tier resolver: `$tier = match(true) { $request->user()?->isPremium() => 'premium', $request->user() => 'user', default => 'guest' }`.
- Dynamic limiter: single `RateLimiter::for('api')` with `Limit::perMinute(match($tier) { 'guest' => 30, 'user' => 300, 'premium' => 3000 })`.

## Related Topics

- **Prerequisites**: Laravel RateLimiter facade, cache drivers (Redis)
- **Closely Related**: Rate Limiter Definition, Rate Limit Headers, IP-Based Rate Limiting
- **Advanced**: Token bucket vs leaky bucket, distributed rate limiting, API monetization
- **Cross-Domain**: Security & Identity Engineering

## AI Agent Notes

When generating tiered rate limiting: use IP for guest scoping, user ID for authenticated, prefix keys with type, detect tier in middleware, include X-RateLimit-Tier header, exempt health checks, fall back to guest on auth failure.

## Verification

Sources: GitHub API tier documentation (60/hr unauthenticated, 5000/hr authenticated), Stripe key-based limits, Laravel RateLimiter source, domain-analysis.md.
