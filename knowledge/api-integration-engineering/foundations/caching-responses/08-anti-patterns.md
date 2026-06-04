# ECC Anti-Patterns — Caching Responses

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 01-foundations |
| **Knowledge Unit** | Caching Responses |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Uniform TTL Across All Endpoints
2. Caching Non-Idempotent POST/PUT/DELETE Responses
3. Missing Cache Stampede Protection
4. Flat Cache Keys Without Service Namespace
5. Passive Expiration Without Webhook-Based Invalidation

---

## Repository-Wide Anti-Patterns

- Premature Caching
- Premature Optimization

---

## Anti-Pattern 1: Uniform TTL Across All Endpoints

### Category
Performance | Architecture

### Description
Applying the same cache TTL to all cached API responses regardless of data volatility. Reference data (countries, currencies) and rapidly changing data (order status, prices) share the same expiration window.

### Why It Happens
Developers configure a single TTL in a central config for simplicity, not distinguishing between data types.

### Warning Signs
- A single `CACHE_TTL` environment variable used everywhere
- No per-endpoint TTL configuration
- Mixed complaints: "data is stale" alongside "cache misses are too frequent"

### Why It Is Harmful
Fast-changing data is served stale for the full TTL window. Static data is evicted and re-fetched unnecessarily, wasting API budget and increasing latency 10-100x.

### Real-World Consequences
Users see outdated prices or inventory. API costs double because static reference data is re-fetched every few minutes.

### Preferred Alternative
Configure TTL per endpoint based on data volatility: 60s for volatile data, 3600s+ for reference data.

### Refactoring Strategy
1. Audit all cached endpoints and classify data freshness requirements
2. Extract TTL to per-endpoint configuration (config file or method)
3. Implement variable TTLs using `Cache::remember($key, $ttl, $callback)`
4. Monitor hit rate per endpoint to validate TTL choices

### Detection Checklist
- [ ] Single TTL constant used across all cache calls
- [ ] No documentation of data freshness SLAs per endpoint
- [ ] Cache hit rate varies wildly between endpoints

### Related Rules
Always Set TTL Based on Data Freshness Requirements (05-rules.md)

### Related Skills
Cache External API Responses to Reduce Latency and Costs (06-skills.md)

### Related Decision Trees
Caching Strategy Selection (07-decision-trees.md)

---

## Anti-Pattern 2: Caching Non-Idempotent POST/PUT/DELETE Responses

### Category
Security | Reliability

### Description
Caching responses from mutating HTTP methods (POST, PUT, DELETE) without idempotency keys. A cache hit replays a write operation, causing duplicate side effects.

### Why It Happens
Developers treat all API responses uniformly, applying caching logic to POST endpoints to "improve performance."

### Warning Signs
- `Cache::remember()` wrapping POST requests
- Cache key derived from request body without idempotency key
- Duplicate order/charge records in production logs

### Why It Is Harmful
Replayed write operations cause duplicate payments, double order processing, data corruption, and accounting errors that are difficult to detect and reverse.

### Real-World Consequences
Stripe charges duplicated for the same customer. Orders created twice with identical line items. Refund requests from angry customers.

### Preferred Alternative
Only cache mutating responses when protected by an idempotency key. Use the idempotency key as the cache key with 24h TTL.

### Refactoring Strategy
1. Identify all POST/PUT/DELETE endpoints with caching
2. Remove caching unless the request carries an idempotency key
3. Implement idempotency key validation before cache lookup
4. Use the idempotency key as the sole cache key for mutating endpoints

### Detection Checklist
- [ ] POST/PUT/DELETE responses cached without idempotency key
- [ ] Cache hit triggers duplicate side effects
- [ ] No deduplication logic before write operations

### Related Rules
Don't Cache POST Responses Without Idempotency (05-rules.md)

### Related Skills
Cache External API Responses to Reduce Latency and Costs (06-skills.md)

### Related Decision Trees
Caching Strategy Selection (07-decision-trees.md)

---

## Anti-Pattern 3: Missing Cache Stampede Protection

### Category
Performance | Scalability

### Description
Using `Cache::remember()` on high-traffic endpoints without lock-based stampede protection. When the cache key expires, all concurrent requests simultaneously fetch from the upstream API.

### Why It Happens
Developers use the simplest caching API (`Cache::remember()`) without considering concurrent access patterns. Stampede is invisible in development where traffic is low.

### Warning Signs
- Spike in upstream API calls coinciding with cache TTL expiry
- `Cache::remember()` used on endpoints with >50 req/s
- Occasional timeout spikes on cache miss

### Why It Is Harmful
N concurrent cache misses cause N upstream calls simultaneously, overwhelming the API, triggering rate limits, increasing latency, and potentially causing cascading timeouts.

### Real-World Consequences
Upstream API throttles your integration after cache expiry spikes. All requests fail for 30-60s until the cache is repopulated. Service degradation during traffic bursts.

### Preferred Alternative
Use `Cache::lock()` for stampede protection: acquire lock → regenerate → release. For very high traffic, implement stale-while-revalidate.

### Refactoring Strategy
1. Identify high-traffic cache keys (>50 req/s)
2. Replace `Cache::remember()` with lock-based pattern
3. Set lock timeout slightly longer than upstream API response time
4. For traffic >500 req/s, implement stale-while-revalidate

### Detection Checklist
- [ ] `Cache::remember()` used on high-traffic endpoints
- [ ] No `Cache::lock()` around cache regeneration
- [ ] Upstream API sees periodic traffic spikes

### Related Rules
Implement Stampede Protection with Cache::lock() (05-rules.md)

### Related Skills
Cache External API Responses to Reduce Latency and Costs (06-skills.md)

### Related Decision Trees
Stampede Protection Strategy (07-decision-trees.md)

---

## Anti-Pattern 4: Flat Cache Keys Without Service Namespace

### Category
Code Organization | Maintainability

### Description
Using simple, non-namespaced cache keys (e.g., `charges`, `users`) without service prefixes. Keys collide between different integrations and cannot be selectively invalidated.

### Why It Happens
Developers start with one integration service and don't anticipate adding more. Key naming feels like unnecessary ceremony early on.

### Warning Signs
- Cache key without service prefix: `Cache::remember('charges', ...)`
- Cache key collisions between different API integrations
- Inability to flush cache for one service without affecting others

### Why It Is Harmful
Cache poisoning between services, debug difficulty, inability to selectively invalidate, and silent data corruption when keys overlap.

### Real-World Consequences
Stripe charges list shows Mailgun email data because both use key `list`. Debugging takes hours. Cache flush for one service clears cached data for all integrations.

### Preferred Alternative
Use structured keys: `api:{service}:{resource}:{params_hash}`.

### Refactoring Strategy
1. Define a cache key builder per service
2. Apply `api:service:resource:hash` format
3. Use cache tags (Redis) or prefix-based invalidation
4. Update all cache read/write calls to use the new key format

### Detection Checklist
- [ ] Cache keys lack service prefix
- [ ] Cache flush affects unintended services
- [ ] Debugging cache behavior requires guessing key origins

### Related Rules
Design Cache Keys with Service Namespace (05-rules.md)

### Related Skills
Cache External API Responses to Reduce Latency and Costs (06-skills.md)

### Related Decision Trees
Cache Store Selection (07-decision-trees.md)

---

## Anti-Pattern 5: Passive Expiration Without Webhook-Based Invalidation

### Category
Architecture | Reliability

### Description
Relying solely on TTL expiry for cache invalidation when the upstream API provides webhook events signaling data changes. Stale data is served for the full TTL window after source data changes.

### Why It Happens
Implementing webhook-based invalidation requires additional infrastructure (webhook endpoints, event listeners). Teams prioritize feature delivery over data freshness.

### Warning Signs
- Cache TTL set to a low value "to ensure freshness" (masking missing invalidation)
- Users complain about stale data even though TTL is short
- Upstream API sends webhooks that are received but not used for cache invalidation

### Why It Is Harmful
Users see stale data for the full TTL duration. Short TTLs increase API call volume, defeating caching's purpose. Hit rate drops significantly.

### Real-World Consequences
Dashboard shows order status "pending" for 5 minutes after payment succeeds because cache TTL is 300s. Support tickets spike after every data change.

### Preferred Alternative
Listen to webhook events and invalidate affected cache entries immediately. Use TTL as a safety net, not the primary invalidation mechanism.

### Refactoring Strategy
1. Identify upstream webhook events that signal data changes
2. Register event listeners that invalidate related cache keys
3. Use cache tags or prefix-based flush for bulk invalidation
4. Keep TTL as a fallback for missed webhook events

### Detection Checklist
- [ ] Upstream provides webhooks but cache invalidation is TTL-only
- [ ] Cache invalidation is not connected to webhook event handlers
- [ ] TTL is set artificially low because of missing invalidation

### Related Rules
Use Cache Invalidation via Webhook Events (05-rules.md)

### Related Skills
Cache External API Responses to Reduce Latency and Costs (06-skills.md)

### Related Decision Trees
Cache Invalidation Approach (07-decision-trees.md)
