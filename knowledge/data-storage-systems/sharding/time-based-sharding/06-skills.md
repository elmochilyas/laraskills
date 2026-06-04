# Skill: Implement Time-Based Sharding

## Purpose

Shard data by time intervals (day, month, quarter) to enable efficient time-range queries, data archival, and retention management.

## When To Use

- Time-series data (logs, events, metrics, sensor data)
- Queries are primarily time-range-based
- Data retention policies require deleting old shards
- Write pattern is append-mostly with time ordering

## When NOT To Use

- Data is not time-ordered or time-queried
- Retention/deletion is not a requirement
- Access patterns are random (not time-based)
- Hot latest shard: all writes go to current time shard

## Prerequisites

- Timestamp or date column in data
- Time interval selection (hourly, daily, monthly)
- Shard creation schedule

## Inputs

- Time interval for sharding
- Retention period
- Query time ranges

## Workflow (numbered steps)

1. Choose time interval: daily (365 shards/year), monthly (12/year), quarterly (4/year)
2. Define shard naming convention: `shard_orders_2024_01` (year_month)
3. On write, determine shard based on `created_at` or event timestamp
4. Create shard proactively: pre-create future shards (e.g., next 6 months)
5. Query routing: determine which shards to query based on query time range
6. Retention: drop old shards by removing them from the ring (data deleted)
7. For range queries spanning multiple intervals, fan-out across shards

## Validation Checklist

- [ ] Data routes to correct time-based shard
- [ ] Range queries within one interval hit one shard
- [ ] Pre-created shards available before needed
- [ ] Retention policy drops old shards correctly

## Common Failures

- Hot latest shard: all writes go to current time shard
- Pre-creation not set up — no shard for current time
- Query spanning many intervals — slow fan-out

## Decision Points

- Interval size: daily (more shards, less data per shard) vs monthly (fewer shards, more data)
- Pre-creation window: how many future shards to create

## Performance Considerations

- Current shard is write hot — may need splitting if write volume high
- Range queries within one shard: efficient
- Range queries across many shards: fan-out overhead

## Security Considerations

- Time-based shards may reveal data velocity
- Dropping old shards must respect data retention requirements

## Related Rules

- 6-21-1: Always Pre-Create Future Shards
- 6-21-2: Never Delete Shards Before Retention Period Expires

## Related Skills

- Implement Range-Based Sharding
- Implement Hot Shard Mitigation
- Implement Data Retention Partitioning

## Success Criteria

- Time-range queries within one shard hit exactly one shard
- Pre-created shards are available before needed
- Retention drops are clean and on schedule
- Hot latest shard is monitored and mitigated if needed

---

# Skill: Combine Time-Based Sharding with Hash Sharding

## Purpose

Use composite sharding where data is first partitioned by time (for retention/lifecycle) and then by hash (for even distribution within time window).

## When To Use

- Time-series data that also needs even distribution
- Write volume to current time period exceeds single shard capacity
- Need both lifecycle management and distribution

## When NOT To Use

- Time-based or hash-based alone is sufficient
- Composite approach adds too much complexity
- Write volume to current window fits in one shard

## Prerequisites

- Time-based sharding implemented
- Hash-based sharding implemented
- Two-level routing logic

## Inputs

- Time interval configuration
- Hash shard count per time interval
- Composite routing logic

## Workflow (numbered steps)

1. First level: time shard — determine time interval (e.g., `shard_2024_01`)
2. Second level: hash shard — within the time interval, use hash-based distribution (e.g., `hash(user_id) % 4`)
3. Routing: `$shard = "orders_{$year}_{$month}_".(crc32($userId) % 4)`
4. For time-based queries: identify which time shards to query, then query all hash shards within each
5. For point queries (specific user + time): route to single shard
6. Lifecycle: drop entire time interval by dropping all its hash shards

## Validation Checklist

- [ ] Composite routing correct for both time and hash
- [ ] Point queries hit single shard
- [ ] Time-range queries fan-out across hash shards within range
- [ ] Retention drops complete time intervals

## Common Failures

- Hash shard count per time interval varies — uneven distribution
- Query optimizer doesn't understand composite routing
- Retention drops only some hash shards (not complete time interval)

## Decision Points

- Number of hash shards per time interval
- Time interval size for first-level partitioning

## Performance Considerations

- Point query: single shard (efficient)
- Time-range query: fan-out within time window (controlled)
- Full retention drop: drop all hash shards for the interval

## Security Considerations

- Composite routing should not be guessable from external input

## Related Rules

- 6-21-1: Always Pre-Create Future Shards

## Related Skills

- Implement Time-Based Sharding
- Implement Hash-Based Sharding
- Implement Composite Partitioning

## Success Criteria

- Point queries with time + user_id hit exactly one shard
- Write distribution within current time window is even
- Retention drops complete time intervals cleanly
