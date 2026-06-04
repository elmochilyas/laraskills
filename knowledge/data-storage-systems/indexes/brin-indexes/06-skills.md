# Skill: Design BRIN Indexes for Time-Series Data

## Purpose

Use PostgreSQL BRIN indexes for large append-only tables with correlated data order (time-series, event logs, audit trails) — achieving 100-1000x size reduction over B-Tree while enabling efficient range queries on the correlated column.

## When To Use

- Time-series data inserted in chronological order
- Append-only tables (rare UPDATE/DELETE)
- Range queries on timestamp or auto-increment columns
- Storage-constrained environments

## When NOT To Use

- Randomly distributed data (UUID PKs, random insert patterns)
- Point lookups (BRIN is poor for single-row lookups)
- Frequently updated/deleted tables

## Prerequisites

- Data insertion order correlates with indexed column value
- Understanding of `pages_per_range` tuning

## Inputs

- Table size and growth rate
- Column with insertion-order correlation
- Query pattern (range queries)
- Storage budget

## Workflow

1. Confirm data insertion order correlates with the indexed column
2. Confirm the table is append-only (rare UPDATE/DELETE)
3. Create BRIN index: `DB::statement('CREATE INDEX ON logs USING BRIN (created_at)')`
4. Tune `pages_per_range` based on query precision needs (default 128)
5. Verify with EXPLAIN that BRIN is used for range queries

## Validation Checklist

- [ ] Data insertion order correlates with indexed column
- [ ] Table is append-only (rare UPDATE/DELETE)
- [ ] Queries are range-based (not point lookups)
- [ ] Storage savings are meaningful (>10x vs B-Tree)

## Common Failures

### BRIN on randomly distributed data
UUID primary key inserted randomly across the table. Each block range covers almost the entire value range. Every query scans all blocks. Use B-Tree instead.

### Not choosing optimal pages_per_range
Default (128) is a starting point. Lower values (32) = more precise but larger index. Higher (256) = smaller index but coarser filtering.

## Decision Points

### BRIN vs B-Tree for time-series?
BRIN if storage is a concern and queries are range-based. B-Tree if point lookups are also needed on the column.

### pages_per_range tuning?
Lower for precise filtering on small tables. Higher for storage efficiency on large tables. Tune based on query response time goals.

## Performance Considerations

BRIN indexes are 100-1000x smaller than B-Tree for large tables. They excel at range queries on correlated data. Point lookups may still require B-Tree.

## Security Considerations

BRIN indexes don't affect security. Time-series data may have retention policies — ensure indexes are rebuilt after data purges.

## Related Rules

- Use BRIN for append-only time-series data
- Don't use BRIN on randomly distributed data
- Tune pages_per_range for the query pattern

## Related Skills

- Design B-Tree Indexes for Equality and Range Queries
- Maintain and Rebuild Indexes for Bloat Management
- Apply Partial Indexes for Targeted Data Subsets

## Success Criteria

- BRIN index on time-series column with correlated insert order
- Range queries use BRIN (confirmed via EXPLAIN)
- Significant storage savings vs B-Tree
- pages_per_range tuned for query pattern
