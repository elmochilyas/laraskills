# Skill: Implement Query Caching Strategies

## Purpose
Cache database query results using `Cache::remember()`, tagged cache, and materialized views to reduce database load and response latency.

## When To Use
- For read-heavy, low-write query patterns
- For expensive aggregations queried frequently
- For dashboard data that can tolerate staleness

## When NOT To Use
- For real-time data requiring fresh reads every request
- For user-specific data (cache key explosion)
- For write-heavy data where invalidation is frequent

## Prerequisites
- Understanding of cache TTL and invalidation
- Knowledge of Laravel cache tags and drivers

## Inputs
- Expensive query that is read frequently, written infrequently

## Workflow
1. Identify read-heavy, write-light queries
2. Measure current execution time and frequency
3. Choose cache strategy:
   - Simple TTL: `Cache::remember('key', 3600, fn() => ...)`
   - Tagged cache: `Cache::tags(['posts'])->remember('active', 3600, ...)`
   - Materialized view: for complex server-side aggregations
   - Stale-while-revalidate: for hot keys with stampede risk
4. Implement invalidation on data changes (model events for tagged cache)
5. Verify cache hit ratio and response time improvement

## Validation Checklist
- [ ] Cache strategy matches access pattern (TTL vs tags vs materialized view)
- [ ] Cache invalidation on data mutation (model events or manual flush)
- [ ] Cache hit ratio >80% for cached queries
- [ ] No cache stampede risk mitigated
- [ ] Arrays/DTOs cached instead of Eloquent models (better serialization)

## Common Failures
- Caching Eloquent models with loaded relationships — stale relationship data
- No cache invalidation strategy — stale data displayed for hours
- Cache stampede — concurrent requests all rebuild on expiration
- Caching paginated results incorrectly — serializing paginator destroys pagination

## Decision Points
- Infrequent changes (<hourly): simple TTL cache
- Frequent changes but group invalidation: tagged cache
- Complex aggregation: materialized view
- Hot cache key: stale-while-revalidate pattern

## Performance
- Cache hit: 0.1-1ms (Redis) vs 1-100ms (database query)
- Cache miss + rebuild: original query time + cache write overhead
- Materialized view refresh: query-time cost deferred to refresh schedule

## Security
- Cache poisoning: validate cached data before serving
- User-specific data: use user-prefixed cache keys
- Cache keys must not expose sensitive information

## Related Rules
- 4-29-1: Always EXPLAIN Before Optimizing
- 4-29-4: Review And Apply Core Concepts

## Related Skills
- Use Laravel Profiling Tools
- Apply Production Optimization Workflow

## Success Criteria
- Cache hit ratio above 80% for cached queries
- Response time significantly reduced for cached endpoints
- Proper invalidation prevents stale data
- No cache stampede incidents
