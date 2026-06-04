# Skill: Assess and Mitigate Over-Indexing Risks

## Purpose

Evaluate and mitigate the risks of over-indexing — write amplification, storage bloat, vacuum/maintenance overhead — by consolidating redundant indexes, maintaining minimum viable indexes based on measured query patterns, and regularly auditing index usage.

## When To Use

- Code review of new indexes
- Quarterly index audit
- Performance optimization on write-heavy tables
- Storage capacity planning

## When NOT To Use

- Adding critical indexes for known slow queries
- Read-only reporting tables (write amplification is not a concern)

## Prerequisites

- Understanding of write amplification from multiple indexes
- Access to index usage statistics

## Inputs

- List of all indexes on a table
- Write volume (INSERT/UPDATE/DELETE per second)
- Query patterns and index usage statistics
- Storage constraints

## Workflow

1. List all indexes on each table
2. Identify redundant indexes: composite (a, b) makes single (a) redundant
3. Consolidate overlapping indexes into fewer composite indexes
4. Drop indexes with zero or near-zero usage (from pg_stat_user_indexes)
5. For remaining indexes, calculate write amplification factor: index count × write IO
6. Document the rationale for each retained index

## Validation Checklist

- [ ] No redundant indexes (composite doesn't exist alongside its prefix)
- [ ] Unused indexes (zero scans in 30 days) identified and dropped
- [ ] Write amplification factor is acceptable for the table's write volume
- [ ] Each index has a documented justification

## Common Failures

### Index every column
"This column might be queried someday." Indexes have costs. Add when needed, not preemptively.

### Duplicate indexes
Composite index `(a, b)` makes separate index on `(a)` redundant. The composite serves leftmost prefix queries on `a`.

## Decision Points

### Redundant vs complementary?
Index (a, b) makes (a) redundant but does not make (b) redundant. Drop (a) but keep (b) if queries filter on (b) alone.

### Keep or drop rarely-used index?
If idx_scan > 0 but very low, consider if the index is needed for infrequent but important queries (monthly reports, maintenance).

## Performance Considerations

Each index multiplies write cost. On a table with 10 indexes, every INSERT updates all 10 indexes. Storage cost follows the same multiplier.

## Security Considerations

Fewer indexes mean fewer database objects to manage. Security is not directly affected, but reduced maintenance overhead improves overall stability.

## Related Rules

- Don't index every column preemptively
- Consolidate overlapping indexes
- Drop unused indexes

## Related Skills

- Monitor Index Usage Statistics
- Estimate Index Size for Buffer Pool Planning
- Design Composite Indexes with Correct Leftmost Prefix

## Success Criteria

- No redundant indexes on any table
- Unused indexes dropped
- Write amplification factor is acceptable
- Each index has a documented justification based on query patterns
