# Skill: Implement Shard Rebalancing

## Purpose

Redistribute data across shards when data distribution becomes uneven, adding or removing shards while minimizing downtime and data movement.

## When To Use

- Data distribution across shards is uneven (one shard has 2× the data of others)
- Adding new shards to increase capacity
- Removing shards (decommissioning)
- After significant data growth or shrink

## When NOT To Use

- Even distribution is maintained (±20% of average)
- Shard count is fixed and no capacity changes needed
- Data movement cost exceeds benefit of rebalancing

## Prerequisites

- Shard rebalancing strategy (consistent hashing, virtual buckets, directory-based)
- Data migration mechanism
- Monitoring showing current distribution

## Inputs

- Current shard data distribution
- Target shard distribution
- Rebalancing plan (which keys move where)

## Workflow (numbered steps)

1. Assess current distribution: measure data volume, throughput per shard
2. Determine new shard layout: add shards, define new mapping
3. For hash-based: update hash ring, move affected keys
4. For directory-based: update shard map, move keys
5. For range-based: split ranges, move data
6. Implement data migration: read from old shard, write to new shard, verify
7. Switch reads to new shard after migration completes
8. Monitor rebalancing progress and impact on production traffic

## Validation Checklist

- [ ] Target distribution achieves even balance
- [ ] Data migration completes without data loss
- [ ] Read traffic switches to new shard correctly
- [ ] Rebalancing causes minimal performance impact
- [ ] Old shard data cleaned up after migration

## Common Failures

- Migration causes high load on source shard (throttle migration rate)
- Read switch happens before data is fully migrated (incomplete reads)
- New shard not ready — migration fails
- Rebalancing takes too long — data distribution changes during migration

## Decision Points

- Offline vs live rebalancing
- Throttle migration rate vs speed of completion
- Full rebalance vs incremental (move hottest keys first)

## Performance Considerations

- Migration rate: balance between speed and production impact
- Live rebalancing: higher complexity, lower downtime
- Verify data: checksum comparison between old and new shard

## Security Considerations

- Data in transit during migration must be encrypted
- Access to new shard must be configured before migration

## Related Rules

- 6-10-1: Always Verify Data After Migration
- 6-10-2: Never Switch Reads Before Data Migration Completes

## Related Skills

- Implement Consistent Hashing
- Implement Shard Splitting
- Implement Global Tables

## Success Criteria

- Data distribution within ±10% of uniform after rebalance
- Zero data loss during migration
- Application performance impact within acceptable threshold

---

# Skill: Implement Virtual Bucket Rebalancing

## Purpose

Use virtual buckets to simplify shard rebalancing by mapping many buckets to physical shards and moving only bucket assignments during rebalance.

## When To Use

- Large number of shards (10+)
- Frequent rebalancing expected
- Need to minimize data movement during rebalance
- Fine-grained control over data placement

## When NOT To Use

- Small number of shards (< 4)
- Rebalancing is rare
- Simpler consistent hashing approach is sufficient

## Prerequisites

- Virtual bucket count determined (e.g., 4096)
- Bucket-to-shard mapping table
- Data migration mechanism

## Inputs

- Number of virtual buckets (power of 2, e.g., 4096 or 65536)
- Current bucket-to-shard mapping
- Target bucket-to-shard mapping

## Workflow (numbered steps)

1. Define virtual bucket count: e.g., 4096 buckets
2. Map each key to a bucket: `bucket = hash(key) % 4096`
3. Map each bucket to a physical shard: `bucket_map[bucket] = shard_id`
4. To rebalance: update bucket-to-shard mapping for a subset of buckets
5. Migrate data for moved buckets from old shard to new shard
6. Data to move = keys where bucket mapping changed
7. Update bucket_map after migration completes

## Validation Checklist

- [ ] Keys map to same bucket consistently
- [ ] Rebalance moves expected proportion of data
- [ ] Bucket map update doesn't affect in-flight queries
- [ ] Data migration for moved buckets completes successfully

## Common Failures

- Too few buckets — large data movement per bucket change
- Bucket map not cached — lookup overhead on every query
- Keys distributed unevenly across buckets (hot bucket)

## Decision Points

- Bucket count: more buckets = finer granularity = more mapping entries
- Bucket-to-shard mapping storage: config vs database vs Redis

## Performance Considerations

- Mapping storage: 4096 × small entry = negligible
- Bucket lookup: hash + array index = nanoseconds
- Data movement: proportional to buckets moved × data per bucket

## Security Considerations

- Bucket mapping updates must be authenticated
- Migration data in transit must be encrypted

## Related Rules

- 6-10-1: Always Verify Data After Migration

## Related Skills

- Implement Shard Rebalancing
- Implement Consistent Hashing
- Implement Shard Mapping Routing

## Success Criteria

- Virtual buckets distribute keys evenly across shards
- Rebalance moves only required proportion of data
- Bucket mapping operations are fast and reliable
