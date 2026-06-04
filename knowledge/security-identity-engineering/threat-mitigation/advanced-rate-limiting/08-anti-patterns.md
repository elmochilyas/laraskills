# Anti-Patterns: Advanced Rate Limiting

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Threat Mitigation |
| Knowledge Unit | Advanced Rate Limiting |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-AR-01 | Advanced Limiting Before Simple | High | Medium | High |
| AP-AR-02 | Token Bucket Without Atomicity | Critical | Medium | High |
| AP-AR-03 | Unauthenticated Key by IP Only | Medium | High | Low |
| AP-AR-04 | No Per-Endpoint Differentiation | High | High | Medium |
| AP-AR-05 | No Redis Failure Fallback | Medium | Medium | Medium |

---

## Repository-Wide Anti-Patterns

- **No Monitoring on Rate Limit Hits**: Attacks and misconfigurations go undetected
- **Same Burst for All Plans**: All user tiers have identical burst allowances
- **Rate Limiting by IP for Authenticated Users**: NAT users unfairly throttled

---

## 1. Advanced Limiting Before Simple

### Category
Architecture · High

### Description
Implementing token bucket, sliding window counter, or other advanced rate limiting algorithms without first trying Laravel's built-in sliding window rate limiter.

### Why It Happens
Developers over-engineer from the start, reading about advanced algorithms and implementing them before the application has any rate limiting at all. "We might need token bucket later" drives premature optimization.

### Warning Signs
- Custom Redis Lua scripts for rate limiting when built-in would suffice
- Multi-algorithm rate limiting framework on day one
- No simple `throttle:60,1` middleware used anywhere
- Application has fewer than 1,000 API requests/day but uses token bucket
- Rate limiting code is more complex than the business logic

### Why Harmful
Advanced rate limiting adds Redis dependency, Lua scripting, custom middleware, and significant testing overhead. For 90% of applications, Laravel's built-in sliding window is sufficient. The complexity creates maintenance burden and potential bugs without providing measurable benefit.

### Real-World Consequences
- Developer spends 2 weeks implementing token bucket; built-in would take 1 hour
- Redis outage takes down rate limiting (and potentially the app)
- Lua script bug allows burst traffic to bypass limits
- Application migrated but rate limiting is too complex to maintain

### Preferred Alternative
Start with Laravel's built-in `RateLimiter` facade and sliding window. Upgrade only when traffic data proves it necessary.

### Refactoring Strategy
1. Replace custom algorithms with `RateLimiter::for('api', fn => Limit::perMinute(60))`
2. Remove Redis Lua scripts
3. Monitor traffic patterns — if burst behavior needs tuning, add `Limit::perSecond()` as array
4. Only reintroduce token bucket if traffic analysis proves it necessary

### Detection Checklist
- [ ] Is the built-in RateLimiter sufficient for current traffic?
- [ ] Are there Redis Lua scripts for rate limiting?
- [ ] Have traffic patterns been analyzed to justify advanced algorithms?
- [ ] Is the rate limiting code more complex than business logic?
- [ ] Could the same result be achieved with `Limit::perSecond()` + `Limit::perMinute()`?

### Related Rules/Skills/Trees
- Define Rate Limits per Endpoint, Not Globally (05-rules.md)
- Implement Advanced Rate Limiting with Dynamic Limits (06-skills.md)
- Algorithm Selection decision tree (07-decision-trees.md)

---

## 2. Token Bucket Without Atomicity

### Category
Security · Critical

### Description
Implementing token bucket rate limiting in application code (PHP) without atomic operations, causing race conditions where tokens are over-consumed.

### Why It Happens
Token bucket logic is straightforward: decrement token count, check if remaining ≥ 0. In PHP, this read-compare-write sequence is not atomic. Two concurrent requests can both read the same token count, both decrement, and both pass — consuming 2 tokens when only 1 was available.

### Warning Signs
- Token bucket implemented in PHP without locks or atomic operations
- Token bucket uses file or database cache
- Rate limit counters are read-then-write in PHP code
- Rate limit accuracy degraded under concurrent load
- Users report exceeding their limit despite being throttled

### Why Harmful
Race conditions allow users to exceed their rate limit by 2-10x under concurrent load. The rate limiting becomes ineffective, and the protection it was meant to provide (brute force prevention, DoS mitigation) is weakened.

### Real-World Consequences
- Brute force attack: 100 concurrent requests bypasses a 5/min limit
- API abuse: user sends 50 concurrent requests, all pass despite 10/min limit
- Race condition exploited: attacker sends many simultaneous requests

### Preferred Alternative
Use Redis Lua scripting for atomic token bucket operations.

### Refactoring Strategy
1. Move token bucket logic to a Redis Lua script
2. The Lua script runs atomically — no race conditions
3. Alternatively, use Redis `INCR` and `EXPIRE` for simpler counter-based limiting
4. If Redis is not available, use Laravel's built-in `RateLimiter` (which handles atomicity)

### Detection Checklist
- [ ] Is token bucket implemented in PHP?
- [ ] Are token operations atomic?
- [ ] Is Lua scripting used for Redis token bucket?
- [ ] Does concurrent testing reveal over-consumption?
- [ ] Could the built-in RateLimiter suffice as a simpler alternative?

### Related Rules/Skills/Trees
- Use Segmented Rate Limiting for Fine-Grained Control (05-rules.md)
- Implement Advanced Rate Limiting with Dynamic Limits (06-skills.md)

---

## 3. Unauthenticated Key by IP Only

### Category
Architecture · Medium

### Description
Keying rate limiters by IP address even when the user is authenticated, causing users behind NAT to share a rate limit quota.

### Why It Happens
The simplest key is `$request->ip()`. Developers apply it uniformly without considering whether the user is authenticated. For authenticated users, IP-based keying is inaccurate.

### Warning Signs
- `->by($request->ip())` used without checking authentication
- Multiple users from the same office share a rate limit
- One user's API calls exhaust the limit for the entire office
- User reports "I can't use the API" but only during work hours (office NAT)

### Why Harmful
Office NAT (Network Address Translation) means 100+ users share the same public IP. A single IP-based rate limit of 60/min means all 100 users share 60 requests. One user running a script can block the entire office.

### Real-World Consequences
- Office of 50 users gets 60 API calls/minute total — each user gets ~1/minute
- One user hits the API hard for data import — 50 other users blocked
- Support tickets: "API works from home but not from the office"
- Users behind corporate VPN share the same limit

### Preferred Alternative
Use `$job->user?->id ?: $job->ip` — user ID for authenticated, IP for guests.

### Refactoring Strategy
1. Change `->by($request->ip())` to `->by($request->user()?->id ?: $request->ip())`
2. Verify authenticated users have their own per-user quota

### Detection Checklist
- [ ] Are rate limits keyed by IP for authenticated users?
- [ ] Could multiple authenticated users share a single IP?
- [ ] Is there a corporate NAT or VPN scenario?
- [ ] Do authenticated users have per-user rate limits?

### Related Rules/Skills/Trees
- Key Rate Limits by User ID for Authenticated, IP for Guests (05-rules.md)
- Implement Advanced Rate Limiting with Dynamic Limits (06-skills.md)
- Rate Limiter Key Strategy decision tree (07-decision-trees.md)

---

## 4. No Per-Endpoint Differentiation

### Category
Security · High

### Description
Applying the same rate limit to all endpoints, with no differentiation for sensitive endpoints (login, password reset) vs regular API endpoints.

### Why It Happens
A single global rate limit is easy to configure: `Route::middleware('throttle:api')` on all routes. Developers may not consider that login endpoints need stricter limits than read-only API endpoints.

### Warning Signs
- Same rate limit for login and read-only API
- Login endpoint allows 60 attempts/minute
- Password reset has no separate rate limit
- All routes share a single named limiter
- Brute force on login is possible within rate limit

### Why Harmful
Login endpoints with 60/min limits allow 3,600 password attempts per hour. Combined with a password list, this is a practical brute force attack. Authentication endpoints need the strictest limits (3-5/min), which would break legitimate API consumers if applied globally.

### Real-World Consequences
- Brute force attack on login at 60 attempts/minute — account compromised
- Password reset endpoint unlimited — attacker sends thousands of reset emails
- MFA endpoint same limit as API — MFA code brute forced

### Preferred Alternative
Define separate limiters for authentication endpoints (3-5/min), write API (30-100/min), and read API (100-300/min).

### Refactoring Strategy
1. Create `login`, `password-reset`, `mfa` limiters with strict limits (3-5/min)
2. Apply them to auth route groups
3. Keep `api` limiter for normal API routes

### Detection Checklist
- [ ] Does the login endpoint have a strict rate limit (≤5/min)?
- [ ] Are password reset and MFA separately limited?
- [ ] Are there separate limiters for auth vs non-auth routes?
- [ ] Could a brute force attack succeed within the current limits?

### Related Rules/Skills/Trees
- Throttle Authentication Attempts (Login, Password Reset, MFA) (05-rules.md)
- Implement Advanced Rate Limiting with Dynamic Limits (06-skills.md)
- Per-Endpoint vs Global Limits decision tree (07-decision-trees.md)

---

## 5. No Redis Failure Fallback

### Category
Architecture · Medium

### Description
No fallback mechanism when Redis (the rate limit cache store) becomes unavailable, causing the application to fail open (all requests pass) or fail closed (all requests blocked).

### Why It Happens
Developers assume Redis is always available. Rate limiting is implemented with Redis, and no fallback is configured. When Redis goes down, the rate limiter either throws exceptions or silently stops working.

### Warning Signs
- Rate limiting uses Redis exclusively
- No try-catch around rate limit checks
- Redis outage causes 500 errors on all API requests
- Rate limiting silently disabled during Redis degradation
- No monitoring for Redis availability

### Why Harmful
Fail-open: Redis goes down, all rate limits are lifted, attackers have unlimited access. Fail-closed: Redis goes down, all requests are denied, application unavailable. Neither is acceptable.

### Real-World Consequences
- Redis outage: all API requests pass without rate limiting (abuse window)
- Redis degradation: every other request fails (intermittent 500s)
- Production incident: Redis memory full, all rate limit operations fail

### Preferred Alternative
Implement a fallback: degrade gracefully to a simpler local cache (file or array) when Redis is unavailable.

### Refactoring Strategy
1. Wrap rate limit checks in try-catch
2. On Redis failure, fall back to file cache (single-server) or a more restrictive safe mode
3. Alert on Redis degradation

### Detection Checklist
- [ ] Does rate limiting fail gracefully when Redis is down?
- [ ] Is there a fallback cache driver for rate limiting?
- [ ] Are rate limit operations wrapped in try-catch?
- [ ] Is there monitoring for Redis availability?
- [ ] What happens to rate limits during a Redis outage?

### Related Rules/Skills/Trees
- Monitor Rate Limit Hits in Production (05-rules.md)
- Implement Advanced Rate Limiting with Dynamic Limits (06-skills.md)
