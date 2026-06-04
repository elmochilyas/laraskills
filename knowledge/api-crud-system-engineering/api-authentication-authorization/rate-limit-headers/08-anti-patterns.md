# ECC Anti-Patterns — Rate Limit Headers

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | API & CRUD System Engineering |
| **Subdomain** | API Authentication & Authorization |
| **Knowledge Unit** | Rate Limit Headers |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No Retry-After Header on 429 Responses
2. Reset as Relative Offset Instead of Absolute Unix Timestamp
3. Inconsistent Header Presence Across Endpoints
4. Rate Limit Headers Not Exposed via CORS
5. Headers Stripped by Reverse Proxy

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries

---

## Anti-Pattern 1: No Retry-After Header on 429 Responses

### Category
Reliability

### Description
Returning a 429 status code without the `Retry-After` header, leaving clients with no guidance on when to retry and causing thundering herd retry storms.

### Why It Happens
Laravel's default `ThrottleRequests` exception may not include `Retry-After` in custom 429 responses. Developers customize the response body but forget the header.

### Warning Signs
- 429 response body has no `retry_after` field
- `Retry-After` header missing from 429 responses
- Clients retry immediately after receiving 429
- Cascading 429 failures across multiple clients
- `Retry-After` not set in custom exception handler for `ThrottleRequestsException`

### Why It Is Harmful
Without `Retry-After`, all blocked clients retry simultaneously when they guess the window has passed, creating a thundering herd. The server gets hammered at window boundaries, causing cascading rate limit failures.

### Real-World Consequences
At a window boundary, all 100 blocked clients retry simultaneously. The server gets 100 requests in the same millisecond. All succeed on the new window — then all 100 exhaust the limit in 100ms. The cycle repeats every window. Server load doubles from retries.

### Preferred Alternative
Always include `Retry-After` header with seconds to wait on every 429 response. Also set `X-RateLimit-Remaining: 0`.

### Refactoring Strategy
1. Customize `ThrottleRequestsException` handler to include `Retry-After`
2. Add `Retry-After` to all manual 429 responses
3. Verify with `curl -v` that 429 responses include the header
4. Add automated test asserting `Retry-After` on rate-limited endpoints

### Detection Checklist
- [ ] Check 429 response headers for `Retry-After`
- [ ] Verify custom exception handler includes the header
- [ ] Search for hardcoded 429 responses without `Retry-After`

### Related Rules
- Always Include Retry-After on 429 Responses (05-rules.md)

### Related Skills
- (Rate limiter implementation)

### Related Decision Trees
- (Response format decisions)

---

## Anti-Pattern 2: Reset as Relative Offset Instead of Absolute Unix Timestamp

### Category
Design

### Description
Sending `X-RateLimit-Reset` as a relative number of seconds remaining (e.g., 60) instead of an absolute Unix epoch timestamp, causing client-side timing errors due to clock drift.

### Why It Happens
The variable available in the rate limiting code is often `seconds remaining`, so developers send it directly without converting to absolute time.

### Warning Signs
- `X-RateLimit-Reset` value decreases linearly with each request
- Value is always < 3600 (seconds in an hour)
- Clients report premature or delayed retry behavior
- Implementation uses `$seconds` instead of `time() + $seconds`

### Why It Is Harmful
Clients must add the relative offset to their local clock to compute the retry time. Clock drift between client and server causes inaccurate retry timing — either retrying too early (getting another 429) or waiting too long (wasting capacity).

### Real-World Consequences
A client with 5 seconds clock skew adds the 60-second offset to its own clock, computing a reset time 55 seconds from now. It retries 5 seconds early and gets another 429. Each retry attempt shifts earlier.

### Preferred Alternative
Send `X-RateLimit-Reset` as an absolute Unix epoch timestamp: `time() + $seconds`.

### Refactoring Strategy
1. Find all places where `X-RateLimit-Reset` is set
2. Replace relative offsets with `Carbon::now()->addSeconds($seconds)->timestamp`
3. Verify value increases over time (it won't — it's absolute, but it should be consistent)
4. Test client retry behavior with controlled clock skew

### Detection Checklist
- [ ] Check `X-RateLimit-Reset` implementation for absolute vs relative
- [ ] Verify the value does not decrease between requests on same window
- [ ] Test with curl to observe the header value

### Related Rules
- Use Absolute Unix Timestamps for X-RateLimit-Reset (05-rules.md)

### Related Skills
- (Rate limit header implementation)

### Related Decision Trees
- (Header format decisions)

---

## Anti-Pattern 3: Inconsistent Header Presence Across Endpoints

### Category
Maintainability

### Description
Some rate-limited endpoints return `X-RateLimit-*` headers while others do not, preventing clients from building reliable client-side backoff logic.

### Why It Happens
Headers are added by the `throttle` middleware. Routes without the middleware don't have headers. Some routes are individually throttled, some are in throttled groups, and some are not throttled at all.

### Warning Signs
- Some API endpoints have rate limit headers, others don't
- Clients cannot consistently read headers because they may be absent
- Inconsistent middleware application across route groups
- No global or API-group-wide rate limiting

### Why It Is Harmful
Clients expecting rate limit headers for backoff logic cannot rely on their presence. They must implement fallback behavior for endpoints without headers, increasing client complexity. Missing headers on some endpoints mean rate limit violations on those endpoints cause unexpected 429s with no warning.

### Real-World Consequences
A developer writes client code that backs off based on `X-RateLimit-Remaining`. Some endpoints don't return this header. The client resets its internal state to "unlimited" for those endpoints and sends bursts that get 429 responses.

### Preferred Alternative
Apply rate limiting consistently across all API endpoints in the API middleware group. Every response includes rate limit headers.

### Refactoring Strategy
1. Ensure all API routes are in groups with `throttle` middleware
2. Apply a global API rate limiter in addition to per-endpoint limiters
3. For exempt endpoints, include headers with `PHP_INT_MAX` remaining
4. Test header presence across all API endpoints
5. Document header format and expected presence

### Detection Checklist
- [ ] Check each API route group for `throttle` middleware
- [ ] Verify all endpoints return rate limit headers
- [ ] Check for routes with no middleware group

### Related Rules
- Always Return Rate Limit Headers on Every Rate-Limited Endpoint (05-rules.md)

### Related Skills
- (Middleware configuration)

### Related Decision Trees
- (Rate limiting architecture decisions)

---

## Anti-Pattern 4: Rate Limit Headers Not Exposed via CORS

### Category
Framework Usage

### Description
Setting rate limit headers on the server but not listing them in `Access-Control-Expose-Headers` CORS configuration, so browser-based JavaScript clients cannot read them.

### Why It Happens
Server-side developers don't consider the browser's CORS restrictions. The headers are present in the network response but invisible to JavaScript due to browser security.

### Warning Signs
- Rate limit headers present in browser "Network" tab but not accessible via `fetch` or `XMLHttpRequest`
- `getResponseHeader('X-RateLimit-Remaining')` returns `null`
- `Access-Control-Expose-Headers` does not include rate limit headers
- No CORS configuration update when rate limiting was added

### Why It Is Harmful
Browser-based API clients cannot implement intelligent backoff or display remaining request counts. Rate limit awareness is limited to network tab debugging, not application code.

### Real-World Consequences
A SPA makes 60 requests before hitting the limit. The 61st request gets a 429. The SPA has no way to read `X-RateLimit-Remaining` to preemptively slow down. The user sees a sudden error instead of graceful degradation.

### Preferred Alternative
Add rate limit headers to `exposed_headers` in CORS configuration.

### Refactoring Strategy
1. Update `config/cors.php` `exposed_headers` with rate limit header names
2. Include both `X-RateLimit-*` and `RateLimit-*` (RFC 9213) variants
3. Test from browser: `fetch('/api/data').then(r => r.headers.get('X-RateLimit-Remaining'))`
4. Verify all rate limit headers are accessible from JavaScript

### Detection Checklist
- [ ] Check `config/cors.php` for `exposed_headers`
- [ ] Test `getResponseHeader('X-RateLimit-Remaining')` from browser console
- [ ] Verify CORS and rate limit docs are synchronized

### Related Rules
- Expose Rate Limit Headers via CORS for Browser Clients (05-rules.md)

### Related Skills
- (CORS configuration implementation)

### Related Decision Trees
- (CORS configuration decisions)

---

## Anti-Pattern 5: Headers Stripped by Reverse Proxy

### Category
Reliability

### Description
Rate limit headers are correctly set by Laravel but stripped by the reverse proxy (Nginx, Cloudflare) before reaching the client, rendering them invisible.

### Why It Happens
Reverse proxies often strip non-standard headers by default for security. `X-RateLimit-*` headers are non-standard and get removed unless explicitly configured to pass through.

### Warning Signs
- Rate limit headers visible when hitting Laravel directly but missing through the proxy
- `curl` directly to PHP-FPM shows headers, but through Nginx they're gone
- No `proxy_pass_header` directives for rate limit headers in Nginx config
- Cloudflare dashboard doesn't show rate limit headers in response

### Why It Is Harmful
All the work implementing rate limit headers is wasted — clients never receive them. Client-side backoff is impossible. The headers might as well not exist.

### Real-World Consequences
Support team spends weeks investigating why clients can't see rate limit headers. The headers are being set correctly in Laravel but stripped by Nginx. Development team blames operations, operations blames development.

### Preferred Alternative
Configure the reverse proxy to pass through rate limit headers. Test the full request path, not just Laravel.

### Refactoring Strategy
1. Check Nginx config: add `proxy_pass_header X-RateLimit-Limit;` etc.
2. Check Cloudflare settings: ensure custom headers are not stripped
3. Test through the full proxy chain, not just direct to Laravel
4. Add a CI test that verifies headers through the proxy
5. Document header pass-through requirements for infrastructure changes

### Detection Checklist
- [ ] Test headers through reverse proxy, not just direct to Laravel
- [ ] Check Nginx/Cloudflare config for header pass-through
- [ ] Verify headers reach the browser/client

### Related Rules
- Never Strip Rate Limit Headers at Reverse Proxy (05-rules.md)

### Related Skills
- (Infrastructure configuration for API access)

### Related Decision Trees
- (Middleware vs proxy-level decisions)

---
