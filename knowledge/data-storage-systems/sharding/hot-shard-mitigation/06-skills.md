# Skill: Detect and Mitigate Hot Shards

## Purpose

Identify shards with disproportionate load and apply mitigation strategies (splitting, rebalancing, caching, rate limiting) to prevent performance degradation.

## When To Use

- Monitoring shows uneven distribution across shards
- One shard has significantly higher CPU, IOPS, or query count
- Write-heavy workload concentrates on specific key ranges
- User reports of slow performance for data on specific shards

## When NOT To Use

- Even distribution across shards is maintained
- All shards have similar utilization
- Hot shard is temporary (seasonal spike)

## Prerequisites

- Per-shard monitoring (CPU, IOPS, query count, latency)
- Ability to move data between shards
- Understanding of hot shard root cause

## Inputs

- Per-shard utilization metrics
- Query log for the hot shard
- Data distribution analysis

## Workflow (numbered steps)

1. Identify hot shard from monitoring (CPU, IOPS, connections, latency deviating from others)
2. Diagnose root cause:
   - Popular key (celebrity user, viral content) → cache or split
   - Poor shard key choice (date, status) → re-shard or redesign
   - Uneven data distribution → rebalance
   - Application pattern (all writes to one user/region) → fix application
3. Apply mitigation:
   - Cache-heavy reads for popular keys
   - Split hot shard into two
   - Rebalance keys across more shards
   - Rate-limit abusive patterns
4. Verify mitigation reduces hot shard utilization
5. Monitor for secondary hot shards after mitigation

## Validation Checklist

- [ ] Hot shard identified and root cause determined
- [ ] Mitigation applied and verified
- [ ] No secondary hot shard created
- [ ] Long-term fix identified (shard key redesign, caching, etc.)

## Common Failures

- Treating symptom (high CPU) without fixing root cause (bad shard key)
- Mitigation moves hot spot to another shard (not eliminated)
- Cache warms up slowly — hot shard persists until cache populated

## Decision Points

- Immediate mitigation (cache, rate limit) vs long-term fix (re-shard)
- Split hot shard vs rebalance across all shards
- Automatic vs manual mitigation

## Performance Considerations

- Caching: immediate relief for read-hot shards
- Splitting: divides load, requires data migration
- Rate limiting: protects shard but degrades UX for affected users

## Security Considerations

- Hot shard mitigation should not expose data
- Rate limiting should be fair (not block legitimate traffic)

## Related Rules

- 6-24-1: Always Monitor For Hot Shards
- 6-24-2: Never Ignore Hot Shard Patterns

## Related Skills

- Implement Shard Splitting
- Implement Shard Rebalancing
- Implement Consistent Hashing

## Success Criteria

- Hot shard utilization returns to within ±20% of average
- Root cause identified and addressed
- No data loss during mitigation
- Monitoring confirms mitigation effectiveness

---

# Skill: Implement Caching for Hot Shard Relief

## Purpose

Use application-level or database-level caching to reduce read load on hot shards and improve response times.

## When To Use

- Hot shard is read-heavy (popular keys)
- Cache can serve majority of read requests
- Stale data is acceptable for cached queries
- Write volume alone is not the cause of hot shard

## When NOT To Use

- Hot shard is write-heavy (cache doesn't help writes)
- Data must always be fresh (no stale cache)
- Cache infrastructure is not available

## Prerequisites

- Cache driver (Redis, Memcached)
- Understanding of hot shard read patterns
- Cache invalidation strategy

## Inputs

- Hot shard key patterns
- Read-to-write ratio for hot keys
- Acceptable staleness window

## Workflow (numbered steps)

1. Identify hot keys on the shard (frequently read, rarely updated)
2. Implement cache for those keys:
   - `Cache::remember("user:{$userId}:profile", 3600, fn() => DB::connection('shard_'.$shardId)->select(...))`
   - TTL based on acceptable staleness
3. Implement cache invalidation: on update, clear cached value
4. For write-hot keys, consider rate limiting or splitting instead of caching
5. Monitor cache hit ratio for hot keys
6. Reduce if cache hit ratio is low (data changes too frequently)

## Validation Checklist

- [ ] Hot keys identified and cached
- [ ] Cache hit ratio > 90% for hot keys
- [ ] Cache invalidation works on update
- [ ] Hot shard read load reduced

## Common Failures

- Caching data that changes frequently — low hit ratio
- Cache stampede on expiry — all requests hit database simultaneously
- Stale data served after update (cache not invalidated)

## Decision Points

- Cache TTL: longer = higher hit rate, more stale data
- Invalidation: write-through vs TTL-based
- Local vs shared cache

## Performance Considerations

- Cache hit: < 1ms vs DB query: 5-50ms
- Cache miss + DB query: slower than DB alone (cache overhead)
- Cache invalidation: adds write overhead

## Security Considerations

- Cached data may contain sensitive information
- Cache must be scoped per tenant if multi-tenant

## Related Rules

- 6-24-1: Always Monitor For Hot Shards

## Related Skills

- Detect and Mitigate Hot Shards
- Implement Shard-Aware Caching
- Implement Fan-Out Queries

## Success Criteria

- Hot shard read load reduced by > 50%
- Cache hit ratio > 90% for hot keys
- No stale data served beyond acceptable window
