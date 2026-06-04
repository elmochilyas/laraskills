# Skill: Estimate Index Size for Buffer Pool Planning

## Purpose

Estimate index storage requirements and monitor index-to-table size ratios — using `pg_indexes_size()` (PostgreSQL) and `INFORMATION_SCHEMA.INNODB_INDEXES` (MySQL) — to ensure indexes fit in buffer pool, identify over-indexing, and plan storage capacity.

## When To Use

- Capacity planning for new tables and indexes
- Identifying oversized indexes that need consolidation
- Buffer pool sizing for performance optimization
- Quarterly storage audit

## When NOT To Use

- Ad-hoc performance debugging (use EXPLAIN instead)
- Tables with only a few small indexes

## Prerequisites

- Access to database statistics views
- Understanding of buffer pool and working set concepts

## Inputs

- Index definitions (columns, types)
- Row count and row size estimates
- Buffer pool size

## Workflow

1. Query index size: PostgreSQL `pg_indexes_size('table_name')`, MySQL `INFORMATION_SCHEMA.INNODB_INDEXES`
2. Calculate index-to-data ratio: total index size / table size
3. Compare to buffer pool size — all hot indexes should fit in buffer pool
4. Identify oversized or unused indexes
5. Plan index maintenance or removal for indexes exceeding reasonable size

## Validation Checklist

- [ ] Index-to-data ratio is reasonable (typically 0.5-2x)
- [ ] Hot indexes fit in buffer pool
- [ ] Unused indexes identified and considered for removal
- [ ] Storage budget accounts for index growth

## Common Failures

### Ignoring index size on memory-constrained systems
Large indexes that don't fit in buffer pool cause constant page swapping, degrading performance.

## Decision Points

### Index size vs query benefit?
Large indexes may still be worth it if they dramatically improve query performance. But if an index is large and rarely used, consider alternatives.

### Consolidation vs separate indexes?
One composite index is typically smaller than multiple overlapping indexes. Consolidation reduces total size.

## Performance Considerations

Indexes that don't fit in buffer pool cause page swaps. Monitor buffer pool hit rate. If hit rate drops below 99%, the working set may not fit.

## Security Considerations

Index size statistics may reveal table growth patterns. Ensure database statistics access is restricted appropriately.

## Related Rules

- Monitor index-to-data ratio for over-indexing signals
- Ensure hot indexes fit in buffer pool
- Remove unused indexes to free buffer pool space

## Related Skills

- Assess Over-Indexing Risks
- Monitor Index Usage Statistics
- Maintain and Rebuild Indexes for Bloat Management

## Success Criteria

- Index-to-data ratio is within expected range
- Hot indexes fit in buffer pool
- Unused indexes are identified and removed
- Storage monitoring alerts on unexpected index growth
