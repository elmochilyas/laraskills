# ECC Anti-Patterns — Rate Limiter Definition

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | API & CRUD System Engineering |
| **Subdomain** | API Authentication & Authorization |
| **Knowledge Unit** | Rate Limiter Definition |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Inline throttle:60,1 Instead of Named Limiters
2. Missing Consumer Key in Rate Limiter
3. File-Based Cache for Rate Limiting
4. Single-Bucket Limit Without Sustain Protection
5. Rate Limiter Defined in Route Files Instead of Service Providers

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries
- Premature Caching

---

## Anti-Pattern 1: Inline throttle:60,1 Instead of Named Limiters

### Category
Maintainability

### Description
Using inline middleware syntax `throttle:60,1` directly on routes instead of defining named limiters via `RateLimiter::for()`, scattering configuration across route files.

### Why It Happens
The inline syntax is concise and familiar from Laravel documentation examples. Creating a named limiter requires an additional step in a service provider.

### Warning Signs
- `->middleware('throttle:30,1')`, `throttle:60,1` scattered across route files
- No `RateLimiter::for()` calls in service providers
- Different limits on different routes with the same purpose
- Cannot unit test rate limiter behavior because it's tied to route definitions

### Why It Is Harmful
Limits are inconsistent across routes, cannot be tested independently, and changing a limit requires finding all inline occurrences. The rate limiting architecture is invisible and ungoverned.

### Real-World Consequences
A security review finds the login endpoint uses `throttle:60,1` while data endpoints use `throttle:30,1`. The login limit is twice as generous as the data limit — the opposite of what's needed. Refactoring requires touching 15 route files.

### Preferred Alternative
Define named limiters in service providers: `RateLimiter::for('api', fn($request) => Limit::perMinute(60))`. Reference as `throttle:api`.

### Refactoring Strategy
1. Create a `RateLimiterServiceProvider` with all named limiters
2. Replace `throttle:60,1` with `throttle:api` across all routes
3. Write unit tests for each named limiter
4. Remove all inline throttle middleware parameters

### Detection Checklist
- [ ] Search for `throttle:` in route files
- [ ] Count unique inline limit values — group into named limiters
- [ ] Check for `RateLimiter::for()` calls in service providers

### Related Rules
- Use Named Limiters Instead of Inline throttle:60,1 (05-rules.md)

### Related Skills
- (Rate limiter implementation)

### Related Decision Trees
- (Rate limiting architecture decisions)

---

## Anti-Pattern 2: Missing Consumer Key in Rate Limiter

### Category
Architecture

### Description
Defining a rate limiter without calling `->by()` to set a consumer key, causing Laravel to default to the request URL path and grouping all consumers under a single counter.

### Why It Happens
The simplest `RateLimiter::for('api', fn($request) => Limit::perMinute(60))` works and doesn't show a warning. The missing identifier is invisible.

### Warning Signs
- `Limit::perMinute(60)` without `->by()` in any limiter
- All users share the same rate limit counter
- One user exhausting the limit blocks all other users
- Rate limiter key is the URL path, not the consumer

### Why It Is Harmful
When the consumer key defaults to the URL path, all users share the same rate limit budget. A single abusive user or compromised client can exhaust the limit for every other user, causing a global API outage.

### Real-World Consequences
One compromised API key sends 60 requests in a minute. All other users get 429 responses for the remainder of the minute. The API appears to be under attack but it's actually a rate limiter configuration bug.

### Preferred Alternative
Always provide an explicit consumer key via `->by()`: `Limit::perMinute(60)->by($request->user() ? 'user:'.$request->user()->id : 'ip:'.$request->ip())`.

### Refactoring Strategy
1. Review every `RateLimiter::for()` callback
2. Add `->by()` with appropriate consumer identifier
3. Prefix keys by type (user:, ip:, service:) to prevent collisions
4. Test that different consumers have independent counters

### Detection Checklist
- [ ] Check all `RateLimiter::for()` calls for `->by()`
- [ ] Verify the key includes a consumer-specific identifier
- [ ] Test that two different IPs have separate counters

### Related Rules
- Always Include a Consumer Key in Every Limiter (05-rules.md)

### Related Skills
- (Rate limiter implementation)

### Related Decision Trees
- (Rate limit key strategy decisions)

---

## Anti-Pattern 3: File-Based Cache for Rate Limiting

### Category
Reliability

### Description
Using Laravel's file cache driver as the rate limiting backend, causing race conditions under concurrent requests and inaccurate rate limit counts.

### Why It Happens
The file cache driver is the default in Laravel. Developers don't explicitly configure Redis and don't test under concurrent load.

### Warning Signs
- `CACHE_STORE=file` in production `.env`
- No Redis configured for the application
- Rate limit bypass reported under high traffic
- Intermittent 429 responses at low traffic (race conditions inflating counts)
- Rate limit tests that pass in isolation but fail in parallel

### Why It Is Harmful
File-based caching lacks atomic INCR operations. Under concurrent requests, two processes can read the same counter value and both increment, allowing 2x the intended requests through. Race conditions cause both over-counting (false 429s) and under-counting (limit bypass).

### Real-World Consequences
During a traffic spike, 10 concurrent requests all read the same "5 remaining" counter. All increment to "4 remaining" independently. The actual 50 requests exceed the limit of 60, but the counter shows only 10 used. The rate limit is effectively bypassed by 5x.

### Preferred Alternative
Use Redis (or Memcached) for rate limiting. Redis provides atomic INCR + EXPIRE operations.

### Refactoring Strategy
1. Install and configure Redis server
2. Set `CACHE_STORE=redis` or configure a separate `redis` cache store
3. Test rate limiting under concurrent load
4. Implement fail-open/closed handling for Redis outage
5. Monitor Redis memory usage for rate limit keys

### Detection Checklist
- [ ] Check `CACHE_STORE` in `.env` — must not be `file`
- [ ] Verify Redis is installed and configured
- [ ] Run concurrent rate limit tests
- [ ] Check for atomic INCR operations (Redis handles this)

### Related Rules
- Use Redis as Cache Backend, Never File (05-rules.md)

### Related Skills
- (Cache configuration for rate limiting)

### Related Decision Trees
- (Cache backend selection decisions)

---

## Anti-Pattern 4: Single-Bucket Limit Without Sustain Protection

### Category
Scalability

### Description
Using only a single time window (e.g., per-minute limit) without a longer window (per-hour), allowing sustained abuse at the maximum per-minute rate across hours.

### Why It Happens
A single per-minute limit is the default example and seems sufficient. The cumulative effect of sustained maximum throughput is not immediately obvious.

### Warning Signs
- Limiter returns a single `Limit::perMinute()` without additional buckets
- No `Limit::perHour()` or `Limit::perDay()` in the array
- Peak hourly requests match `maxAttempts * 60` (sustained max rate)
- No monitoring alerts for hourly request volume

### Why It Is Harmful
A 60/min limit allows 3,600 requests per hour and 86,400 per day. A single attacker or compromised client can sustain 86,400 requests/day while staying within the per-minute limit. This volume can degrade database performance for all users.

### Real-World Consequences
A scraper sends exactly 59 requests per minute, staying under the 60/min limit. Over 24 hours, they make 84,960 requests. The database server shows sustained high load. The rate limit is technically working but failing to protect infrastructure.

### Preferred Alternative
Use multi-bucket limits: combine per-minute and per-hour limits in an array. The most restrictive bucket governs.

### Refactoring Strategy
1. Add `Limit::perHour(1000)` alongside `Limit::perMinute(60)`
2. Ensure both use the same consumer key
3. Test that both windows are independently enforced
4. Monitor per-hour hit rates to tune limits

### Detection Checklist
- [ ] Check limiter definitions for single vs multi-bucket
- [ ] Verify both burst and sustain limits exist
- [ ] Calculate maximum hourly throughput of current limits

### Related Rules
- Use Multi-Bucket Limits for Burst + Sustain Protection (05-rules.md)

### Related Skills
- (Rate limiter design)

### Related Decision Trees
- (Rate limit window selection)

---

## Anti-Pattern 5: Rate Limiter Defined in Route Files Instead of Service Providers

### Category
Architecture

### Description
Calling `RateLimiter::for()` inside route files instead of service provider `boot()` methods, causing re-registration on every request and potential state management issues.

### Why It Happens
It's convenient to keep rate limiter definitions close to the routes they protect. Developers don't realize that route files may be re-evaluated on each request.

### Warning Signs
- `RateLimiter::for()` calls in `routes/api.php` or similar route files
- Rate limit behavior seems inconsistent or resets unexpectedly
- No dedicated rate limiter service provider
- Limiter callbacks that depend on request state are evaluated multiple times

### Why It Is Harmful
Route files may be re-evaluated on each request, re-registering limiters and potentially losing state. Limiter callbacks may be invoked multiple times, leading to inconsistent behavior and harder debugging.

### Real-World Consequences
In a Laravel Octane environment, route files are loaded once on startup, but in traditional Laravel, route files are cached after first load. Mixed environments cause inconsistent behavior. A developer tests locally (no cache) and sees limiters work, but production (cached) shows different behavior.

### Preferred Alternative
Define all named limiters in a service provider's `boot()` method.

### Refactoring Strategy
1. Create `app/Providers/RateLimiterServiceProvider.php`
2. Move all `RateLimiter::for()` calls from route files to the provider
3. Register the provider in `config/app.php`
4. Remove `RateLimiter::for()` calls from route files
5. Test rate limiting behavior across environments

### Detection Checklist
- [ ] Search for `RateLimiter::for(` in route files
- [ ] Verify service provider has all limiter definitions
- [ ] Check that no route file contains `RateLimiter::for()`

### Related Rules
- Define Limiters in Service Provider Boot Method (05-rules.md)

### Related Skills
- (Application architecture patterns)

### Related Decision Trees
- (Code organization decisions)

---
