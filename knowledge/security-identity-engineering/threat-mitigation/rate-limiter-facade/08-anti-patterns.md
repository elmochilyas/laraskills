# Anti-Patterns: Rate Limiter Facade and Throttle Middleware

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Threat Mitigation |
| Knowledge Unit | Rate Limiter Facade |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|--------------|
| AP-RL-01 | No Rate Limiting on Public APIs | Critical | High | Low |
| AP-RL-02 | Same Key for All Users | High | High | Low |
| AP-RL-03 | Inline throttle Without Named Limiter | Medium | High | Low |
| AP-RL-04 | No Hit-Clearing on Success | Medium | Medium | Low |
| AP-RL-05 | File Cache in Multi-Server | High | Medium | Low |

---

## Repository-Wide Anti-Patterns

- **Rate Limiting Not Monitored**: No logging when rate limits are hit
- **No Per-Endpoint Differentiation**: Same 60/min limit for login and search
- **No Custom 429 Response**: Generic, unhelpful rate limit error

---

## 1. No Rate Limiting on Public APIs

### Category
Security · Critical

### Description
Public API endpoints (unauthenticated or open to all) have no rate limiting, allowing unlimited abuse.

### Why It Happens
Rate limiting is often added for authenticated endpoints where user identity is known. Public endpoints may be forgotten because "they don't have user IDs to key on."

### Warning Signs
- Public API routes without `throttle` middleware
- Unauthenticated endpoints have no rate limits
- `/api/register`, `/api/contact`, or search endpoints are unlimited
- Attacker can send unlimited requests without authentication
- No rate limiter defined for guest users

### Why Harmful
Public endpoints are the most vulnerable to abuse — no authentication needed. An attacker can scrape data, brute force registration, submit spam, or launch DoS attacks with unlimited requests.

### Real-World Consequences
- Public search endpoint scraped at 1000 requests/second — data exfiltration
- Registration endpoint spammed with 10,000 fake accounts
- Contact form used for spam — thousands of abusive emails
- API costs skyrocket from unlimited usage

### Preferred Alternative
Apply rate limits to all public API endpoints, keyed by IP.

### Refactoring Strategy
1. Add `throttle:api` middleware to public route groups
2. Define rate limiter that keys by IP for unauthenticated users
3. Set appropriate limits for public endpoints (lower than authenticated)

### Detection Checklist
- [ ] Are all public API endpoints rate limited?
- [ ] Are there unauthenticated routes without throttle middleware?
- [ ] Can an attacker send unlimited requests to any endpoint?
- [ ] Are public endpoints limited by IP?

### Related Rules/Skills/Trees
- Define All Named Limiters in AppServiceProvider (05-rules.md)
- Use RateLimiter Facade for Custom Rate Limiting Logic (06-skills.md)
- Named Limiter vs Inline Throttle decision tree (07-decision-trees.md)

---

## 2. Same Key for All Users

### Category
Architecture · High

### Description
Using the same rate limit key for all users, causing one user's requests to exhaust the limit for everyone.

### Why It Happens
A generic key like `'api'` or leaving out `->by()` entirely means all requests share the same counter. One user hitting the API 60 times blocks all other users for the rest of the minute.

### Warning Signs
- `RateLimiter::for('api', fn => Limit::perMinute(60))` without `->by()`
- Same rate limit key shared across all requests
- One user's activity blocks all other users
- Rate limit hit by user A blocks user B

### Why Harmful
The shared rate limit pool means one legitimate user (or one attacker) can deny service to everyone. This is a single-point-of-failure for the entire API.

### Real-World Consequences
- One user running a data import blocks all other users
- Attacker sends 60 requests quickly — all users blocked for the minute
- Legitimate user hits limit because of another user's activity

### Preferred Alternative
Always key rate limits by user ID (authenticated) or IP (guest).

### Refactoring Strategy
1. Add `->by($request->user()?->id ?: $request->ip())` to all limiters
2. Verify each user has their own quota

### Detection Checklist
- [ ] Do rate limiters have a `->by()` key?
- [ ] Is each user limited independently?
- [ ] Could one user's activity block another user?
- [ ] Are API keys unique per client?

### Related Rules/Skills/Trees
- Key Limiters by User ID or IP Based on Auth State (05-rules.md)
- Use RateLimiter Facade for Custom Rate Limiting Logic (06-skills.md)
- Rate Limiter Key Strategy decision tree (07-decision-trees.md)

---

## 3. Inline throttle Without Named Limiter

### Category
Architecture · Medium

### Description
Using inline `throttle:60,1` on route definitions instead of defining named limiters with `RateLimiter::for()`.

### Why It Happens
Inline throttle is the legacy syntax. It's simple and works for static limits. Developers may not know about named limiters or may not see the benefit.

### Warning Signs
- `->middleware('throttle:60,1')` on routes
- No `RateLimiter::for()` definitions in service providers
- Same throttle values repeated across multiple routes
- Cannot change limits globally — must update each route

### Why Harmful
Limits are scattered across route files, making global changes difficult. Dynamic limits (tiered, per-user) are impossible. Each route must define its own limit manually.

### Real-World Consequences
- Changing API limit from 60 to 100 requires editing 15 route files
- Adding tiered limits requires converting all inline throttle to named limiters
- Mistake in one route definition leaves it with wrong limit

### Preferred Alternative
Define named limiters in a service provider and reference them by name.

### Refactoring Strategy
1. Create named limiters: `RateLimiter::for('api', fn => Limit::perMinute(60))`
2. Replace inline `throttle:60,1` with `throttle:api`
3. Use group middleware instead of per-route middleware

### Detection Checklist
- [ ] Are named limiters used instead of inline throttle?
- [ ] Are limiters defined in a service provider?
- [ ] Could limits be changed globally?
- [ ] Is there a single source of truth for rate limits?

### Related Rules/Skills/Trees
- Define All Named Limiters in AppServiceProvider (05-rules.md)
- Use RateLimiter Facade for Custom Rate Limiting Logic (06-skills.md)
- Named Limiter vs Inline Throttle decision tree (07-decision-trees.md)

---

## 4. No Hit-Clearing on Success

### Category
Architecture · Medium

### Description
Not calling `RateLimiter::clear($key)` after a successful action (login, password reset), so failed attempt counts persist even after success.

### Why It Happens
Developers implement `RateLimiter::hit()` on failure but forget `RateLimiter::clear()` on success. The attempt counter continues to accumulate even after the user successfully logs in.

### Warning Signs
- `RateLimiter::hit()` called on failure
- `RateLimiter::clear()` not called on success
- User successfully logs in but still blocked by rate limiter
- Failed attempt history persists after successful login

### Why Harmful
Users who eventually succeed are still blocked for the rate limit duration because their failed counts are never cleared. This causes user frustration and support tickets.

### Real-World Consequences
- User fails login 3 times, succeeds on 4th, then is blocked for 1 minute
- "I just logged in successfully, why can't I access anything?"
- Support tickets for false-positive rate limiting

### Preferred Alternative
Clear the rate limit counter after successful completion of the protected action.

### Refactoring Strategy
1. Add `RateLimiter::clear($key)` after successful login/password reset
2. Verify the counter is reset

### Detection Checklist
- [ ] Is `RateLimiter::clear()` called on success?
- [ ] Are failed attempt counts cleaned up?
- [ ] Do successful users still get blocked?
- [ ] Is hit/clear symmetric in the code?

### Related Rules/Skills/Trees
- Use `onLimitReached` for Side Effects (Logging, Notifications) (05-rules.md)
- Use RateLimiter Facade for Custom Rate Limiting Logic (06-skills.md)

---

## 5. File Cache in Multi-Server

### Category
Architecture · High

### Description
Using Laravel's file cache driver for rate limiting in a multi-server environment, causing inconsistent rate limits across servers.

### Why It Happens
File cache is the default Laravel cache driver. Developers may not change it for rate limiting. The application works in development (single server) but rate limits are inconsistent in production (multi-server).

### Warning Signs
- `CACHE_DRIVER=file` in production
- Rate limit resets when the request hits a different server
- User exceeds limit by hitting different servers
- Rate limit behavior inconsistent
- Load balancer distributes to multiple servers

### Why Harmful
Rate limit counters are stored per-server. A user can send 60 requests to server A and 60 requests to server B — effectively getting 120 requests/minute instead of 60. Rate limiting provides no real protection.

### Real-World Consequences
- User can bypass rate limits by hitting different servers
- Rate limit of 5/min for login is effectively 5 * N servers
- Brute force attack spreads across servers

### Preferred Alternative
Use Redis or memcached as the cache driver for rate limiting.

### Refactoring Strategy
1. Set `CACHE_DRIVER=redis` in production
2. Ensure Redis connection is configured
3. Verify rate limit state is shared across servers

### Detection Checklist
- [ ] Is file cache used for rate limiting in multi-server?
- [ ] Are rate limits consistent across servers?
- [ ] Can users bypass limits by hitting different servers?
- [ ] Is Redis or memcached configured?
- [ ] Is the cache driver appropriate for the deployment?

### Related Rules/Skills/Trees
- Define All Named Limiters in AppServiceProvider (05-rules.md)
- Use RateLimiter Facade for Custom Rate Limiting Logic (06-skills.md)
- Cache Driver for Rate Limiting decision tree (07-decision-trees.md)
