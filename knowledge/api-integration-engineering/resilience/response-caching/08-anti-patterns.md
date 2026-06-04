# Anti-Patterns — Response Caching for Read Operations

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | resilience-patterns |
| Knowledge Unit | Response Caching for Read Operations |
| Version | 1.0 |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. Cache Stampede Ignorance
2. No Invalidation Strategy
3. Controller-Level Cache Coupling
4. Shared Cache Key Collision
5. Cache Hit Ratio Monitoring Blindness

---

## 1. Cache Stampede Ignorance

### Category
Performance

### Description
Using simple `Cache::remember()` on high-traffic endpoints without stampede protection, causing all concurrent requests to hit the upstream simultaneously when the cache expires.

### Why It Happens
`Cache::remember()` is the simplest caching pattern — it returns cached data or stores the result of the closure. It works perfectly for low-traffic endpoints. The developer doesn't consider what happens when 100 concurrent requests all miss the cache at the same time after TTL expiry. Each request executes the closure and hits the upstream API simultaneously.

### Warning Signs
- `Cache::remember()` without lock on endpoints with >50 req/s
- Traffic spikes observed at cache TTL boundaries
- Upstream API latency spikes coincide with cache expiry
- Database/upstream load patterns show regular spikes

### Why Harmful
When the cache expires for a popular endpoint, every concurrent request calls the upstream simultaneously. A 100ms upstream call with 100 concurrent misses turns into 100 simultaneous upstream requests, potentially overwhelming the upstream API or causing rate limiting. Response time degrades from ~1ms (cache hit) to ~500ms+ (queue wait). The cache designed to reduce upstream load instead causes load spikes.

### Consequences
- Upstream API overload at cache expiry boundaries
- Rate limiting or throttling from concurrent cache misses
- Response time degradation during cache refresh periods
- Cascading failures if upstream cannot handle burst load

### Alternative
Use `Cache::lock()` to serialize cache regeneration, allowing only one request to regenerate while others wait or serve stale data.

### Refactoring Strategy
1. Identify endpoints with >50 req/s and measurable cache miss impact
2. Wrap cache regeneration in `Cache::lock()` acquisition
3. Configure lock timeout to exceed regeneration time
4. For high-availability endpoints, implement stale-while-revalidate
5. Test under load: verify single upstream request on cache expiry

### Detection Checklist
- [ ] Stampede protection on high-traffic endpoints
- [ ] Cache lock acquired during regeneration
- [ ] No upstream load spikes at cache expiry boundaries
- [ ] Stale-while-revalidate for critical endpoints

### Related Rules
Track Cache Hit Ratio Per Endpoint

### Related Skills
Cache Idempotent Operation Responses for Retry Safety

### Related Decision Trees
Cache Stampede Protection Strategy

---

## 2. No Invalidation Strategy

### Category
Reliability

### Description
Relying solely on TTL expiry for cache invalidation without event-driven or webhook-based invalidation, serving stale data for the entire TTL period after data changes.

### Why It Happens
TTL-based caching is the easiest to implement — set a TTL and forget it. Event-driven invalidation requires an additional mechanism: webhook listeners, model observers, or manual flush buttons. The developer assumes the TTL is short enough that staleness is acceptable, but doesn't measure the actual impact of serving 5-minute-old data for a resource that changes every 30 seconds.

### Warning Signs
- No cache invalidation logic beyond TTL expiry
- Stale data served for minutes after upstream changes
- Users report "data not updating" that resolves after TTL
- No webhook listeners for cache invalidation

### Why Harmful
A product price changes via a webhook event, but the cached response shows the old price for 5 minutes (the TTL). Users see incorrect pricing, place orders at old prices, or see inconsistent product availability. The cache is working as configured but the staleness window is too long for the data's change frequency. The cache designed to improve performance instead causes data freshness issues.

### Consequences
- Stale data served for entire TTL period after changes
- User-facing data freshness issues
- Business impact from stale pricing/availability
- Support tickets for "stale data" problems

### Alternative
Implement webhook-based cache invalidation for resources that change between TTL expiries, with TTL as a safety net.

### Refactoring Strategy
1. Identify data resources that change before TTL expires
2. Subscribe to webhook events for those resources
3. Use cache tags for group invalidation by resource type
4. Add manual flush buttons for admin panels
5. Keep TTL as maximum staleness bound, not primary invalidation mechanism

### Detection Checklist
- [ ] Webhook-based invalidation for frequently changing resources
- [ ] Cache tags used for group invalidation
- [ ] Manual flush available for admin operations
- [ ] TTL serves as safety net, not primary invalidation

### Related Rules
Set TTLs per Data Type

### Related Skills
Cache Idempotent Operation Responses for Retry Safety

### Related Decision Trees
Cache Invalidation Strategy (TTL vs Event-based)

---

## 3. Controller-Level Cache Coupling

### Category
Code Organization

### Description
Implementing caching logic in controllers instead of service classes, preventing reuse by queue jobs, commands, or other consumers.

### Why It Happens
The controller is where data is fetched and responses returned. Adding `Cache::remember()` there is natural and visible. The developer doesn't anticipate that a queue job or Artisan command will need the same cached data. When another consumer needs the same data, caching is duplicated or omitted entirely.

### Warning Signs
- `Cache::remember()` or `Cache::get()` in controller methods
- Queue jobs or commands re-fetch data without cache benefits
- Cache logic duplicated between controller and other consumers
- Inconsistent TTLs between controller and service layer consumers

### Why Harmful
A controller caches Stripe charge data with a 5-minute TTL. A queue job also needs to fetch the same data but doesn't use the cache — it calls the Stripe API directly. The cache provides no benefit to the queue job, and the Stripe API receives more calls than necessary. When the TTL is changed in the controller, the queue job's non-cached calls reflect the old behavior. Cache benefits are limited to one consumer.

### Consequences
- Cache not shared between all consumers
- Queue jobs and commands bypass cache benefits
- TTL configuration scattered across consumers
- Cache logic duplicated and inconsistent

### Alternative
Implement caching in service classes, making it transparent to all consumers (controllers, queue jobs, commands).

### Refactoring Strategy
1. Move `Cache::remember()` logic from controllers to service methods
2. Ensure service class methods always use cache regardless of caller
3. Update controllers to call service methods (no direct cache logic)
4. Update queue jobs and commands to use the same service methods
5. Remove duplicated cache logic from other consumers

### Detection Checklist
- [ ] Caching implemented in service layer
- [ ] All consumers use cached service methods
- [ ] No direct cache calls in controllers
- [ ] Queue jobs and commands benefit from cache

### Related Rules
Cache at Service Layer, Not Controller

### Related Skills
Cache Idempotent Operation Responses for Retry Safety

### Related Decision Trees
Cache Freshness Strategy

---

## 4. Shared Cache Key Collision

### Category
Maintainability

### Description
Using generic cache keys without service name prefixes across multiple upstream integrations, causing key collisions where different services overwrite each other's cached data.

### Why It Happens
Simple cache keys like `'charges'` or `'prices'` are intuitive and easy to read. When a second integration is added, the developer may not realize the key is already in use. The collision is subtle — one service sets `cache:charges` and another overwrites it with different data. The first service then retrieves the wrong data silently.

### Warning Signs
- Cache keys without service name prefixes (`'charges'` not `'stripe:charges'`)
- Cache data occasionally returns wrong schema or values
- Multiple services using the same cache store
- Cache debugging reveals unexpected values

### Why Harmful
Stripe's charge list and PayPal's charge list are cached under the same key `'charges'`. When the Stripe service writes to the cache, it overwrites PayPal's cached data. The PayPal service retrieves Stripe's data and returns it as PayPal charges. Wrong data is served silently — no exception, no error log, just incorrect data that's hard to trace.

### Consequences
- Wrong data served from cache collisions
- Silent data corruption across services
- Hard-to-debug heisenbugs (intermittent based on cache write timing)
- Cache provides incorrect results without notification

### Alternative
Prefix all cache keys with the service name and resource type (e.g., `stripe:charges:list`).

### Refactoring Strategy
1. Define a cache key convention: `{service}:{resource}:{action}`
2. Add `config('cache.key_prefix.stripe') . ':charges'` or use constants
3. Audit all existing cache keys for collisions
4. Migrate to namespaced keys during low-traffic period
5. Use separate cache pools per service when appropriate

### Detection Checklist
- [ ] All cache keys include service name prefix
- [ ] Cache key convention documented and enforced
- [ ] No generic keys shared across services
- [ ] Separate stores/pools for multi-service setups

### Related Rules
Always Include Key Namespace in Cache Key

### Related Skills
Cache Idempotent Operation Responses for Retry Safety

### Related Decision Trees
Cache Invalidation Strategy (TTL vs Event-based)

---

## 5. Cache Hit Ratio Monitoring Blindness

### Category
Observability

### Description
Not monitoring cache hit ratio per endpoint, leaving cache degradation (misconfiguration, stampede, invalidation bugs) invisible until upstream costs spike or response times degrade.

### Why It Happens
Cache starts with 90%+ hit ratio by default. The developer assumes it stays that way. Over time, configuration changes, new deployment patterns, or upstream data changes can degrade the hit ratio. Without monitoring, a drop from 90% to 40% goes unnoticed for weeks, silently increasing upstream API costs and slowing response times.

### Warning Signs
- No cache hit ratio metrics tracked
- Upstream API costs increasing without explanation
- Response times gradually degrading
- No alerting on cache efficiency changes

### Why Harmful
A caching mistake (wrong key structure, TTL too short, invalidation bug) reduces the hit ratio from 90% to 30%. Each day, 70% of requests bypass the cache and hit the upstream API. Latency increases from 1ms to 200ms for those requests. Upstream API costs triple. The team doesn't notice until the monthly billing statement or customer complaints about slow performance.

### Consequences
- Undetected cache efficiency degradation
- Increased upstream API costs
- Gradual response time degradation
- Lost cost optimization opportunities

### Alternative
Track cache hit ratio per endpoint, create dashboards, and alert on significant drops.

### Refactoring Strategy
1. Add hit/miss counters in cache access code
2. Track `cache.hit_ratio` metric per endpoint
3. Create dashboard showing hit ratio trends
4. Set alert on hit ratio drop below 80%
5. Investigate drops as production incidents

### Detection Checklist
- [ ] Cache hit ratio tracked per endpoint
- [ ] Dashboard visible to team
- [ ] Alerts configured for significant drops
- [ ] Hit ratio >90% target maintained

### Related Rules
Track Cache Hit Ratio Per Endpoint

### Related Skills
Cache Idempotent Operation Responses for Retry Safety

### Related Decision Trees
Cache Stampede Protection Strategy
