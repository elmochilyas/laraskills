# ECC Anti-Patterns — Auth Endpoint Optimization & Caching

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Real-Time Systems |
| **Subdomain** | Channel Types & Authorization |
| **Knowledge Unit** | Auth Endpoint Optimization & Caching |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No Rate Limiting on Auth Endpoint
2. Complex Permission Trees in Auth Callbacks
3. No Auth Caching — Repeated Database Queries
4. Generic Rate Limits Applied to Auth Endpoint
5. Cache Stampede Vulnerability — All Entries Expire Simultaneously

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries
- Premature Caching

---

## Anti-Pattern 1: No Rate Limiting on Auth Endpoint

### Category
Security | Scalability

### Description
Not applying rate limiting to the `/broadcasting/auth` endpoint, leaving it vulnerable to reconnection storms and DoS attacks that can overwhelm the application.

### Warning Signs
- `Broadcast::routes()` without throttle middleware
- Auth endpoint receives unlimited requests per IP/user
- During reconnection storms, auth endpoint CPU spikes to 100%
- No rate limit configured for auth specifically

### Why It Is Harmful
Without rate limiting, a reconnection storm (network recovery, deploy) can send thousands of concurrent auth requests. Each request executes the auth callback, potentially querying the database. This cascade can overwhelm application servers and the database.

### Real-World Consequences
A 30-second network outage affects 10,000 WebSocket clients. When the network recovers, all 10,000 clients reconnect simultaneously, each sending an auth request. The auth endpoint receives 10,000 requests per second. The database cannot handle 10,000 queries per second. Auth response time goes from 20ms to 5s.

### Preferred Alternative
Apply rate limiting specifically tuned for the auth endpoint's expected traffic patterns.

### Refactoring Strategy
1. Add throttle middleware: `Broadcast::routes(['middleware' => ['auth:sanctum', 'throttle:200,1']])`
2. Set limit higher than regular API routes to accommodate reconnection storms
3. Test with expected reconnection volume

### Detection Checklist
- [ ] No throttle on auth endpoint
- [ ] Reconnection storms overwhelm auth
- [ ] Auth endpoint performance degrades under load

### Related Rules
- (Implied: rate limit auth endpoint — from anti-patterns in knowledge)

---

## Anti-Pattern 2: Complex Permission Trees in Auth Callbacks

### Category
Performance

### Description
Running multiple database queries and complex permission checks inside channel auth callbacks, causing slow auth response times that block WebSocket subscriptions.

### Warning Signs
- Auth callbacks contain multiple database queries
- Permission checks via Gates/roles inside callbacks
- Auth response time > 100ms consistently
- Callbacks query multiple tables per request

### Why It Is Harmful
Auth callbacks execute synchronously on every subscription, blocking the WebSocket subscription flow. Complex permission trees with multiple queries add 50-200ms per auth request. During reconnection storms, this compounds into cascading degradation.

### Real-World Consequences
An auth callback queries three tables (user roles, team membership, resource ownership) on every subscription. Each query takes 15ms. Total auth time is 60ms. During a reconnection storm of 5,000 clients, the database handles 5,000 queries per callback type = 15,000 queries for a single reconnection wave.

### Preferred Alternative
Keep auth callbacks minimal — use simple ID comparisons. Cache or delegate complex logic to pre-computed values.

### Refactoring Strategy
1. Identify auth callbacks with multiple queries
2. Replace with simple ID comparisons where possible
3. Cache authorization results with appropriate TTL
4. Benchmark auth endpoint P95 latency

### Detection Checklist
- [ ] Multiple DB queries in auth callback
- [ ] Auth response time > 50ms P95
- [ ] Callbacks contain complex permission logic

### Related Rules
- (Implied: minimize auth callback complexity — from anti-patterns in knowledge)

---

## Anti-Pattern 3: No Auth Caching — Repeated Database Queries

### Category
Performance

### Description
Not caching auth callback results, causing every subscription attempt by the same user for the same channel to execute the same database queries repeatedly.

### Warning Signs
- Same channel subscription hits database every time
- No Cache::remember() in auth callbacks
- Page navigation/re-subscription always queries DB
- Auth response time stable but database queries repeat

### Why It Is Harmful
Channel authorization is checked once per subscription. If a user navigates to a page, subscribes, navigates away, and returns, the same auth callback fires again. Without caching, every navigation repeats the same database queries. At scale, this multiplies database load.

### Real-World Consequences
A user navigates between 10 pages in an SPA. Each page subscribes to the same `orders.{id}` channel. Without auth caching, all 10 navigations query the database to check order ownership. That's 10 queries where 1 (cached) would suffice.

### Preferred Alternative
Cache auth decisions with `Cache::remember()` using appropriate TTL.

### Refactoring Strategy
1. Wrap callback logic: `Cache::remember("auth:{$channel}:user:{$userId}", 300, fn() => ...)`
2. Set TTL based on how often permissions change
3. Invalidate cache when user permissions change

### Detection Checklist
- [ ] No auth caching implemented
- [ ] Repeated DB queries for same user+channel
- [ ] Auth response time dominated by query time

### Related Rules
- (Implied: cache auth decisions — from best practices in knowledge)

---

## Anti-Pattern 4: Generic Rate Limits Applied to Auth Endpoint

### Category
Performance

### Description
Applying the same default rate limits (e.g., 60 requests/minute) to the auth endpoint as regular API routes, causing legitimate reconnection traffic to be rate-limited.

### Warning Signs
- Auth endpoint uses the same throttle as regular API routes
- Reconnection storms trigger 429 rate limit responses
- Clients fail to re-subscribe because auth is rate-limited
- Rate limit set too low for expected connection volume

### Why It Is Harmful
The auth endpoint has different traffic patterns than regular API routes. A reconnection storm sends concentrated auth requests in seconds. Generic rate limits (60/min) are designed for human interaction, not machine reconnection — they rate-limit legitimate reconnection traffic.

### Real-World Consequences
After a deploy, 5,000 clients reconnect within 10 seconds. The auth endpoint's generic rate limit (100/min) kicks in after 100 requests. 4,900 clients receive 429. They cannot subscribe to private channels. Real-time features are broken for 5 minutes during retry backoff.

### Preferred Alternative
Apply a higher, auth-specific rate limit that accommodates reconnection storms while still protecting against abuse.

### Refactoring Strategy
1. Create auth-specific rate limit: `throttle:1000,1`
2. Or remove global throttle and implement per-user rate limiting
3. Test reconnection scenario to verify adequate limit

### Detection Checklist
- [ ] Auth uses same rate limit as API routes
- [ ] Reconnections trigger 429 responses
- [ ] Rate limit too low for expected connection volume

### Related Rules
- (Implied: tune rate limit for auth endpoint specifically — from anti-patterns in knowledge)

---

## Anti-Pattern 5: Cache Stampede Vulnerability — All Entries Expire Simultaneously

### Category
Performance

### Description
Using the same TTL for all auth cache entries without jitter, causing all cached decisions to expire simultaneously and creating a mass database query wave.

### Warning Signs
- All auth cache entries have the same TTL
- Cache entries expire simultaneously at regular intervals
- Database query spikes occur at TTL expiry intervals
- Auth response time increases regularly at TTL boundaries

### Why It Is Harmful
With uniform TTL, all cached auth decisions created in a short window expire at the same time. The next subscription wave triggers N simultaneous cache misses, each falling back to a database query. This cache stampede creates regular database load spikes.

### Real-World Consequences
All auth cache entries have 300s TTL. Every 5 minutes, all entries expire simultaneously. The next 60 seconds see 1,000 concurrent cache misses, each querying the database. Database CPU spikes 40% every 5 minutes, exactly at the cache expiry boundary.

### Preferred Alternative
Add jitter to cache TTL and implement stampede prevention (locking, early recompute).

### Refactoring Strategy
1. Add jitter: `$ttl = 300 + rand(0, 60)`
2. Implement stampede prevention: cache lock on miss, only one process recomputes
3. Use early recompute: refresh cache before expiry
4. Monitor cache hit ratio

### Detection Checklist
- [ ] Uniform TTL for all auth cache entries
- [ ] Database query spikes at TTL expiry
- [ ] No stampede prevention

### Related Rules
- (Implied: prevent cache stampede with jitter and locking — from common mistakes in knowledge)
