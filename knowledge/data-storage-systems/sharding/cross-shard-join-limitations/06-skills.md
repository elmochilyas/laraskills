# Skill: Handle Cross-Shard Join Limitations

## Purpose

Design queries and data models to avoid cross-shard joins by co-locating related data on the same shard or using application-level joins.

## When To Use

- Sharded database where related data may be on different shards
- Designing data model for sharded architecture
- Migrating from non-sharded to sharded database

## When NOT To Use

- Non-sharded database (joins work natively)
- All related data co-located on same shard (joins work)

## Prerequisites

- Understanding of shard key and data relationships
- Knowledge of query patterns that require joins

## Inputs

- Data model with relationships
- Query patterns (which joins are needed)
- Shard key assignment per table

## Workflow (numbered steps)

1. Identify all joins in the data model
2. For each join, check if related tables share the same shard key:
   - Same shard key → join works within a shard (good)
   - Different shard key → cross-shard join (must avoid)
3. For same-shard-key joins: co-locate data by sharding with same key
4. For cross-shard joins:
   - Denormalize data: store joined data in the same table
   - Application-level join: fetch from one shard, then fetch related from another
   - Use shard groups: group related shards for limited joins
5. Document all cross-shard join workarounds

## Validation Checklist

- [ ] Tables that need joins share the same shard key
- [ ] Cross-shard joins are eliminated or handled at application level
- [ ] Denormalization doesn't cause data inconsistency
- [ ] Application-level joins don't create N+1 query patterns

## Common Failures

- Eloquent relations load data across shards without awareness
- Denormalized data becomes stale (not updated on source change)
- Application-level join creates N+1 queries (one query per related record)

## Decision Points

- Denormalization vs application-level join
- Shard group (limited cross-shard joins) vs full co-location

## Performance Considerations

- Same-shard join: efficient, single query
- Application-level join: 2 queries, both potentially efficient
- Denormalization: faster reads, slower writes (update overhead)

## Security Considerations

- Denormalized data must respect access controls
- Application-level joins must not expose data across security boundaries

## Related Rules

- 6-8-1: Always Co-Locate Joinable Data
- 6-8-2: Never Execute Cross-Shard Joins

## Related Skills

- Select a Shard Key
- Implement Fan-Out Queries
- Implement Cross-Shard Query Aggregation

## Success Criteria

- All critical joins are within a single shard
- Cross-shard joins are either eliminated or handled at application level
- Zero database-level cross-shard join attempts

---

# Skill: Denormalize Data to Avoid Cross-Shard Joins

## Purpose

Store redundant data across shards to avoid expensive cross-shard joins, maintaining consistency with application-level or eventual consistency patterns.

## When To Use

- Related data cannot be co-located on same shard
- Read performance is more important than write overhead
- Data changes infrequently

## When NOT To Use

- Join is between tables with same shard key (co-locate instead)
- Write frequency is very high (denormalization overhead too expensive)
- Data consistency must be immediate (denormalization is eventually consistent)

## Prerequisites

- Identified cross-shard joins
- Understanding of denormalization tradeoffs
- Consistency mechanism (eventual vs immediate)

## Inputs

- Data to denormalize
- Source table(s) and target table(s)
- Update strategy

## Workflow (numbered steps)

1. Identify data that needs denormalization (frequently joined fields)
2. Add redundant columns to the target table
3. On source data update, propagate changes to denormalized copies:
   - Immediate: update in same transaction (if same shard)
   - Eventual: queue update job for affected shards
4. Add validation to detect stale denormalized data (compare checksums)
5. Document denormalization decisions for future developers

## Validation Checklist

- [ ] Denormalized data eliminates the need for cross-shard join
- [ ] Update mechanism works correctly
- [ ] Stale data detection and remediation in place
- [ ] Storage overhead is acceptable

## Common Failures

- Denormalized data not updated when source changes — stale reads
- Too much denormalization — write overhead exceeds benefit
- Inconsistent denormalization across shards — different values for same data

## Decision Points

- Full denormalization vs partial (only frequently accessed fields)
- Immediate vs eventual consistency for updates
- Application-level update vs database trigger

## Performance Considerations

- Denormalization: faster reads (no join), slower writes (update overhead)
- Storage: increased due to redundant data
- Use for read-heavy workloads; avoid for write-heavy

## Security Considerations

- Denormalized data must respect the same access controls as source
- Ensure denormalization doesn't create security gaps

## Related Rules

- 6-8-1: Always Co-Locate Joinable Data

## Related Skills

- Handle Cross-Shard Join Limitations
- Implement Application-Level Joins
- Implement Reference Table Replication

## Success Criteria

- Cross-shard joins eliminated for denormalized relationships
- Data consistency between source and denormalized copies within acceptable window
- Storage overhead is within allocated budget
