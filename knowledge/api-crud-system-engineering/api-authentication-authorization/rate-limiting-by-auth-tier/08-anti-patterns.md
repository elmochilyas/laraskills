# ECC Anti-Patterns — Rate Limiting by Auth Tier

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | API & CRUD System Engineering |
| **Subdomain** | API Authentication & Authorization |
| **Knowledge Unit** | Rate Limiting by Auth Tier |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Single Global Limit for All Auth Tiers
2. IP-Based Limits for Authenticated Users
3. Guest Tier Limit Too High
4. No Fallback on Authentication Failure
5. Rate Limiting Health Check Endpoints

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries

---

## Anti-Pattern 1: Single Global Limit for All Auth Tiers

### Category
Architecture

### Description
Applying the same rate limit to guest, authenticated, and premium users, eliminating any incentive for authentication and making premium tier meaningless.

### Why It Happens
A single `throttle:api` middleware is applied to all routes. Tier differentiation is not considered during initial implementation.

### Warning Signs
- One rate limiter applies to all routes regardless of auth
- No tier detection logic anywhere in the application
- Premium subscribers hit same limits as anonymous users
- Rate limit values are low (guest-appropriate) even for authenticated users

### Why It Is Harmful
There is no incentive to authenticate or upgrade. Anonymous scrapers consume the same resources as paying customers. Premium customers cannot justify paying for API access.

### Real-World Consequences
A premium subscriber pays $100/month and gets the same 30 req/min as an anonymous scraper. They cancel their subscription. The API has no competitive advantage over free alternatives.

### Preferred Alternative
Define tier-specific limits: guest (30/min), user (300/min), premium (3000/min). Detect tier in rate limiter callback.

### Refactoring Strategy
1. Implement tier detection in rate limiter callback
2. Define limit values per tier in configuration
3. Create separate named limiters or a single dynamic limiter
4. Include `X-RateLimit-Tier` header in responses
5. Document tier limits in API documentation

### Detection Checklist
- [ ] Check rate limiter definitions for tier differentiation
- [ ] Verify guest and authenticated users get different limits
- [ ] Test premium accounts for higher limits

### Related Rules
- Use IP for Guests, User ID for Authenticated (05-rules.md)
- Detect Tier in Middleware, Not Controllers (05-rules.md)

### Related Skills
- (Rate limiting implementation)

### Related Decision Trees
- (Tier architecture decisions)

---

## Anti-Pattern 2: IP-Based Limits for Authenticated Users

### Category
Design

### Description
Using the client IP address as the rate limit key for authenticated users, causing all users behind a NAT gateway to share a single limit budget.

### Why It Happens
The simplest implementation uses `$request->ip()` uniformly. The difference between guest and authenticated rate limiting is not considered.

### Warning Signs
- Same rate limit key for all requests regardless of auth
- Office/corporate users report 429 errors that their colleagues caused
- Support tickets from users on shared networks

### Why It Is Harmful
All users behind a corporate NAT share the same rate limit counter. One user running a script exhausts the limit for their entire organization. Authenticated users with their own identity are penalized by anonymous behavior on the same IP.

### Real-World Consequences
A developer in an office runs a `for` loop in the browser console testing an endpoint. They exhaust the 300 req/min limit for the entire office's public IP. All other developers on the same network get 429 errors for 60 seconds.

### Preferred Alternative
Use compound key: user ID for authenticated users, IP for guests.

### Refactoring Strategy
1. Replace uniform IP key with conditional key logic
2. Authenticated: `$request->user() ? 'user:'.$request->user()->id : 'ip:'.$request->ip()`
3. Prefix keys with type to prevent collisions
4. Test that multiple authenticated users behind same IP have independent limits

### Detection Checklist
- [ ] Check rate limit key logic for authenticated users
- [ ] Verify user ID is used when auth is present
- [ ] Test two authenticated users from same IP — should have separate limits

### Related Rules
- Use IP for Guests, User ID for Authenticated (05-rules.md)

### Related Skills
- (Rate limiter implementation)

### Related Decision Trees
- Rate Limit Key Strategy — IP-Only vs Compound User/IP (07-decision-trees.md)

---

## Anti-Pattern 3: Guest Tier Limit Too High

### Category
Security

### Description
Setting the guest rate limit too high, providing no incentive to authenticate and allowing attackers to consume significant resources without any identification.

### Why It Happens
Developers want to avoid blocking legitimate anonymous users. The guest limit is set high enough to accommodate worst-case legitimate use, which also accommodates worst-case abuse.

### Warning Signs
- Guest rate limit is close to or equal to authenticated user limit
- No noticeable difference in rate limiting before vs after login
- Anonymous users can sustain high request volumes for extended periods
- No monitoring for guest tier usage spikes

### Why It Is Harmful
High guest limits eliminate the incentive to authenticate. Attackers can scrape or abuse the API anonymously at the same rate as legitimate authenticated users. The API offers no differentiated value for registered users.

### Real-World Consequences
A competitor scrapes all public data at 300 req/min (the guest limit). No rate limit stops them because they stay within limits. They extract 432,000 records per day impersonating a legitimate user.

### Preferred Alternative
Set guest limits to 30 req/min or lower. Authenticated users get 10x. Premium users get 100x. Monitor guest tier usage for scraping patterns.

### Refactoring Strategy
1. Set guest tier to 10-30 req/min based on endpoint sensitivity
2. Set authenticated tier to 10x guest (100-300 req/min)
3. Set premium tier to 100x guest (1000-3000 req/min)
4. Add monitoring for guest tier hitting limits
5. Document limits per tier in API docs

### Detection Checklist
- [ ] Compare guest tier limit to authenticated tier limit
- [ ] Verify guest limit is significantly lower than authenticated
- [ ] Ensure monitoring alerts for guest tier exhaustion

### Related Rules
- (Rate tier configuration is addressed in power skills)

### Related Skills
- (Business model alignment for rate limiting)

### Related Decision Trees
- (Tier configuration decisions)

---

## Anti-Pattern 4: No Fallback on Authentication Failure

### Category
Security

### Description
Not falling back to guest-tier rate limiting when token validation fails, allowing expired or invalid tokens to bypass rate limits entirely.

### Why It Happens
The rate limiter relies on `$request->user()` which returns `null` for unauthenticated requests. If the limiter code doesn't explicitly handle null, it may crash or default to no limiting.

### Warning Signs
- Rate limiter code doesn't have a `default` or fallback tier
- Expired tokens get higher effective limits than intended
- Token manipulation bypasses rate limiting
- No explicit guest fallback in tier detection logic

### Why It Is Harmful
Attackers can manipulate authentication state (expired tokens, malformed headers) to bypass rate limits. The rate limiting layer must be independent of auth layer reliability. An auth failure should result in more restriction, not less.

### Real-World Consequences
An attacker sends requests with an expired Bearer token. The token validation fails, `$request->user()` returns null, and the rate limiter throws an exception or defaults to no limit. The attacker sends unlimited requests.

### Preferred Alternative
Always fall back to guest-tier limiting when `$request->user()` is null or when auth fails.

### Refactoring Strategy
1. Ensure tier detection ends with `default => 'guest'` in match statement
2. Test rate limiter with expired tokens, malformed auth headers, no auth
3. Verify all auth failure states result in guest-tier limits
4. Add monitoring for auth failures triggering rate limits

### Detection Checklist
- [ ] Check tier detection logic for default fallback
- [ ] Test rate limits with invalid tokens
- [ ] Verify expired tokens get guest limits, not bypass

### Related Rules
- Fall Back to Guest Tier on Authentication Failure (05-rules.md)

### Related Skills
- (Authentication-aware rate limiting)

### Related Decision Trees
- (Auth fallback decisions)

---

## Anti-Pattern 5: Rate Limiting Health Check Endpoints

### Category
Reliability

### Description
Applying tiered rate limiting to health check, metrics, and monitoring endpoints, causing monitoring systems to receive 429 responses and triggering false alerts.

### Why It Happens
Health check routes are included in the API route group without exemption. The `throttle` middleware applies to all routes in the group.

### Warning Signs
- `/health` or `/ping` endpoints return 429 under normal load
- Monitoring tools report the API as unhealthy intermittently
- Kubernetes liveness/readiness probes fail
- Rate limit hits on monitoring endpoints from monitoring tools
- No `withoutMiddleware('throttle:api')` on health routes

### Why It Is Harmful
Monitoring systems must always reach health endpoints. Rate-limited health checks cause false alerts, unnecessary incident response, and in Kubernetes, pod restarts. The API appears unstable when it's actually healthy but rate-limited.

### Real-World Consequences
Kubernetes liveness probe hits the 30/min guest limit on `/health`. The pod is marked unhealthy and restarted. During restart, the pod is unavailable for 10 seconds. The 10-second downtime exceeds the 5-second SLO. An incident is declared.

### Preferred Alternative
Exempt health check, metrics, and monitoring endpoints from all rate limiting.

### Refactoring Strategy
1. Identify all monitoring and health check endpoints
2. Apply `->withoutMiddleware('throttle:api')` to each
3. Verify health endpoints return 200 even under load
4. Add monitoring for health endpoint response times

### Detection Checklist
- [ ] Check health route for rate limiting middleware
- [ ] Test health endpoint under high load
- [ ] Verify monitoring tools can always reach health endpoints

### Related Rules
- Exempt Health Check and Monitoring Endpoints (05-rules.md)

### Related Skills
- (Infrastructure-aware API design)

### Related Decision Trees
- (Endpoint exemption decisions)

---
