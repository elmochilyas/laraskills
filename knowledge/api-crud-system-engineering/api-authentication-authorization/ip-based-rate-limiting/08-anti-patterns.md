# ECC Anti-Patterns — IP-Based Rate Limiting

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | API & CRUD System Engineering |
| **Subdomain** | API Authentication & Authorization |
| **Knowledge Unit** | IP-Based Rate Limiting |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. IP-Only Rate Limiting for Authenticated Users
2. No IPv6 Normalization (Bypassable Rate Limits)
3. Missing TrustProxies Configuration Behind Load Balancers
4. Same Rate Limit for All Endpoints
5. Accepting X-Forwarded-For from Untrusted Sources

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries

---

## Anti-Pattern 1: IP-Only Rate Limiting for Authenticated Users

### Category
Scalability

### Description
Using the client IP address as the sole rate limit key for authenticated users, causing all users behind a NAT gateway to share a single rate limit pool and penalizing legitimate users when one user exceeds the limit.

### Why It Happens
The simplest implementation uses `$request->ip()` uniformly. Developers don't account for NAT scenarios where hundreds of users share one public IP.

### Warning Signs
- `$request->ip()` is the only rate limit key regardless of auth state
- Office/School/corporate users report sporadic 429 errors
- Support tickets from multiple users on the same network about rate limiting
- No conditional key logic based on authentication

### Why It Is Harmful
When one user in an office hits the rate limit, all users behind the same NAT IP are blocked. This creates unfair degradation for legitimate users who have no relationship with the offending user.

### Real-World Consequences
A single developer running a script that polls an endpoint blocks the entire office from accessing the API. The rate limit intended to protect the server instead disrupts an entire organization's workflow.

### Preferred Alternative
Use compound keys: `$request->user() ? 'user:'.$request->user()->id : 'ip:'.$request->ip()`.

### Refactoring Strategy
1. Replace `$request->ip()` with compound key logic in all rate limiters
2. Prefix keys by type (`user:`, `ip:`) to prevent collisions
3. Create separate named limiters for authenticated and guest routes
4. Test with multiple simulated user IDs from the same IP

### Detection Checklist
- [ ] Search for `->by($request->ip())` in rate limiter definitions
- [ ] Verify authenticated routes use user ID, not IP
- [ ] Check for key prefixing (`user:`, `ip:`)

### Related Rules
- Use Compound Keys: User ID for Authenticated, IP for Guests (05-rules.md)

### Related Skills
- Implement IP-Based Rate Limiting (06-skills.md)

### Related Decision Trees
- Rate Limit Key Strategy — IP-Only vs Compound User/IP (07-decision-trees.md)

---

## Anti-Pattern 2: No IPv6 Normalization (Bypassable Rate Limits)

### Category
Security

### Description
Using the full IPv6 /128 address as the rate limit key without normalizing to /64, allowing a single client to bypass per-IP limits by rotating through billions of addresses in their /64 subnet.

### Why It Happens
IPv6 handling is an afterthought. Most rate limiting tutorials and examples only show IPv4. The /128 address obtained from `$request->ip()` is used as-is.

### Warning Signs
- No IPv6 detection or normalization logic in rate limiter code
- IPv6 clients can make unlimited requests by rotating addresses
- Laravel's default `$request->ip()` used without IPv6 handling
- No tests with IPv6 addresses

### Why It Is Harmful
IPv6 provides a /64 subnet (2^64 addresses) per network. A client can trivially rotate through addresses, making per-IP rate limiting completely ineffective. Attackers with IPv6 can bypass the primary defense against scraping and brute-force.

### Real-World Consequences
A scraper using IPv6 rotates addresses on every request, never hitting the rate limit. They extract all data without triggering any alerts. IP-based blacklists become useless against IPv6 attackers.

### Preferred Alternative
Normalize IPv6 addresses to /64 prefix by extracting the first 64 bits before using as a rate limit key.

### Refactoring Strategy
1. Add IPv6 detection using `filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)`
2. Extract /64 prefix: `substr(inet_pton($ip), 0, 8)`
3. Normalize to network address: `inet_ntop($prefix)`
4. Apply normalization in all IP-based rate limiter keys
5. Add tests with sample IPv6 addresses

### Detection Checklist
- [ ] Search for IPv6 normalization in rate limiter code
- [ ] Test rate limits with IPv6 address rotation
- [ ] Verify /64 prefix is used, not full /128

### Related Rules
- Normalize IPv6 to /64 Prefix (05-rules.md)

### Related Skills
- Implement IP-Based Rate Limiting (06-skills.md)

### Related Decision Trees
- IPv6 Handling for Rate Limit Keys (07-decision-trees.md)

---

## Anti-Pattern 3: Missing TrustProxies Configuration Behind Load Balancers

### Category
Reliability

### Description
Not configuring Laravel's `TrustProxies` middleware when running behind a load balancer, causing all IPs to appear as the proxy IP and making IP-based rate limiting block the proxy instead of individual clients.

### Why It Happens
The application works in development without a proxy. When deployed behind a load balancer, `$request->ip()` returns the proxy IP. The rate limiter then applies a single limit to all traffic.

### Warning Signs
- All requests show the same IP in logs (the load balancer IP)
- Rate limiting suddenly blocks all traffic instead of per-client
- `$request->ip()` returns an internal IP (10.x.x.x, 172.x.x.x)
- TrustProxies middleware not configured in `bootstrap/app.php`

### Why It Is Harmful
The entire user base shares a single rate limit counter. Either all traffic is blocked (limit too low) or no traffic is limited (limit too high). IP-based rate limiting becomes meaningless — the protection it was deployed for is completely absent.

### Real-World Consequences
A single malicious client behind the load balancer sends enough requests to hit the global rate limit, blocking every other user. The API appears unavailable to all customers.

### Preferred Alternative
Configure `TrustProxies` middleware with the load balancer IPs/CIDR ranges: `$middleware->trustProxies(at: ['10.0.0.0/8', '172.16.0.0/12'])`.

### Refactoring Strategy
1. Add `trustProxies` configuration in `bootstrap/app.php`
2. Specify exact proxy CIDR ranges (not `*` in production)
3. Verify `$request->ip()` returns correct client IPs
4. Test rate limiting with simulated proxy headers

### Detection Checklist
- [ ] Check `bootstrap/app.php` for `trustProxies` configuration
- [ ] Verify `$request->ip()` returns client IP, not proxy IP
- [ ] Test behind load balancer with real traffic

### Related Rules
- Always Configure TrustProxies Behind Load Balancers (05-rules.md)

### Related Skills
- Implement IP-Based Rate Limiting (06-skills.md)

### Related Decision Trees
- (TrustProxies configuration is prerequisite context for IP-based limiting)

---

## Anti-Pattern 4: Same Rate Limit for All Endpoints

### Category
Security

### Description
Applying identical rate limits to login endpoints and public data endpoints, allowing brute-force attacks on authentication while unnecessarily restricting access to public data.

### Why It Happens
Developers create one global rate limiter and apply it uniformly. Endpoint sensitivity is not considered. The convenience of a single limiter overrides security requirements.

### Warning Signs
- One rate limiter named `api` applied to all routes including login
- Login endpoint has same limit as `/api/posts` (e.g., 60/min)
- No named limiters for authentication routes
- Brute-force protection relies entirely on a generous general limit

### Why It Is Harmful
A single rate limit tuned for standard API usage (30-60 req/min) is far too generous for login endpoints. An attacker can attempt 3,600 passwords per hour from one IP. Conversely, lowering the global limit to protect login penalizes legitimate API consumers.

### Real-World Consequences
A credential stuffing attack runs 1,800 password attempts per hour against the login endpoint without triggering any rate limit alerts. Accounts are compromised before anyone notices unusual traffic.

### Preferred Alternative
Define separate named limiters: `login` (5/min), `register` (3/min), `password-reset` (3/min), `api` (30-60/min). Apply appropriate limiter per route group.

### Refactoring Strategy
1. Create named limiters for each endpoint category
2. Configure stricter limits for authentication endpoints
3. Apply `throttle:login` to auth routes, `throttle:api` to data routes
4. Test each endpoint type independently
5. Monitor rate limit hit rates per limiter

### Detection Checklist
- [ ] Count distinct rate limiter names in application
- [ ] Verify login endpoint has stricter limit than data endpoints
- [ ] Check that authentication routes use their own named limiter

### Related Rules
- Use Stricter Limits for Login Endpoints (05-rules.md)

### Related Skills
- Implement IP-Based Rate Limiting (06-skills.md)

### Related Decision Trees
- IP-Based Limiting for Unauthenticated vs Authenticated Routes (07-decision-trees.md)

---

## Anti-Pattern 5: Accepting X-Forwarded-For from Untrusted Sources

### Category
Security

### Description
Trusting `X-Forwarded-For` headers from all sources without validating the proxy chain, allowing attackers to spoof arbitrary IP addresses and bypass IP-based rate limits.

### Why It Happens
Setting `trustProxies(at: '*')` or not configuring TrustProxies at all while relying on `X-Forwarded-For` from the internet-facing request. The convenience of "trust everyone" overrides security concerns.

### Warning Signs
- `trustProxies(at: '*')` in production
- No TrustProxies configuration but `X-Forwarded-For` is used
- Attackers can set `X-Forwarded-For: 127.0.0.1` and bypass IP blocks
- Rate limits appear to work intermittently

### Why It Is Harmful
Any client can inject an `X-Forwarded-For` header with a trusted IP address, bypassing IP-based rate limits, IP allowlists, and geolocation restrictions. The IP-based security layer is completely defeated.

### Real-World Consequences
An attacker sends `X-Forwarded-For: 10.0.0.1` (internal IP) with every request. The rate limiter counts all requests against the internal IP, which has a whitelisted or higher limit. The attacker operates at full speed while logged IPs point to internal infrastructure.

### Preferred Alternative
Only trust `X-Forwarded-For` from known proxy IPs. Configure specific CIDR ranges in `TrustProxies` and configure the load balancer to strip incoming `X-Forwarded-For` headers.

### Refactoring Strategy
1. Replace `trustProxies(at: '*')` with specific CIDR ranges
2. Configure load balancer to overwrite (not append) `X-Forwarded-For`
3. Add monitoring for requests with unexpected `X-Forwarded-For` values
4. Set up alerts for IPs that appear in `X-Forwarded-For` but are not in the proxy chain

### Detection Checklist
- [ ] Check `trustProxies` configuration for `'*'` in production
- [ ] Verify load balancer strips external `X-Forwarded-For` headers
- [ ] Test with injected `X-Forwarded-For` header

### Related Rules
- Validate X-Forwarded-For from Trusted Proxies Only (05-rules.md)

### Related Skills
- Implement IP-Based Rate Limiting (06-skills.md)

### Related Decision Trees
- (Addressed in security considerations of the skills and decision trees)

---
