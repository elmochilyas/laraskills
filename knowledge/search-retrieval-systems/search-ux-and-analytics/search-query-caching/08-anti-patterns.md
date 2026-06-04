# ECC Anti-Patterns — Search Query Caching
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Search UX and Analytics | Knowledge Unit | Search Query Caching | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. No Cache Key Normalization
2. Caching Personalized Search Results Without User-Specific Keys
3. Using Time-Based Expiry Without Tag-Based Invalidation
4. Caching Too Long or Too Short TTLs
5. Caching Without Hit Ratio Monitoring
---
## Repository-Wide Anti-Patterns
- Caching search results but not cache for autocomplete/instant search
- Not invalidating cache when indexed data changes
- Using file cache instead of Redis for distributed search caching
---
## Anti-Pattern 1: No Cache Key Normalization
### Category
Performance | Data Quality
### Description
Using raw query strings as cache keys without normalization, resulting in cache misses for semantically identical queries that differ in whitespace, case, or parameter order.
### Why It Happens
Cache key is derived directly from request input without preprocessing.
### Warning Signs
- Same search with different casing misses cache
- "Laptop", "laptop ", "LAPTOP" all different cache entries
- Filter parameter order changes cache key
- Cache hit ratio lower than expected given query repetition
### Why Harmful
Each variation of the same query requires a separate search engine request. Cache misses from normalization issues reduce the effective cache hit ratio and waste resources on redundant queries.
### Consequences
- Lower cache hit ratio than achievable
- Higher search engine load than necessary
- Inconsistent caching behavior across request variations
- Hard to debug cache misses
### Alternative
Normalize cache keys: lowercase, trim whitespace, sort filter parameters, strip trailing slashes.
### Refactoring Strategy
1. Create cache key normalization function
2. Apply to query text: lowercase, trim, collapse whitespace
3. Sort filter/parameter keys alphabetically
4. Append normalized parameters to key
5. Use MD5 hash of normalized key for consistent length
### Detection Checklist
- [ ] Cache keys normalized (lowercase, trimmed)
- [ ] Filter parameters sorted in cache key
- [ ] Normalization verified with equivalent queries
- [ ] Cache hit ratio improved after normalization
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 2: Caching Personalized Search Results Without User-Specific Keys
### Category
Data Quality | Security
### Description
Caching personalized search results (user-specific rankings, preferences) with a generic cache key, serving one user's results to another.
### Why It Happens
Developers add caching to the search layer without considering whether results are user-specific.
### Warning Signs
- Users see other users' personalized results
- Personalization features don't work with caching enabled
- Cache key doesn't include user ID
- One cache entry serves all users
### Why Harmful
Serving wrong user's personalized results is a data leak and a terrible user experience. Users see results tailored for someone else, potentially exposing sensitive or irrelevant content.
### Consequences
- User data exposure (what another user searched for)
- Personalization features broken by caching
- Inconsistent experience: personalized then generic
- Trust and privacy violation
### Alternative
Include user ID in cache key for personalized search, or don't cache personalized results.
### Refactoring Strategy
1. Identify personalized vs non-personalized queries
2. For personalized queries: include user_id in cache key
3. For highly personalized: consider no caching or very short TTL
4. Mark personalized cache entries with user-specific tags
5. Test: verify different users get correct personalized results
### Detection Checklist
- [ ] Personalized queries include user ID in cache key
- [ ] Different users get different cached results for same query
- [ ] No user data leakage through caching
- [ ] Personalization works correctly with caching
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 3: Using Time-Based Expiry Without Tag-Based Invalidation
### Category
Performance | Data Quality
### Description
Relying solely on TTL-based cache expiration without invalidating cache when underlying data changes, serving stale results until TTL expires.
### Why It Happens
TTL-based caching is simple to implement. Tag-based invalidation requires additional infrastructure.
### Warning Signs
- New/updated records not appearing in search for entire TTL period
- Cache entries stale for minutes after data changes
- "I updated this product, why is the old one still showing in search?"
- No cache invalidation logic on model save/delete
### Why Harmful
TTL-only caching guarantees stale data for up to the TTL duration. For frequently changing data, this means search is always behind reality. Users see outdated inventory, prices, or statuses.
### Consequences
- Stale search results for minutes at a time
- Users frustrated by outdated information
- E-commerce: wrong prices, out-of-stock items shown
- Trust in search accuracy eroded
### Alternative
Use tag-based cache invalidation: tag cache entries by model/index, invalidate tags when data changes.
### Refactoring Strategy
1. Assign cache tags per model: Cache::tags(['search.products'])
2. Store all search cache entries with relevant tags
3. Add cache invalidation on model saved/deleted events
4. Use Model observers or event listeners for invalidation
5. Keep TTL as safety net for tag misses
### Detection Checklist
- [ ] Cache tags implemented for search entries
- [ ] Model save/delete triggers cache invalidation
- [ ] Stale data appears for < 1 second after invalidation
- [ ] TTL retained as backup invalidation
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 4: Caching Too Long or Too Short TTLs
### Category
Performance | Data Quality
### Description
Setting cache TTL arbitrarily without considering data freshness requirements and cache hit ratio, resulting in stale data or ineffective caching.
### Why It Happens
TTL values are chosen without analysis. Common defaults (300s, 3600s) are used regardless of use case.
### Warning Signs
- TTL set to 1 hour for inventory search (results always stale)
- TTL set to 10 seconds for product catalog (rarely changes)
- Cache hit ratio very low due to short TTL
- Data freshness complaints from short-TTL cache
### Why Harmful
Too-long TTL serves stale data. Too-short TTL defeats the purpose of caching. Wrong TTL either degrades user experience or wastes the caching benefit.
### Consequences
- Data freshness vs performance tradeoff suboptimal
- Cache overhead without benefit (too short)
- User trust issues from stale data (too long)
- Extra infrastructure cost for cache without value
### Alternative
Set TTL based on data change frequency and freshness requirements. Monitor and adjust.
### Refactoring Strategy
1. Analyze data change frequency per model
2. For frequently changing data (inventory): 30-60s TTL
3. For stable data (categories, brands): 300-600s TTL
4. Use tag-based invalidation for immediate freshness
5. Monitor cache hit ratio and TTL effectiveness
6. Adjust TTL based on data freshness vs hit ratio tradeoff
### Detection Checklist
- [ ] TTL values based on data change analysis
- [ ] Different TTLs for different content types
- [ ] Cache hit ratio monitored per content type
- [ ] Freshness requirements met
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 5: Caching Without Hit Ratio Monitoring
### Category
Operations | Performance
### Description
Implementing search caching without monitoring cache hit ratio, operating blind to whether caching is effective.
### Why It Happens
Caching is implemented as a performance improvement. Monitoring the improvement is treated as a separate task.
### Warning Signs
- Cache hit ratio unknown
- No dashboard for cache metrics
- Cannot answer "is caching improving performance?"
- Cache may be ineffective or even harmful
### Why Harmful
Without hit ratio monitoring, you don't know if caching is working. A low hit ratio means caching adds overhead (cache check, serialization, storage) without providing benefit. In worst case, it slows things down.
### Consequences
- Cache infrastructure cost without verified benefit
- Serialization/deserialization overhead for low-hit cache
- Inability to optimize caching strategy
- False sense of performance security
### Alternative
Monitor cache hit ratio, memory usage, and average latency improvement from caching.
### Refactoring Strategy
1. Add cache hit/miss counters to search service
2. Calculate hit ratio = hits / (hits + misses)
3. Track cache size and memory usage
4. Dashboard: hit ratio, cache size, TTL distribution
5. Set target hit ratio (>50% for search workloads)
6. Alert on significant hit ratio drops
### Detection Checklist
- [ ] Cache hit ratio monitored
- [ ] Target hit ratio defined (>50%)
- [ ] Cache memory usage tracked
- [ ] Hit ratio trends visible in dashboard
- [ ] Degradation alerts configured
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
- Decision: Relevance Tuning Strategy
