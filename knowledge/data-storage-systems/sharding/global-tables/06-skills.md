# Skill: Implement Global Tables

## Purpose

Replicate reference data (countries, currencies, product categories) to all shards so that joins work locally without cross-shard queries.

## When To Use

- Reference data needed by all shards
- Data is read-heavy and rarely updated
- Joins with local shard data are needed
- Consistency requirements are relaxed (eventually consistent)

## When NOT To Use

- Data is shard-local (no cross-shard reference needed)
- Data changes very frequently (replication overhead high)
- Strong consistency required across all shards

## Prerequisites

- Sharded database architecture
- Replication mechanism (application-level or database-level)
- Reference data source of truth

## Inputs

- Reference data definition (tables and rows)
- Replication strategy
- Update propagation mechanism

## Workflow (numbered steps)

1. Identify tables that must exist on all shards (global reference data)
2. Choose replication strategy:
   - Application-level: on reference data update, write to all shards
   - CDC: Debezium captures changes from source, replicates to all shards
   - Database-level: trigger-based or statement-based replication
3. Implement write path: when reference data changes, update on all shards
4. Implement read path: read global data from local shard (no cross-shard query)
5. Handle consistency: eventual consistency is typical for global tables
6. Monitor replication lag for global table updates

## Validation Checklist

- [ ] Global tables exist on all shards
- [ ] Reference data is consistent across shards (within acceptable window)
- [ ] Joins between global and local data work within shard
- [ ] Update propagation works correctly

## Common Failures

- Global table update fails on one shard — inconsistency
- Schema changes to global table must be applied to all shards
- Large global tables replicated to all shards waste storage

## Decision Points

- Application-level write-to-all vs CDC vs database replication
- Strong vs eventual consistency for global data

## Performance Considerations

- Write amplification: each reference data update is written to N shards
- Read performance: local shard read (fast), no cross-shard join needed
- Storage: duplicated on each shard

## Security Considerations

- Global table updates must be authenticated
- All shards must have same access controls for global data

## Related Rules

- 6-25-1: Always Replicate Global Data To All Shards
- 6-25-2: Never Allow Cross-Shard Joins For Global Data

## Related Skills

- Implement Reference Table Replication
- Handle Cross-Shard Join Limitations
- Implement Shard Local Tables

## Success Criteria

- Global tables consistent across all shards (within acceptable lag)
- Local joins with global data work without cross-shard queries
- Update propagation completes within SLA

---

# Skill: Implement Application-Level Global Table Replication

## Purpose

Write reference data to all shards from the application when global data is updated, ensuring each shard has a local copy.

## When To Use

- Simple replication mechanism needed (no CDC infrastructure)
- Reference data updates are infrequent
- Application can tolerate writing to N shards
- Eventual consistency is acceptable

## When NOT To Use

- Reference data updates are frequent (high write amplification)
- Strong consistency required across shards
- CDC or database-level replication is already in place

## Prerequisites

- Global table definition
- List of all shard connections
- Write-to-all logic

## Inputs

- Reference data changes
- Shard connection list
- Consistency requirements

## Workflow (numbered steps)

1. On reference data update, begin transaction on the source of truth (primary)
2. Update global data on the source
3. Dispatch queue jobs to update the same data on all shards
4. Each job: one shard, update the reference data
5. On read: query local shard's copy of global data
6. Handle failures: retry failed shard updates, alert on persistent failure
7. Periodic reconciliation: compare global data across shards, fix inconsistencies

## Validation Checklist

- [ ] Reference data updates propagate to all shards
- [ ] Shards converge to consistent state within acceptable window
- [ ] Failed updates are retried and alerted
- [ ] Periodic reconciliation detects and fixes inconsistencies

## Common Failures

- Update fails on one shard — shard has stale reference data
- Race condition: update order differs between shards (temporary inconsistency)
- Reconciliation too infrequent — inconsistencies accumulate

## Decision Points

- Queue-based write-to-all vs synchronous write-to-all
- Reconciliation frequency

## Performance Considerations

- Write amplification: 1 write source + N writes to shards
- Queue-based: faster response to user, eventually consistent
- Synchronous: consistent immediately, slower response

## Security Considerations

- Write-to-all must be authenticated
- Queue jobs must not expose sensitive reference data

## Related Rules

- 6-25-1: Always Replicate Global Data To All Shards

## Related Skills

- Implement Global Tables
- Implement Reference Table Replication
- Implement Fan-Out Queries

## Success Criteria

- All shards have consistent global data within 60 seconds of update
- Zero persistent inconsistencies detected by reconciliation
- Write amplification is within acceptable limits
