# Skill: Implement Adding New Shards

## Purpose

Add new shards to an existing sharded database system, redistributing data to maintain even distribution and accommodate growth.

## When To Use

- Existing shards approaching capacity limits
- Data growth projections require more shards
- Throughput exceeds current shard capacity
- Adding shards for geographic distribution

## When NOT To Use

- Current shards have sufficient capacity
- Rebalancing within existing shards is sufficient
- Shard splitting is more appropriate than adding new shards

## Prerequisites

- New shard infrastructure provisioned
- Sharding strategy that supports dynamic shard addition (consistent hashing, virtual buckets, directory)
- Data migration mechanism

## Inputs

- Number of new shards to add
- Data redistribution plan
- New shard infrastructure

## Workflow (numbered steps)

1. Provision new shard infrastructure (database server, storage, network)
2. Configure new shard connection in application config
3. For consistent hashing: add shard to ring, redistribute 1/N of keys
4. For virtual buckets: update bucket-to-shard mapping, move affected bucket data
5. For directory-based: add new shard to available pool, move keys as needed
6. Migrate data from existing shards to new shard
7. Verify data integrity on new shard
8. Update monitoring and alerting for new shard

## Validation Checklist

- [ ] New shard infrastructure provisioned and tested
- [ ] Data migration completes without data loss
- [ ] Data distribution is even after adding new shard
- [ ] Routing updated to include new shard
- [ ] Monitoring configured for new shard

## Common Failures

- New shard not added to routing — never receives traffic
- Data migration too slow — imbalance persists
- New shard capacity too small — quickly becomes overloaded
- Routing update race condition — queries sent to unready shard

## Decision Points

- Pre-splitting (create empty shards) vs reactive (add when needed)
- Number of shards to add at once (1 vs N)

## Performance Considerations

- Data migration volume proportional to old shards / new shards
- Migration impact on production: throttle rate
- New shard should have enough capacity for projected growth

## Security Considerations

- New shard must have same security controls as existing shards
- Data in transit during migration must be encrypted

## Related Rules

- 6-12-1: Always Verify New Shard Before Routing Traffic
- 6-12-2: Never Add Shard Without Monitoring

## Related Skills

- Implement Shard Rebalancing
- Implement Shard Splitting
- Implement Consistent Hashing

## Success Criteria

- New shard added without downtime or data loss
- Data distribution returns to even within acceptable timeframe
- New shard handles its share of traffic correctly

---

# Skill: Plan Shard Capacity Growth

## Purpose

Project future shard capacity needs and plan the addition of new shards before existing shards reach critical utilization.

## When To Use

- Capacity planning for sharded database
- Growth projections indicate future shard needs
- Budgeting for infrastructure expansion

## When NOT To Use

- Flat or declining data volume
- Shard capacity far exceeds projected growth
- Infrastructure scales automatically (cloud auto-scaling)

## Prerequisites

- Current shard utilization data
- Growth rate projections (monthly data volume increase)
- Understanding of shard capacity limits (storage, throughput)

## Inputs

- Current per-shard utilization
- Monthly growth rate
- Maximum capacity per shard
- Projection timeframe (6-12 months)

## Workflow (numbered steps)

1. Measure current per-shard utilization: storage, CPU, IOPS, connections
2. Calculate growth rate from historical data (last 6 months)
3. Project utilization at current growth rate for next 6-12 months
4. Identify when utilization will exceed capacity thresholds (80% warning, 90% critical)
5. Determine number of new shards needed and timing
6. Plan shard addition schedule before any shard reaches critical threshold
7. Budget for new shard infrastructure

## Validation Checklist

- [ ] Current utilization measured accurately
- [ ] Growth rate calculated from historical data
- [ ] Projections show when new shards are needed
- [ ] Addition schedule is before critical threshold dates
- [ ] Budget allocated for new shard infrastructure

## Common Failures

- Growth rate underestimated — new shards needed sooner than planned
- One shard grows faster than others — uneven distribution
- Capacity per shard overestimated — shard fills faster than projected

## Decision Points

- Conservative vs aggressive growth projections
- Pre-emptive shard addition vs reactive

## Performance Considerations

- Adding shards pre-emptively: lower urgency, controlled migration
- Adding reactively: higher urgency, risk of performance impact
- Monitor projections quarterly and adjust

## Security Considerations

- Capacity data is business-sensitive (reveals growth)
- New shard infrastructure must meet security requirements

## Related Rules

- 6-12-1: Always Verify New Shard Before Routing Traffic

## Related Skills

- Implement Adding New Shards
- Implement Shard Rebalancing
- Implement Shard Monitoring

## Success Criteria

- New shards added before any shard reaches critical utilization
- Growth projections accurate within ±20% over 6 months
- No emergency shard additions due to missed projections
