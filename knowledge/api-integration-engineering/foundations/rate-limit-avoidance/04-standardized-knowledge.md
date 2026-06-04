# ECC Standardized Knowledge — Rate Limit Avoidance

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | http-client-api-consumption |
| Knowledge Unit ID | ku-04 |
| Knowledge Unit | Rate Limit Avoidance |
| Difficulty | Advanced |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K008, K025, K017 |

## Overview (Engineering Value)
Rate limit avoidance ensures outbound API requests stay within upstream service limits, preventing 429 responses and service degradation. It combines proactive limiting (token bucket, sliding window), reactive handling (Retry-After header parsing), and backpressure (queuing requests when approaching limits). Laravel provides Redis-backed rate limiters and the SaloonPHP rate limit plugin for connector-level enforcement. Proper rate limiting prevents upstream bans, maintains integration reliability, and ensures fair resource usage across services.

## Core Concepts
- **Token Bucket Algorithm**: Tokens refill at fixed rate; each request consumes one; burst capacity = bucket size
- **Sliding Window**: Precise request counting within a moving time window
- **429 Handling**: Detect 429 response, respect Retry-After header, pause requests for that service
- **Backpressure**: Queue requests when limit approached; release as tokens become available
- **Rate Limit Headers**: `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After` for server feedback
- **Headroom Monitoring**: Track remaining capacity; alert when below threshold

## When To Use
- All integrations with documented rate limits
- High-volume API consumers approaching published limits
- Integrations with paid tiers based on API call volume

## When NOT To Use
- APIs without rate limits (internal services)
- Very low-volume integrations (thousands of calls below limits)
- Prototyping

## Best Practices
- Set local safety margin: limit to 80% of upstream limit to avoid hitting 429 at traffic peaks
- Use token bucket algorithm for APIs with documented capacity
- Use sliding window for APIs where bursts must be strictly limited
- Always parse and respect Retry-After header from 429 responses
- Combine proactive limiting (pre-request) with reactive handling (post-429)

## Architecture Guidelines
- Saloon rate limit plugin per connector for proactive limiting
- Redis-backed limit stores for distributed state across workers
- Per-service limit buckets, not global (each API has different limits)
- Backpressure via queue job release when rate limited
- Monitor headroom via `X-RateLimit-Remaining` tracking

## Performance Considerations
- Rate limit check: 1-5ms (Redis) per request
- Backpressure adds delay equal to time until next token
- Token bucket is fastest (2 Redis calls); sliding window is most accurate (3 calls)
- In-memory limiters are sub-microsecond but not distributed

## Common Mistakes
- Single global rate limit for multiple APIs with different limits
- Not enabling response header sync (local state drifts from upstream)
- Setting limits too close to upstream cap (frequent 429 at traffic peaks)
- Not handling 429 responses in queue jobs (blocks worker with sleep)

## Related Topics
- **Prerequisites**: Rate limiting algorithms, HTTP headers
- **Closely Related**: Retry strategies, circuit breaker, concurrency pools
- **Advanced**: Token bucket optimization, Lua scripting for atomic rate limits
- **Cross-Domain**: Redis optimization, upstream API documentation

## Verification
- [ ] Rate limiter configured per service with appropriate algorithm
- [ ] 429 responses trigger Retry-After respecting pause
- [ ] Headroom monitored and alerts on low capacity
- [ ] Backpressure implemented via queue job release
- [ ] Safety margin (80% of upstream limit) configured
