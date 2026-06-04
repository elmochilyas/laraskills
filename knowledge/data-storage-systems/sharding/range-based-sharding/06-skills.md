# Skill: Implement Range-Based Sharding

## Purpose

Distribute data across shards using contiguous key ranges, enabling efficient range scans and predictable shard assignment.

## When To Use

- Range queries on the shard key are frequent (date ranges, ID ranges)
- Predictable shard assignment is needed (know which shard has which range)
- Hot ranges can be split manually

## When NOT To Use

- Shard key values are not naturally ordered
- Range distribution is unpredictable (data grows unevenly across ranges)
- Even distribution is more important than range efficiency

## Prerequisites

- Shard key with natural ordering (ID, date, timestamp)
- Range definition per shard
- Monitoring for hot ranges

## Inputs

- Shard key value
- Range-to-shard mapping (config or database)
- Range splitting strategy

## Workflow (numbered steps)

1. Define contiguous key ranges per shard:
   - Shard 1: user_id 1-1,000,000
   - Shard 2: user_id 1,000,001-2,000,000
   - Shard 3: user_id 2,000,001-3,000,000
2. Implement range lookup: given key value, find containing shard
3. Route queries:
   - `WHERE id BETWEEN 500 AND 600` → single shard
   - `WHERE id > 5,000,000` → may scan multiple shards
4. Monitor range utilization: if one range fills faster than others, split it
5. Split hot range: divide into two sub-ranges, migrate data to new shard

## Validation Checklist

- [ ] Ranges cover all possible key values (no gaps)
- [ ] Range queries with shard key hit correct shard
- [ ] Hot range detection and splitting tested
- [ ] Range-to-shard mapping is fast (< 1ms lookup)

## Common Failures

- Monotonically increasing key: last range is hot (all new writes)
- Uneven ranges: one shard has 80% of data
- Range lookup becomes slow with many ranges (use sorted data structure)

## Decision Points

- Fixed ranges vs dynamic ranges (auto-split)
- Range definition: config file vs database vs sorted map

## Performance Considerations

- Range scan within one shard: efficient (sequential read)
- Range scan across multiple shards: fan-out
- Hot last range: common with auto-increment keys (use hash-based or pre-split)

## Security Considerations

- Range definitions may reveal data volume per range
- Range splits must not expose data during migration

## Related Rules

- 6-3-1: Always Monitor Range Utilization
- 6-3-2: Never Allow Unbounded Range Growth

## Related Skills

- Select a Shard Key
- Implement Shard Splitting
- Implement Shard Rebalancing

## Success Criteria

- Range queries with shard key hit exactly one shard
- Data distribution across ranges is monitored and managed
- Hot ranges are detected and split before affecting performance

---

# Skill: Split a Hot Range

## Purpose

Divide an overfull range into smaller sub-ranges and distribute across shards to eliminate hot spots.

## When To Use

- A specific key range has disproportionate data or traffic
- Range utilization exceeds 80% of expected capacity
- Write-heavy tail range from monotonically increasing keys

## When NOT To Use

- Hash-based sharding (no ranges to split)
- Hot range is temporary (seasonal spike)
- Better to rebalance shards than split ranges

## Prerequisites

- Range monitoring showing hot shard
- New shard available for receiving split data
- Migration script for moving range data

## Inputs

- Hot range definition (start, end)
- Split point(s)
- New shard assignment

## Workflow (numbered steps)

1. Identify hot range from monitoring (high utilization, high query count)
2. Determine split point: divide the range at a key value that balances data
3. Provision new shard (if needed)
4. Update range-to-shard mapping with new sub-ranges
5. Migrate data for one sub-range to new shard
6. Route new queries using updated mapping
7. Verify data consistency on both shards post-split

## Validation Checklist

- [ ] Hot range identified and split point determined
- [ ] Data migration completes without data loss
- [ ] Both resulting ranges have balanced data/traffic
- [ ] Queries route correctly after split

## Common Failures

- Split point chosen poorly — one new range still hot
- Data migration slow — prolonged inconsistency window
- Queries using old range mapping route to wrong shard

## Decision Points

- 50/50 split vs proportional split based on data volume
- Offline migration vs live migration via replication

## Performance Considerations

- Split time proportional to data volume in the range
- Live migration reduces downtime but adds complexity
- Test split with production-like data volume before executing

## Security Considerations

- Data migration must maintain encryption
- Monitor for data access during migration window

## Related Rules

- 6-3-1: Always Monitor Range Utilization

## Related Skills

- Implement Range-Based Sharding
- Implement Shard Rebalancing
- Implement Shard Splitting

## Success Criteria

- Hot range split completes within acceptable timeframe
- Both resulting ranges have balanced utilization
- Zero data loss during split
- Query routing works correctly immediately after split
