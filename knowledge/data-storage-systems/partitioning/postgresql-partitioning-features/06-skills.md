# Skill: Leverage PostgreSQL Partitioning Features

## Purpose

Use PostgreSQL's declarative partitioning, global indexes, partition detachment, and partition-wise joins for flexible table partitioning beyond MySQL's capabilities.

## When To Use

- PostgreSQL 10+ (declarative partitioning), 13+ (subpartitioning)
- Need global indexes for queries without partition key
- Need foreign keys on partitioned tables (PostgreSQL supports them)
- Need partition detachment (retain data as standalone table)
- Need partition-wise JOINs for performance

## When NOT To Use

- MySQL database (different partitioning implementation)
- PostgreSQL < 10 (use declarative, not table inheritance)
- Partitioning not needed (overhead without benefit)

## Prerequisites

- PostgreSQL 10+ database
- Table partition definition
- Understanding of declarative partition syntax

## Inputs

- Table schema
- Partition key and strategy
- Query patterns (for global vs local index decision)
- Partition detachment requirements

## Workflow (numbered steps)

1. Create the partitioned table using declarative partitioning:
   ```sql
   CREATE TABLE orders (
     id SERIAL, created_at DATE, user_id INT, ...
   ) PARTITION BY RANGE (created_at);
   ```
2. Create individual partition tables:
   ```sql
   CREATE TABLE orders_2024 PARTITION OF orders
     FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
   CREATE TABLE orders_2025 PARTITION OF orders
     FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
   ```
3. Create indexes (global by default in PostgreSQL):
   ```sql
   CREATE INDEX orders_user_id_idx ON orders (user_id);  -- global index
   CREATE INDEX orders_created_at_user_id_idx ON orders (created_at, user_id);  -- local preference
   ```
4. Use partition detachment for data archival:
   ```sql
   ALTER TABLE orders DETACH PARTITION orders_2020;
   -- orders_2020 is now a standalone table with all its data
   -- Can re-attach later: ALTER TABLE orders ATTACH PARTITION orders_2020 ...
   ```
5. Use partition-wise JOIN (v12+):
   - Enable: `SET enable_partition_wise_join = on;`
   - PostgreSQL joins matching partitions directly instead of merging all
   - Beneficial for large partitioned tables joined on partition key
6. Monitor partition pruning with EXPLAIN:
   ```sql
   EXPLAIN SELECT * FROM orders WHERE created_at >= '2024-01-01';
   ```

## Validation Checklist

- [ ] Declarative partitioning used (not table inheritance)
- [ ] Partitions created with FOR VALUES FROM/TO range
- [ ] Global indexes created for queries without partition key
- [ ] Partition detachment tested and working
- [ ] Partition pruning verified with EXPLAIN
- [ ] Partition-wise JOIN enabled and tested (if needed)

## Common Failures

- Using old table inheritance instead of declarative partitioning
- Default partition not created — inserts fail for out-of-range values
- Global index maintenance overhead impacts write performance
- Detached partition schema diverges from partition definition (re-attach fails)
- Partition pruning not working for parameterized queries

## Decision Points

- Global vs local indexes: global for unpruned queries, local for write-heavy workloads
- Partition detachment vs DROP: DETACH retains data, DROP removes it
- Default partition: include (catch-all) vs omit (error on unmatched keys)
- Subpartitioning (v13+): range-hash, range-list for multi-level partitioning

## Performance Considerations

- Global indexes: fast lookup without partition key, higher write overhead
- Partition-wise JOIN: beneficial when both tables partitioned by same key
- Partition pruning: works with range, list, hash (as of PG11)
- Default partition: becomes hot if many rows fall into it
- VACUUM and ANALYZE operate per partition, manage individually

## Security Considerations

- Each partition is a separate table — set appropriate permissions
- Global indexes may expose data distribution across partitions
- Detached partitions may contain sensitive data — secure them

## Related Rules

- 8-11-1: Always Use Declarative Partitioning
- 8-11-2: Prefer Global Indexes for Queries Without Partition Key

## Related Skills

- Migrate from MySQL to PostgreSQL Partitioning
- Implement Partition Detachment for Archival
- Implement Partition-Wise Joins

## Success Criteria

- Declarative partitioning configured correctly
- Global indexes work for unpruned queries
- Partition detachment and re-attachment tested
- Queries prune to correct partitions
- Partition-wise JOIN improves performance for joined partitioned tables
