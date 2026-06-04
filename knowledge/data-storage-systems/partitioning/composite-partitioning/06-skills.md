# Skill: Implement Composite (Sub)partitioning

## Purpose

Use two-level partitioning — range by date for lifecycle management, hash by key for even write distribution — to combine the benefits of both strategies.

## When To Use

- Need both lifecycle management (archival by date) and write distribution (by key)
- Write-heavy table that also requires range-based archival
- Large table (> 100M rows) with both time-based and key-based access patterns
- Time-series data that also needs even distribution across storage

## When NOT To Use

- Single partitioning strategy meets all requirements
- Partition count exceeds practical limits (primary × subpartitions)
- Operational complexity outweighs benefits
- Table is moderate size (partitioning overkill)

## Prerequisites

- Database supporting subpartitioning (MySQL 5.1+)
- Primary partition strategy and subpartition strategy defined
- Understanding of partition count limits

## Inputs

- Table schema
- Primary partition key (typically date for lifecycle)
- Subpartition key (typically user_id or hash for distribution)
- Partition counts (primary partitions × subpartitions)

## Workflow (numbered steps)

1. Choose the composite strategy:
   - **Range-Hash**: Partition by range (date) for lifecycle, subpartition by hash (key) for distribution
   - **Range-List**: Partition by range (date), subpartition by list (status)
   - **List-Hash**: Partition by list (region), subpartition by hash (key)
2. Create table with composite partitioning (MySQL syntax):
   ```sql
   CREATE TABLE orders (
     id INT, user_id INT, created_at DATE, ...
   ) PARTITION BY RANGE (YEAR(created_at))
   SUBPARTITION BY HASH (user_id) SUBPARTITIONS 4 (
     PARTITION p2023 VALUES LESS THAN (2024),
     PARTITION p2024 VALUES LESS THAN (2025),
     PARTITION p_future VALUES LESS THAN MAXVALUE
   );
   ```
3. Total partitions = primary count × subpartition count
   - Example: 3 range partitions × 4 hash subpartitions = 12 total
   - Keep under 8192 (MySQL limit), preferably under 500
4. Queries should include both partition keys for optimal pruning
5. Maintenance operations apply at primary partition level:
   - `ALTER TABLE orders DROP PARTITION p2020` — drops all subpartitions too

## Validation Checklist

- [ ] Total partition count (primary × sub) within limits
- [ ] Query includes primary partition key for pruning
- [ ] Query includes subpartition key for subpartition pruning
- [ ] DROP/TRUNCATE at primary partition level works correctly
- [ ] Data distribution even across subpartitions

## Common Failures

- Excessive total partitions (12 primary × 100 sub = 1200 — too many)
- Subpartition pruning requires subpartition key in WHERE
- REORGANIZE/REBUILD operations are more complex with subpartitions
- Not all databases support subpartitioning (PostgreSQL uses inheritance)

## Decision Points

- Primary partition strategy: range vs list vs hash
- Subpartition strategy: hash vs list
- Subpartition count per primary partition
- Single-level vs composite partitioning

## Performance Considerations

- Subpartition pruning: query must include subpartition key
- DROP PARTITION: instant, removes all subpartitions
- REORGANIZE: copies data, more complex with subpartitions
- Metadata overhead: higher than single-level partitioning

## Security Considerations

- Security same as single-level partitioning
- Partition structure exposes data lifecycle strategy

## Related Rules

- 8-4-1: Always Include Both Partition Keys In WHERE
- 8-4-2: Keep Total Partition Count Under 500

## Related Skills

- Implement Range Partitioning
- Implement Hash Partitioning
- Implement Partition Management

## Success Criteria

- Lifecycle management works at primary partition level
- Write distribution even across subpartitions
- Query pruning works for both partition levels
- Total partition count within limits
