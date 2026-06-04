# Skill: Design Rate Limit Tiers

## Purpose
Implement consumer tier-based rate limiting with hybrid sliding window + token bucket algorithm, three minimum tiers (Free/Pro/Enterprise), rate limit headers on all responses, Retry-After on 429s, per-endpoint sub-limits, staggered quota resets, and Redis circuit breaker with local fallback.

## When To Use
- All public APIs with consumer differentiation
- APIs needing resource protection from abusive traffic
- Monetized APIs with tier-based pricing
- Multi-tenant SaaS APIs

## When NOT To Use
- Internal-only APIs with trusted consumers
- Prototype APIs where rate limiting adds complexity
- Real-time/low-latency systems where Redis latency is unacceptable

## Prerequisites
- Consumer tier system defined
- Redis or equivalent backend for atomic rate limit operations
- Understanding of sliding window and token bucket algorithms

## Inputs
- Tier definitions (Free/Pro/Enterprise rates, bursts, monthly quotas)
- Per-endpoint sub-limit configuration
- Quota reset schedule

## Workflow
1. Define minimum three consumer tiers (Free, Pro, Enterprise) with documented rate limits and monthly quotas
2. Implement hybrid sliding window (sustained accuracy) + token bucket (burst handling) algorithm
3. Include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` on every API response
4. Return `Retry-After` header on every 429 Too Many Requests response
5. Configure per-endpoint sub-limits within tier caps for expensive operations (exports, search, batch)
6. Stagger monthly quota resets by distributing reset times based on consumer ID hash
7. Implement Redis circuit breaker falling back to local in-memory limiting when Redis unavailable

## Validation Checklist
- [ ] Minimum three consumer tiers defined (Free/Pro/Enterprise)
- [ ] Hybrid sliding window + token bucket algorithm
- [ ] Rate limit headers on all responses (not just 429)
- [ ] Retry-After header on every 429 response
- [ ] Per-endpoint sub-limits configured
- [ ] Quota resets staggered by consumer ID hash
- [ ] Redis circuit breaker with local in-memory fallback

## Common Failures
- Fixed-window without considering boundary spikes (2x at window edges)
- Burst allowances too high (effectively no rate limit for short periods)
- Not providing Retry-After headers (consumers cannot implement proper backoff)
- Same limits for all endpoints (read should have higher limits than write)
- Monthly quota reset on 1st for all consumers (thundering herd)

## Decision Points
- Tier count: 3 tiers minimum vs more granular (5-7 tiers)
- Burst multiplier: 2x sustained for max 10s vs configurable per tier
- Quota reset: staggered by consumer hash vs aligned to billing date

## Performance Considerations
- Redis rate limit check: ~2ms per request
- Sliding window log uses O(window size) memory per consumer
- Rate limit header computation is negligible
- Local fallback uses approximate limiting (less accurate but always available)

## Security Considerations
- Rate limits are resource protection, not authentication
- Free tier limits prevent abuse from malicious actors
- Monitor 429 rates globally and per consumer for abuse patterns
- Burst allowance can be abused — cap at reasonable multiplier

## Related Rules
- Define Minimum Three Consumer Tiers
- Use Hybrid Sliding Window + Token Bucket
- Include Rate Limit Headers on All Responses
- Return Retry-After on Every 429 Response
- Implement Per-Endpoint Sub-Limits
- Stagger Quota Resets by Consumer Hash
- Implement Redis Circuit Breaker with Local Fallback

## Related Skills
- Track API Usage
- Enforce Request Size Limits
- Monitor API Health

## Success Criteria
- Free/Pro/Enterprise tiers have distinct, documented rate limits
- Rate limit headers are present on every API response
- 429 responses always include Retry-After
- Expensive endpoints have sub-limits preventing full tier consumption
- Quota resets are staggered to prevent thundering herd
- Rate limiting continues during Redis outage via local fallback
- Burst allowances accommodate legitimate traffic spikes
