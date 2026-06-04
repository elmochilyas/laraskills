# Skill: Use Covering Indexes for Index-Only Scans

## Purpose

Design covering indexes that contain all columns needed by a query, enabling index-only scans that eliminate heap fetches — using PostgreSQL's `INCLUDE` for non-key payload columns without affecting B-Tree structure or uniqueness constraints.

## When To Use

- Dashboard and aggregation queries selecting few columns
- List endpoints with frequent access patterns
- Queries where heap fetches are the dominant cost
- Unique indexes that need payload columns without breaking uniqueness

## When NOT To Use

- SELECT * queries (too many columns)
- Columns that are rarely selected together
- Queries where table access is already fast enough

## Prerequisites

- Understanding of index-only scans vs heap fetches
- Knowledge of INCLUDE columns (PostgreSQL)

## Inputs

- Query SELECT columns
- WHERE/JOIN/ORDER BY columns (index key)
- Payload columns to include (non-key)
- Database type (PostgreSQL INCLUDE vs MySQL covering)

## Workflow

1. Identify the query's SELECT columns beyond the index key columns
2. For PostgreSQL: `DB::statement('CREATE INDEX ON orders (tenant_id, status) INCLUDE (total, name)')`
3. For MySQL: add SELECT columns to the index as additional key columns
4. Verify with EXPLAIN: "Using index" (MySQL) or "Index Only Scan" (PostgreSQL)

## Validation Checklist

- [ ] Covered query doesn't SELECT large columns unnecessarily
- [ ] PostgreSQL uses INCLUDE for non-key payload columns
- [ ] INCLUDE columns don't expand the index beyond reasonable size
- [ ] EXPLAIN confirms index-only scan

## Common Failures

### Over-covering
Adding 15 columns to an index to cover a query. The index becomes nearly as large as the table, eliminating the benefit.

### Not using INCLUDE in PostgreSQL
Adding payload columns as regular index columns unnecessarily increases B-Tree depth and affects uniqueness constraints.

## Decision Points

### Covering vs not covering?
Covering saves heap fetches but increases index size. Worth it for hot queries where index fits in buffer pool.

### INCLUDE vs key column?
INCLUDE for payload columns not used in WHERE/JOIN/ORDER BY. Key columns for conditions and sorting.

## Performance Considerations

Covering indexes eliminate heap fetches, the most expensive part of query execution. But larger indexes consume more buffer pool and slow writes.

## Security Considerations

Covering indexes may store sensitive data (phone numbers, emails) in the index. Consider if index structure exposes data in backups or statistics.

## Related Rules

- Don't over-cover — only include columns that reduce heap fetches
- Use PostgreSQL INCLUDE for payload columns
- Verify index-only scan with EXPLAIN

## Related Skills

- Design Composite Indexes with Correct Leftmost Prefix
- Include Non-Key Columns for Covering Indexes
- Design Composite Indexes with Correct Column Ordering

## Success Criteria

- Hot queries achieve index-only scans
- INCLUDE used in PostgreSQL for non-key columns
- Index size doesn't exceed reasonable ratio to table size
- EXPLAIN confirms "Index Only Scan" or "Using index"
