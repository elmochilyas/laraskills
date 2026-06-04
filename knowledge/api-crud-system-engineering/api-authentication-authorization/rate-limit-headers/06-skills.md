# Skill: Implement Rate Limit Headers

## Purpose
Emit standard rate limit response headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, and `Retry-After` on 429, via middleware or rate limiter response callbacks.

## When To Use
- All rate-limited API endpoints
- Public API rate limit transparency
- Client-side rate limit handling

## When NOT To Use
- Internal-only APIs
- Endpoints without rate limiting

## Prerequisites
- Rate limiter definitions
- Middleware or response callback configuration

## Inputs
- Rate limit header specification
- Rate limiter configuration per endpoint

## Workflow
1. Configure rate limiter response callback in `App\Exceptions\Handler` or `RateLimiter::for`
2. Set `X-RateLimit-Limit` header: total requests allowed in window
3. Set `X-RateLimit-Remaining` header: remaining requests in current window — decremented per request
4. Set `X-RateLimit-Reset` header: Unix timestamp of window end — computed from window start + TTL
5. Set `Retry-After` header on 429 responses: seconds until next request allowed — computed from current time + reset time
6. Use `RateLimiter::hit()` and `RateLimiter::remaining()` for accurate counts
7. Include headers on ALL responses (not just 429) — clients need remaining count proactively
8. Include headers on 429 responses — Retry-After is critical for client backoff
9. Test headers on both success and rate-limited responses
10. Log rate limit header values for monitoring — detect clients approaching limits

## Validation Checklist
- [ ] `X-RateLimit-Limit` on all rate-limited responses
- [ ] `X-RateLimit-Remaining` on all rate-limited responses
- [ ] `X-RateLimit-Reset` Unix timestamp on all rate-limited responses
- [ ] `Retry-After` on 429 responses
- [ ] Headers on success responses, not just 429
- [ ] Header values accurate (limit, remaining, reset match config)
- [ ] Rate limiter response callback configured
- [ ] Tests verify header values and decrement behavior
- [ ] Header consistency across different limiters
- [ ] Retry-After computed correctly from remaining time

## Common Failures
- Headers only on 429, not on success — clients can't track remaining proactively
- `X-RateLimit-Reset` in seconds instead of Unix timestamp — format confusion
- `Retry-After` absent on 429 — client doesn't know when to retry
- Header values stale — remaining not decremented, shows initial limit on every request
- `X-RateLimit-Limit` incorrect — doesn't match actual limiter configuration
- Headers on non-limited routes — causes client confusion

## Decision Points
- Header naming convention — `X-RateLimit-*` vs standard `RateLimit-*` — both common, pick one consistently
- Reset format — Unix timestamp vs ISO 8601 — Unix for machine, ISO for debugging
- Remaining count scope — per limiter vs per window vs per route

## Performance Considerations
- Header computation via Redis is sub-millisecond
- Remaining counter decrement is atomic operation
- Reset timestamp computation is arithmetic — no overhead
- Header size is ~200 bytes — negligible bandwidth

## Security Considerations
- Rate limit headers must not reveal internal configuration details (exact window size in seconds is fine)
- Remaining count of 0 informs client of limit reached — no security concern
- Reset timestamp doesn't reveal security-relevant information
- Ensure headers are not stripped by proxy/CDN before reaching client

## Related Rules
- Emit Rate Limit Headers On All Rate-Limited Responses
- Include X-RateLimit-Limit, Remaining, Reset Headers
- Include Retry-After Header On 429 Responses
- Configure Rate Limiter Response Callback
- Test Rate Limit Header Accuracy
- Ensure Headers Reach Client Through Proxy/CDN

## Related Skills
- Rate Limiter Definitions — for limiter configuration
- IP-based Rate Limiting — for IP-specific limits
- Rate Limiting by Auth Tier — for tier-based limits
- Cache Header Strategy — for caching with rate limit headers

## Success Criteria
- All rate-limited responses include `X-RateLimit-Limit`, `Remaining`, `Reset` headers
- 429 responses include `Retry-After` header
- Remaining count accurately decrements per request
- Reset timestamp is correct Unix timestamp
- Clients can proactively manage rate limit consumption
- Headers present on both success and limited responses
