# Anti-Patterns — `RateLimiter` Facade for Job Rate Limiting

## Metadata
| Field | Value |
|-------|-------|
| Domain | Async & Distributed Systems |
| Subdomain | Job Middleware |
| Knowledge Unit | `RateLimiter` Facade for Job Rate Limiting |
| Version | 1.0 |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. Non-Atomic Check-and-Increment Race Condition
2. Missing Counter Clear on Throttle Success
3. Duplicated Rate Limiter Configuration
4. Non-Atomic Cache Driver for Rate Limiting

---

## 1. Non-Atomic Check-and-Increment Race Condition

### Category
Reliability

### Description
Using separate `tooManyAttempts()` and `hit()` calls instead of the atomic `attempt()` method, allowing concurrent workers to both pass the rate limit check before either increments the counter.

### Why It Happens
The natural code flow is: check if too many → if not, increment → proceed. The developer writes `if (!RateLimiter::tooManyAttempts($key, $max)) { RateLimiter::hit($key, $max); $next($job); }`. In single-worker testing this works. In production with concurrent workers, two workers both check `tooManyAttempts` at the same time, both see "under limit," both increment, and both proceed — exceeding the limit.

### Warning Signs
- `tooManyAttempts()` followed by `hit()` in separate calls
- Rate limit exceeded by more than the configured max
- Duplicate bursts at window boundaries
- Race condition reproduces under concurrent worker testing

### Why Harmful
Two workers both check `tooManyAttempts("api-key", 100)` — both see 99 (under limit). Both call `hit()` — now the counter is 101, but both workers already proceeded. The rate limit of 100 is exceeded by 2. With 10 concurrent workers, it could be exceeded by 10+. The rate limiting provides no guarantee at the boundary — it fails open under concurrent access to the counter.

### Consequences
- Rate limit exceeded by N-1 extra executions per window
- Rate limiting guarantee violated under concurrent workers
- Downstream API receives more requests than configured
- API rate limit violations despite local rate limiting

### Alternative
Use `RateLimiter::attempt()` for atomic check-and-increment in a single operation.

### Refactoring Strategy
1. Replace `tooManyAttempts() + hit()` with single `attempt()` call
2. Pass the callback as the third argument to `attempt()`
3. Check return value of `attempt()` — if false, rate limit was hit
4. Handle rate-limited case (release job) in the else branch

### Detection Checklist
- [ ] `RateLimiter::attempt()` used instead of separate check+hit
- [ ] No race condition in rate limit enforcement
- [ ] Rate limit never exceeded by extra executions
- [ ] Concurrent workers respect limit boundaries

### Related Rules
prefer-attempt-for-simple-windows

### Related Skills
Build Custom Rate Limiting with the RateLimiter Facade

### Related Decision Trees
RateLimiter Facade vs Middleware for Job Rate Limiting

---

## 2. Missing Counter Clear on Throttle Success

### Category
Reliability

### Description
Not calling `RateLimiter::clear()` on successful job execution in throttle implementations, causing the failure counter to accumulate indefinitely and eventually throttle healthy jobs.

### Why It Happens
The developer implements a throttle middleware that calls `RateLimiter::hit()` on failure but forgets to call `RateLimiter::clear()` on success. The counter only goes up, never down. After a burst of transient failures, the counter exceeds the threshold. Even after the downstream service recovers and jobs succeed, the counter remains elevated, continuing to throttle.

### Warning Signs
- Throttle middleware hits counter on failure but no clear on success
- Counter grows monotonically with time
- Throttling persists after downstream recovery
- Manual cache clear resolves the issue temporarily

### Why Harmful
A downstream API has a 5-minute outage causing 50 job failures. The throttle counter hits 50 within 10 minutes (threshold exceeded). The API recovers, but the counter is never cleared. Jobs continue to be throttled for the entire decay window. Even after the window resets, another single failure re-establishes the high counter. The system never fully recovers from the outage without manual intervention.

### Consequences
- False throttling after downstream recovery
- Monotonically growing counter from accumulated failures
- Degraded throughput after every transient outage
- Manual intervention required to clear throttle state

### Alternative
Always call `RateLimiter::clear()` on successful execution in throttle implementations.

### Refactoring Strategy
1. Add `RateLimiter::clear($key)` in the success path (after `$next($job)`)
2. Ensure clear is called before any return points on success
3. Use try-finally or try-catch: clear on success, hit on failure
4. Test: verify counter resets after successful job execution

### Detection Checklist
- [ ] `RateLimiter::clear()` called on successful execution
- [ ] Counter resets after downstream recovery
- [ ] No persistent throttling after transient failures
- [ ] Throttle implementation follows clear-on-success pattern

### Related Rules
clear-counter-on-throttle-success

### Related Skills
Build Custom Rate Limiting with the RateLimiter Facade

### Related Decision Trees
RateLimiter Facade vs Middleware for Job Rate Limiting

---

## 3. Duplicated Rate Limiter Configuration

### Category
Maintainability

### Description
Defining the same rate limiter parameters (max attempts, decay) in multiple places — middleware, HTTP routes, and inline code — causing configuration drift and inconsistency.

### Why It Happens
Each consumer defines its own rate limiting parameters. The queue middleware sets `perMinute(60)`, the HTTP route middleware sets `60,1`, and a custom inline check uses hardcoded `60,1`. When the API changes its rate limit to 30 per minute, each location must be updated individually. One is missed, causing the system to have inconsistent limits.

### Warning Signs
- Same rate limit parameters duplicated across files
- Rate limit changes require updating multiple locations
- Some paths allow more requests than others
- Confusion about which limit is authoritative

### Why Harmful
The external API rate limit changes from 100/minute to 50/minute. The queue middleware is updated to `perMinute(50)`, but the HTTP route middleware is missed. API calls from routes continue at 100/minute while queue jobs are limited to 50/minute. The HTTP path exceeds the new API limit and gets throttled. Updating limits becomes a error-prone, multi-file operation.

### Consequences
- Inconsistent rate limits across different consumers
- Configuration drift over time
- Update errors from missed locations
- Some consumers exceed API limits while others are over-constrained

### Alternative
Define rate limiters centrally using `RateLimiter::for()` in `AppServiceProvider` and reference by name from all consumers.

### Refactoring Strategy
1. Register all rate limiters in `AppServiceProvider::boot()` via `RateLimiter::for()`
2. Reference limiters by name in middleware and routes
3. Remove inline rate limit configuration from individual consumers
4. For unique per-consumer adjustments, extend the named limiter rather than duplicating

### Detection Checklist
- [ ] Rate limiters defined centrally via `RateLimiter::for()`
- [ ] All consumers reference limiters by name
- [ ] No duplicate limiter definitions in codebase
- [ ] Single change updates all consumers

### Related Rules
use-named-limiters-for-configuration

### Related Skills
Build Custom Rate Limiting with the RateLimiter Facade

### Related Decision Trees
RateLimiter Facade vs Middleware for Job Rate Limiting

---

## 4. Non-Atomic Cache Driver for Rate Limiting

### Category
Reliability

### Description
Using `file` or `array` cache driver with the `RateLimiter` facade, which lacks atomic increment support and causes unreliable rate limit counters.

### Why It Happens
Development environments often default to `file` or `array` cache drivers. Rate limiting appears to work in development because concurrent access is rare. The developer doesn't check the cache driver configuration against the requirements. In production with Redis configured, it works. But if the cache driver is accidentally changed to `file`, rate limiting silently breaks.

### Warning Signs
- `CACHE_DRIVER=file` or `CACHE_DRIVER=array` configured
- Rate limit counters increase slower or faster than expected
- Race conditions in rate limit enforcement
- Rate limiting stops working without error messages

### Why Harmful
The `file` cache driver reads and writes files on the filesystem with no atomic increment support. Two workers calling `RateLimiter::hit()` simultaneously both read the same file, increment independently, and write back — one counter increment is lost. After 100 simultaneous hits, the counter might be 55 instead of 100. The rate limit enforcement is unreliable: sometimes too strict (counter reads high), sometimes too permissive (counter loses increments).

### Consequences
- Rate limit counters unreliable under concurrent access
- Lost increments from simultaneous file reads/writes
- Too-strict or too-permissive rate limiting
- Rate limiting silently fails without alerts

### Alternative
Use a cache driver with atomic increment support: Redis, Memcached, or DynamoDB.

### Refactoring Strategy
1. Verify `CACHE_DRIVER` is set to `redis` or `memcached`
2. Ensure Redis/Memcached server is running and accessible
3. Test atomicity: run concurrent `hit()` calls and verify counter accuracy
4. Remove fallback to `file` or `array` drivers in production

### Detection Checklist
- [ ] Cache driver supports atomic increment (Redis/Memcached)
- [ ] No `file` or `array` cache driver in production
- [ ] Concurrent counter increments accurate
- [ ] Rate limiting reliable under concurrent worker access

### Related Rules
use-cache-with-atomic-increment

### Related Skills
Build Custom Rate Limiting with the RateLimiter Facade

### Related Decision Trees
RateLimiter Facade vs Middleware for Job Rate Limiting
