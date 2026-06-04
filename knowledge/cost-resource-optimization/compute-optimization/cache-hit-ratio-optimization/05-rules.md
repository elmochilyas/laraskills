## Measure Cache Hit Ratio Per Key Pattern
---
## Monitoring
---
Always measure CHR per endpoint or data type, not as an aggregate number.
---
Different data has different cacheability; aggregate 95% hides that user profiles have 80% CHR while blog posts have 99%. Fixing the lowest-CHR pattern has the highest impact.
---
Track CHR: /api/posts=99%, /api/users=80%. Optimize user endpoint caching.
---
Monitoring only aggregate cache hit ratio across all Redis usage.
---
No common exceptions; pattern-level CHR is always more actionable than aggregate.
---
Lowest-CHR data type silently degrades performance, fix applied to wrong data pattern.
---
## Implement Multi-Level Caching
---
## Performance
---
Always implement multi-level caching (memo driver + Redis) for frequently accessed data.
---
L1 (memo) eliminates Redis network round-trip, reducing Redis load by 50-80%; total cache infrastructure cost goes down because Redis node can be smaller.
---
Laravel config: cache.default=memo, cache.redis.connection=default. Hot data in memo, warm data in Redis.
---
Single Redis cache for all data; every cache hit incurs network round-trip.
---
Data cached for <1 second where memo overhead is unnecessary.
---
Redundant Redis load, larger Redis node needed, 100-500us added latency per cache hit.
---
## Set TTL Based on Access Frequency
---
## Architecture
---
Always match cache TTL to data access frequency; frequently accessed data gets longer TTL, rarely accessed data gets shorter TTL or no caching.
---
Storing rarely accessed data wastes memory and evicts frequently accessed data (working set); matching TTL to access frequency maximizes effective cache capacity.
---
Popular blog posts: TTL=24h. User meta: TTL=1h. Rarely accessed reports: no cache.
---
All cache entries with identical 5-minute TTL.
---
Data with uniform access patterns; rare in practice.
---
Low effective cache utilization, working set eviction, low CHR.
---
## Warm Cache After Deploy
---
## Performance
---
Always implement post-deploy cache warming for the top 100 most-accessed cache keys.
---
Cold deploy drops CHR from 99% to 0% for 5-30 minutes; warming restores CHR in 1-2 minutes, preventing database load spike and latency degradation.
---
Post-deploy script: retrieve top-100 query results and re-cache them.
---
Deploy with `Cache::flush()` and no warming — database handles 100% of traffic for 30 minutes.
---
Blue-green deployments where cache persists across deploys.
---
5-30 minutes of degraded performance after every deploy, database load spike.
---
## Monitor Cache Eviction Rate
---
## Monitoring
---
Always monitor Redis `evicted_keys` metric; set an alarm if it exceeds 0.
---
Evictions indicate working set exceeds allocated memory; useful data being removed to make space for even more useful data — but the eviction itself causes a cache miss and database query.
---
CloudWatch alarm: Redis evicted_keys > 0 for 5 minutes triggers investigation.
---
Redis running at maxmemory with constant evictions and no monitoring.
---
Working set always <80% of maxmemory (evictions shouldn't happen).
---
Low CHR from constant evictions, database load spikes, unclear path to resolution.
---
## Use Sticky Cache Key Prefixes
---
## Architecture
---
Always use versioned cache key prefixes for seamless invalidation without flush.
---
New deploy increments prefix; old cache is naturally garbage collected; no CHR drop because new keys fill gradually instead of all-at-once flush.
---
Cache key: `v2:users:1`, `v3:users:1` after deploy. Old keys expire via TTL.
---
`Cache::flush()` on every deploy, dropping CHR from 99% to 0%.
---
Cache is empty between deploys (dev/staging); production deploys should never flush.
---
5-30 minutes of degraded performance after every deploy.
---
## Right-Size Redis Based on Working Set
---
## Cost Optimization
---
Always size Redis cache nodes based on working set size + 20% headroom, not total available data.
---
Total data may be 10GB but only 2GB is accessed frequently; provisioning Redis for 10GB wastes 80% of cache cost. Right-sizing based on working set matches cost to actual need.
---
Monitoring: working set = 1.5GB. Provisioned: cache.r7g.large (3.5GB, $95/month).
---
Provisioning Redis for 10GB because total database is 10GB.
---
Working set is not measurable yet (new application); revisit after 2 weeks of traffic.
---
2-5x larger Redis node than necessary, hundreds in unnecessary monthly cost.
