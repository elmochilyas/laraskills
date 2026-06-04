# Skill: Implement IP-Based Rate Limiting

## Purpose
Apply rate limits per IP address for guest endpoints, using `$request->ip()` as identifier with `X-Forwarded-For` trust configuration, separate limits from authenticated users, and protection against IP spoofing.

## When To Use
- Guest/unauthenticated endpoints
- Login, registration, password reset endpoints
- Public-facing API endpoints without auth

## When NOT To Use
- Authenticated endpoints — use user ID identifier
- Internal services behind trusted proxies — IP is consistent

## Prerequisites
- Rate limiter definitions
- Trusted proxy configuration

## Inputs
- IP-based rate limit values per endpoint
- Trusted proxy list

## Workflow
1. Define IP-based limiters in `configureRateLimiting()`: `Limit::perMinute(30)->by($request->ip())`
2. Apply IP limiters to guest-only or unauthenticated route groups
3. Configure trusted proxies in `App\Http\Middleware\TrustProxies` — critical for correct IP detection
4. Use `$request->ip()` consistently — respects trusted proxy configuration
5. Separate IP limit from authenticated user limit — guest route can't exhaust user limit
6. Set lower limits for sensitive endpoints: login(5/min), registration(3/min), password reset(3/min)
7. Return 429 with `Retry-After` header computed from remaining time
8. Log IP rate limit events for abuse pattern detection
9. Test IP-based limits from multiple IP addresses using `$request->server->set('REMOTE_ADDR', '...')`
10. Monitor blocked IP patterns for false positives (shared NAT IPs)

## Validation Checklist
- [ ] IP-based limiters defined with `$request->ip()`
- [ ] Trusted proxies configured for correct IP detection
- [ ] IP limiters applied to guest/unauthenticated routes
- [ ] Separated from authenticated user limits
- [ ] Lower limits for sensitive endpoints
- [ ] 429 with Retry-After header
- [ ] IP rate limit events logged
- [ ] Tests simulate different IPs
- [ ] Blocked IP patterns monitored for false positives
- [ ] IP detection works behind load balancers (X-Forwarded-For)

## Common Failures
- IP detection wrong behind proxy — `$request->ip()` returns load balancer IP
- No proxy trust configuration — all clients appear as same IP
- IP limiter shared with authenticated routes — authenticated users blocked by guest IP limit
- Too strict on shared NAT — office/ISP NAT IPs block entire organization
- No `X-Forwarded-For` validation — IP spoofing via header injection
- IPv6 not handled — ::1 and 2001:db8::/32 ranges on same limiter key

## Decision Points
- Per-endpoint vs shared IP limits — per-endpoint for sensitive, shared for general
- Proxy trust header — `X-Forwarded-For` vs `X-Real-IP` vs standard forwarded
- IPv6 handling — normalize to /64 subnet for rate limiting (prevents single-actor /128 exhaustion)

## Performance Considerations
- IP string hashing is fast — no performance concern
- IPv6 addresses are longer but hash buckets are constant-time
- Redis-backed rate limiting is critical for multiple server IP tracking
- IP-based limit keys grow with unique visitor count — Redis handles millions efficiently

## Security Considerations
- Trusted proxy configuration prevents IP spoofing via `X-Forwarded-For`
- IP-based limits are bypassed by botnets with many IPs — still valuable for individual actors
- Never trust `X-Forwarded-For` without verifying proxy trust
- Rate limit on login must prevent credential stuffing regardless of IP rotation
- Consider combining IP limits with behavioral analysis for advanced protection

## Related Rules
- Use `$request->ip()` For IP-Based Limits
- Configure Trusted Proxies For Correct IP Detection
- Separate IP Limits From Authenticated User Limits
- Set Lower Limits For Sensitive Guest Endpoints
- Log IP Rate Limit Events
- Test IP Rate Limits With Multiple Simulated IPs

## Related Skills
- Rate Limiter Definitions — for base limiter configuration
- Rate Limiting by Auth Tier — for tier-based limits
- Trusted Proxy Configuration — for proxy setup
- Abuse Detection — for IP monitoring

## Success Criteria
- Guest endpoints limited per IP address
- IP detection correct behind load balancers with trusted proxies
- Sensitive endpoints (login, register) have stricter IP limits
- Authenticated users not affected by guest IP limits
- 429 responses include correct Retry-After
- Rate limit events logged and monitored for abuse patterns
