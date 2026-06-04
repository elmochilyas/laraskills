# Skill: Design Indexes for Partitioned Tables

## Purpose

Create indexes that work efficiently with partitioned tables, understanding local vs global indexes and MySQL's unique index restrictions.

## When To Use

- Designing indexes for partitioned tables
- MySQL: ensuring unique indexes include the partition key
- PostgreSQL: deciding between local and global indexes
- Optimizing query performance on partitioned tables

## When NOT To Use

- Non-partitioned tables (standard index design applies)
- Queries always include partition key (local indexes work fine)

## Prerequisites

- Table partition definition
- Query patterns identified
- Understanding of local vs global indexes

## Inputs

- Partition key
- Query patterns (which columns in WHERE)
- Unique constraint requirements
- Database platform (MySQL vs PostgreSQL)

## Workflow (numbered steps)

1. Understand index types by database:
   - **MySQL**: All indexes are local (partitioned with table). Unique indexes MUST include all partition key columns.
   - **PostgreSQL**: Supports both local (per-partition) and global (cross-partition) indexes.
2. For MySQL:
   - Ensure all unique indexes include the partition key:
     - ✅ `UNIQUE (created_at, user_id)` on table partitioned by `created_at`
     - ❌ `UNIQUE (user_id)` on table partitioned by `created_at`
   - Non-unique indexes don't require partition key, but benefit from pruning
   - Create indexes per partition (automatically local)
3. For PostgreSQL:
   - **Global index**: `CREATE INDEX ON orders(user_id)` — single B-tree across all partitions
     - Good for queries without partition key
     - Higher write overhead (each insert updates global index)
   - **Local index**: `CREATE INDEX ON orders(user_id) LOCAL` — one index per partition
     - Requires partition key in WHERE for efficiency
     - Lower write overhead
4. Create indexes that match query patterns:
   - If queries always filter by partition key → local indexes (or global, PostgreSQL)
   - If queries filter by non-partition key → global indexes (PostgreSQL only) or include partition key
5. Verify index usage with EXPLAIN

## Validation Checklist

- [ ] MySQL: all unique indexes include partition key
- [ ] PostgreSQL: global vs local index decision matches query patterns
- [ ] Indexes created on partitioned table without errors
- [ ] EXPLAIN shows index usage (not full scan per partition)
- [ ] Queries without partition key use indexes correctly

## Common Failures

- MySQL: unique index without partition key → error or silent failure
- MySQL: no index on non-partition column → full scan across all partitions
- PostgreSQL: global index write overhead too high for write-heavy tables
- Local index not used because query doesn't prune partitions
- Index on partition key alone is redundant (partitioning already prunes)

## Decision Points

- MySQL vs PostgreSQL: PostgreSQL more flexible (global indexes, FK support)
- Local vs global index (PostgreSQL): query patterns vs write overhead
- Composite index: (partition_key, other_column) for optimal pruning + filtering
- Unique constraints requiring partition key: may force unnatural partition key choice

## Performance Considerations

- MySQL: local index on N partitions with full scan = N index probes
- PostgreSQL: global index = 1 index probe regardless of partition scan
- Write overhead: global index > local index (all partitions update vs one)
- Index maintenance during DROP PARTITION: local indexes dropped with partition, global indexes need VACUUM (PostgreSQL)

## Security Considerations

- Indexes on partitioned tables same security as non-partitioned
- Indexes may expose data distribution patterns

## Related Rules

- 8-8-1: Always Include Index Strategy in Partition Design
- 8-8-2: MySQL Unique Indexes Must Include Partition Key

## Related Skills

- Implement Partition Pruning
- Optimize Query Performance with EXPLAIN
- Implement Indexing Strategy

## Success Criteria

- Indexes created successfully on partitioned table
- Queries use indexes appropriately
- MySQL unique indexes include partition key
- PostgreSQL global/local decision matches query patterns
