# Skill: Implement Rate Limiting by Authentication Tier

## Purpose
Configure different rate limits per auth tier (guest, authenticated, premium) using separate named limiters, each scoped by appropriate identifier (IP vs user ID).

## When To Use
- APIs with multiple consumer tiers
- Freemium models with different access levels
- Guest and authenticated endpoints with separate limits

## When NOT To Use
- Single-tier APIs where all consumers have same limits
- Internal APIs with trusted consumers only

## Prerequisites
- Rate limiter definitions
- Auth guard configuration

## Inputs
- Rate limit per tier (guest, authenticated, premium)
- Tier identification logic

## Workflow
1. Define named limiters per tier in `configureRateLimiting()`:
   - `api-guest`: `Limit::perMinute(30)->by($request->ip())`
   - `api-user`: `Limit::perMinute(100)->by($request->user()->id)`
   - `api-premium`: `Limit::perMinute(1000)->by($request->user()->id)`
2. Apply appropriate limiter based on auth status and user tier
3. Use IP for guest identifiers — no user ID available
4. Use user ID for authenticated users — scoped per account, not per IP
5. Use user ID for premium users — higher limit per account
6. Implement dynamic limiter selection: check auth then check user tier, apply matching limiter
7. Always prefer authenticated limit when available — don't fall back to guest limits for authenticated users
8. Return 429 with `Retry-After` and `X-RateLimit-Tier` header showing which tier applied
9. Log rate limit events per tier for capacity planning
10. Test rate limits per tier — guest, authenticated, premium each hit their respective limits

## Validation Checklist
- [ ] Named limiters per tier defined
- [ ] Guest limiter uses IP identifier
- [ ] Authenticated limiter uses user ID identifier
- [ ] Premium limiter with higher limit defined
- [ ] Dynamic limiter selection based on auth+tier
- [ ] Authenticated users matched to their tier, not guest
- [ ] 429 response with `Retry-After` and `X-RateLimit-Tier` headers
- [ ] Rate limit events logged per tier
- [ ] Tests verify rate limits per tier
- [ ] Tier identification logic documented

## Common Failures
- Authenticated users hitting guest limits — middleware applies wrong limiter
- Premium users limited by same bucket as free users — no differentiation
- Guest limit too low — legitimate users hitting 429 on first request
- No tier identification documentation — developers don't know how to get premium limits
- Limiter applied before auth — all requests treated as guest
- By identifier not unique — multiple users sharing same limit bucket

## Decision Points
- Tier detection — role/permission based vs subscription plan based
- Tier ratio — guest:user:premium = 1:3:10 (30:100:1000) typical
- Burst vs sustained limits — `perMinute` for sustained, `perSecond(2)` for burst

## Performance Considerations
- Dynamic limiter selection adds one session/check per request — negligible
- Premium limiters with high limits may still need per-endpoint limits for abuse prevention
- Redis remains critical for distributed rate counting — single-server limits unreliable

## Security Considerations
- Guest limits prevent IP-based abuse without authentication
- Authenticated limits prevent script-based usage from compromised accounts
- Premium limits prevent single-account abuse at scale
- Tier must be server-verified — never trust client-reported tier header
- Rate limit bypass via tier escalation must be prevented at authorization level

## Related Rules
- Define Separate Named Limiters Per Tier
- Use IP Identifier For Guest, User ID For Authenticated
- Prefer Authenticated Limits Over Guest
- Return X-RateLimit-Tier Header
- Log Rate Limit Events Per Tier
- Test Rate Limits Per Auth Tier

## Related Skills
- Rate Limiter Definitions — for base limiter configuration
- IP-based Rate Limiting — for guest-specific patterns
- Rate Limiting by Endpoint — for per-endpoint limits
- Freemium API Design — for tier-based access design

## Success Criteria
- Guest users limited to guest tier (30/min)
- Authenticated users limited to user tier (100/min)
- Premium users limited to premium tier (1000/min)
- Each tier's limit enforced independently
- X-RateLimit-Tier header shows which tier applied
- Rate limit events logged per tier for analysis
