# Skill: Design Rate Limit Error Responses

## Purpose
Return consistent 429 error responses with `Retry-After` header, identifying the rate limit tier hit, and providing guidance on when the client can retry.

## When To Use
- Any API with rate limiting configured
- When clients need programmatic retry logic
- When distinguishing between different rate limit tiers

## When NOT To Use
- APIs with no rate limiting
- Internal services where rate limiting is handled at gateway
- Batch/internal endpoints not subject to consumer rate limits

## Prerequisites
- Rate limiter configuration (Laravel `RateLimiter` facade)
- Error code taxonomy

## Inputs
- Rate limit tier definitions
- Retry timing calculation

## Workflow
1. Map `ThrottleRequestsException` in exception handler with rate-limit-aware error code
2. Return 429 with `Retry-After` header — seconds until rate limit resets
3. Use distinct error codes per rate limit tier — `RATE_LIMIT.API_LIMIT_EXCEEDED`, `RATE_LIMIT.AUTH_LIMIT_EXCEEDED`
4. Include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers on all responses (not just errors)
5. Include retry timing guidance in response body detail
6. Log rate limit hits with IP, user, and route for capacity planning
7. Test rate limit error response shape per tier

## Validation Checklist
- [ ] 429 returned for rate limit exceeded
- [ ] `Retry-After` header present with seconds
- [ ] Rate limit headers on all responses (limit, remaining, reset)
- [ ] Error code per rate limit tier
- [ ] Retry guidance in detail
- [ ] Rate limit hits logged for capacity planning
- [ ] Rate limit tested per tier

## Common Failures
- Missing `Retry-After` header — clients can't determine retry timing
- Single error code for all rate limits — client can't distinguish API vs auth limits
- No rate limit headers on normal responses — clients can't rate-limit themselves
- Not logging rate limit hits — can't detect abuse patterns

## Decision Points
- Per-IP vs per-user rate limiting — per-IP for unauthenticated, per-user for authenticated
- Retry-After in seconds vs timestamp — seconds is standard (RFC 7231)
- Separate tiers for auth vs general API — auth tighter, API looser

## Performance Considerations
- Rate limit check adds ~0.01ms per request (cache lookup)
- Header injection negligible
- Rate limit logging can be batched for high-traffic endpoints

## Security Considerations
- Rate limit error must not reveal whether a user account exists
- Auth rate limits protect against brute force — don't disclose account existence
- Ensure rate limit headers are included on all responses for client self-regulation

## Related Rules
- Return 429 with Retry-After Header
- Use Distinct Error Codes Per Rate Limit Tier
- Include Rate Limit Headers on All Responses
- Log Rate Limit Hits for Capacity Planning
- Test Rate Limit Error Responses Per Tier

## Related Skills
- Authentication Error Responses — auth-specific rate limiting
- Standardized Error Envelope — envelope for 429 responses
- Error Response Testing — testing rate limit scenarios

## Success Criteria
- Rate limit exceeded returns 429 with Retry-After header
- Distinct error codes per rate limit tier (auth vs general API)
- Rate limit headers present on all normal responses
- Clients can self-regulate using rate limit headers
- Rate limit hits logged for abuse detection