# ECC Anti-Patterns — Cache Plugin for SaloonPHP

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 02-saloonphp |
| **Knowledge Unit** | Cache Plugin for SaloonPHP |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Cache-All Connector — Caching POST and Auth Requests
2. Uniform TTL for All Endpoints
3. Blind Invalidation on Every Mutation (Full Cache Flush)
4. Caching Without Hit-Rate Monitoring
5. User Data in Shared Cache Without Context Isolation

---

## Repository-Wide Anti-Patterns

- Premature Caching
- Premature Optimization

---

## Anti-Pattern 1: Cache-All Connector — Caching POST and Auth Requests

### Category
Security | Reliability

### Description
Applying the cache plugin at the connector level without filtering which requests are cached. POST, PUT, DELETE, and authentication endpoints are cached alongside GET requests.

### Why It Happens
The simplest configuration adds `HasCachePlugin` and configures a store. No `cacheOnlyRequestsUsing` filter is applied.

### Warning Signs
- `HasCachePlugin` trait added without `cacheOnlyRequestsUsing` filter
- POST requests return cached responses (silently skipping mutations)
- Auth tokens from cached responses are stale

### Why It Is Harmful
Caching POST responses means mutations are silently skipped on cache hit — the API is never called. Caching auth responses means expired tokens continue to authorize requests. Both cause incorrect application state.

### Real-World Consequences
`POST /charges` is cached. The first charge succeeds and is cached. All subsequent "charges" return the first charge's cached response. 100 customers are told "payment successful" but only 1 is actually charged. Customer service nightmare.

### Preferred Alternative
Filter `cacheOnlyRequestsUsing` to only cache GET requests and exclude auth endpoints.

### Refactoring Strategy
1. Add `cacheOnlyRequestsUsing()` filter to cache plugin configuration
2. Only allow `Method::GET` requests
3. Explicitly exclude auth request classes
4. Add integration test verifying non-GET requests bypass cache
5. Review all cached endpoints for idempotency

### Detection Checklist
- [ ] No `cacheOnlyRequestsUsing` filter configured
- [ ] POST/PUT/DELETE requests cached
- [ ] Auth requests cached

### Related Rules
Exclude Non-GET and Auth Requests from Caching (05-rules.md)

### Related Skills
Cache SaloonPHP Requests with the Cache Plugin (06-skills.md)

### Related Decision Trees
Cache Store Selection (07-decision-trees.md)

---

## Anti-Pattern 2: Uniform TTL for All Endpoints

### Category
Performance | Architecture

### Description
Setting a single TTL value at the connector level applied to all cached endpoints regardless of data volatility.

### Why It Happens
`$this->withCache(new RedisStore(...), ttl: 3600)` is the default configuration. Developers don't configure per-endpoint TTL.

### Warning Signs
- Single `ttl` parameter in `withCache()` call
- No `requestTtl()` configuration
- All endpoints have same cache duration regardless of content

### Why It Is Harmful
Volatile data (charge status) is served stale (3600s old). Static data (product catalog) is re-fetched every 3600s unnecessarily. Hit rate is suboptimal for both types.

### Real-World Consequences
Dashboard shows order status "pending" for up to 1 hour after payment succeeds because cache TTL is 3600s. Support tickets spike after every promotion. The 3600s TTL is too short for reference data, causing unnecessary API costs.

### Preferred Alternative
Configure per-endpoint TTL using `requestTtl()` based on data freshness requirements.

### Refactoring Strategy
1. Classify endpoints by data volatility
2. Configure `requestTtl()` for each endpoint class
3. Set connector default TTL as fallback
4. Monitor hit rate per endpoint to validate TTL choices
5. Adjust TTLs based on observed hit rate

### Detection Checklist
- [ ] Single TTL for all endpoints
- [ ] No `requestTtl()` configuration
- [ ] Same cache duration for charge status and product catalog

### Related Rules
Set TTL Per Endpoint, Not Per Connector (05-rules.md)

### Related Skills
Cache SaloonPHP Requests with the Cache Plugin (06-skills.md)

### Related Decision Trees
TTL Configuration Strategy (07-decision-trees.md)

---

## Anti-Pattern 3: Blind Invalidation on Every Mutation (Full Cache Flush)

### Category
Performance | Architecture

### Description
Calling `Cache::flush()` or full cache clear on every webhook event or data mutation. All cached responses are invalidated simultaneously.

### Why It Happens
Simple implementation: "data changed → clear cache." The developer doesn't consider that a single mutation (one charge) invalidates all cached data (all charges, all products, all customers).

### Warning Signs
- `Cache::flush()` called in webhook handlers
- Cache miss spike after every mutation
- Cache hit rate drops to near-zero during write-heavy periods

### Why It Is Harmful
Full cache flush causes a thundering herd of cache misses. All endpoints hit the upstream API simultaneously. Latency spikes, rate limits are hit, and the caching benefit is negated.

### Real-World Consequences
100 charges/minute processed. Each charge triggers a webhook that calls `Cache::flush()`. The cache is flushed 100 times/minute. Cache hit rate is 0%. All API calls go upstream. Stripe rate limits are hit. Integration degrades.

### Preferred Alternative
Use targeted tag-based or key-prefix invalidation to clear only affected entries.

### Refactoring Strategy
1. Organize cache keys with tags or prefixes per resource type
2. On mutation, invalidate only the affected resource's tags
3. Use `Cache::tags(['stripe:charges'])->flush()` instead of `Cache::flush()`
4. Verify only related entries are cleared
5. Monitor cache miss rate after mutations

### Detection Checklist
- [ ] `Cache::flush()` called on data changes
- [ ] Cache miss spike after mutations
- [ ] Cache hit rate drops during write-heavy periods

### Related Rules
Implement Targeted Cache Invalidation via Webhooks (05-rules.md)

### Related Skills
Cache SaloonPHP Requests with the Cache Plugin (06-skills.md)

### Related Decision Trees
Cache Invalidation Strategy (07-decision-trees.md)

---

## Anti-Pattern 4: Caching Without Hit-Rate Monitoring

### Category
Observability | Reliability

### Description
Deploying response caching without tracking cache hit rate. Configuration drift, TTL changes, or data pattern shifts go undetected.

### Why It Happens
Cache is configured and deployed. No one adds monitoring because "it just works." Hit rate is assumed to be good.

### Warning Signs
- No cache hit rate metric in the monitoring dashboard
- No alert for low cache hit rates
- API costs increase but the cause is unknown

### Why It Is Harmful
Degrading cache performance is invisible. A configuration change that reduces hit rate from 90% to 30% goes unnoticed for weeks. API costs increase, latency increases, but the team doesn't know why.

### Real-World Consequences
A TTL configuration change reduces hit rate from 95% to 40%. Monthly Stripe API costs go from $500 to $3000. The increase is attributed to "business growth" for 3 months before someone notices the cache regression.

### Preferred Alternative
Track cache hit rate per connector. Alert on drops below 90%.

### Refactoring Strategy
1. Add cache hit/miss counters to the cache plugin configuration
2. Log hit/miss with each cache operation
3. Create a dashboard showing hit rate per connector
4. Set alert at 85% hit rate threshold
5. Review monthly hit rate trends

### Detection Checklist
- [ ] Cache hit rate not tracked
- [ ] No cache performance metrics in dashboard
- [ ] API cost increases without clear cause

### Related Rules
Monitor Cache Hit Rate as a Key Metric (05-rules.md)

### Related Skills
Cache SaloonPHP Requests with the Cache Plugin (06-skills.md)

### Related Decision Trees
Cache Invalidation Strategy (07-decision-trees.md)

---

## Anti-Pattern 5: User Data in Shared Cache Without Context Isolation

### Category
Security | Reliability

### Description
Caching responses for user-scoped API endpoints without including user identity in the cache key. One user's cached data is served to another user.

### Why It Happens
Default cache key generation uses connector + request + query params. User context (auth token, user ID) is not included.

### Warning Signs
- User A sees User B's data in cached responses
- Cache key does not include any user identifier
- Shared cache store for user-specific API endpoints

### Why It Is Harmful
Data leakage between users. User A's profile, orders, or payment history appears for User B. This is a data breach and may violate GDPR/PCI compliance.

### Real-World Consequences
Customer A views their order history. The response is cached. Customer B makes the same API call and receives Customer A's orders. Customer B sees Customer A's address, payment method, and order details. Data breach notification is required.

### Preferred Alternative
Include user ID or session identifier in cache keys for user-scoped endpoints. Use per-user cache namespaces.

### Refactoring Strategy
1. Identify user-scoped API endpoints
2. Override `cacheKey()` to include user ID or tenant ID
3. Use per-user cache namespace or tags
4. Ensure cache key includes all authentication context
5. Review all cached endpoints for data isolation

### Detection Checklist
- [ ] Cache key excludes user identity
- [ ] User-specific endpoints cached without context isolation
- [ ] Potential data leakage between users

### Related Rules
Monitor Cache Hit Rate as a Key Metric (05-rules.md)

### Related Skills
Cache SaloonPHP Requests with the Cache Plugin (06-skills.md)

### Related Decision Trees
Cache Invalidation Strategy (07-decision-trees.md)
