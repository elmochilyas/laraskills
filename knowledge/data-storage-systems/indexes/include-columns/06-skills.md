# Skill: Include Non-Key Columns for Covering Indexes

## Purpose

Use PostgreSQL `INCLUDE` to add non-key payload columns to an index — stored in leaf pages but not participating in the B-Tree structure, uniqueness enforcement, or leftmost prefix rules — enabling covering indexes without expanding tree depth.

## When To Use

- Adding commonly selected columns to an existing index for index-only scans
- Including payload columns in unique indexes without affecting uniqueness
- Columns needed for filtering after index access (residual filtering)
- Reducing heap fetches for hot queries

## When NOT To Use

- Columns used in WHERE, JOIN, or ORDER BY (should be key columns)
- Very large columns (text, JSONB) that bloat the index
- MySQL databases (MySQL doesn't support INCLUDE)

## Prerequisites

- PostgreSQL database
- Understanding of covering index concepts

## Inputs

- Key columns (used in WHERE/JOIN/ORDER BY)
- Payload columns (used in SELECT, not in conditions)
- Query execution frequency

## Workflow

1. Identify the query's SELECT columns that are not in the index key
2. Add them as INCLUDE columns: `DB::statement('CREATE UNIQUE INDEX ON users (email) INCLUDE (name, avatar_url)')`
3. Verify with EXPLAIN: "Index Only Scan" should appear
4. Monitor index size — INCLUDE columns increase leaf page size

## Validation Checklist

- [ ] INCLUDE columns are not used in WHERE/JOIN/ORDER BY
- [ ] Unique index semantics are preserved (INCLUDE columns don't affect uniqueness)
- [ ] Index doesn't exceed reasonable size (monitor with pg_table_size)
- [ ] EXPLAIN shows "Index Only Scan" for covered queries

## Common Failures

### Over-covering
Adding too many INCLUDE columns makes the index nearly as large as the table, eliminating the benefit.

### Not using INCLUDE in PostgreSQL
Adding payload columns as regular key columns unnecessarily increases B-Tree depth and affects uniqueness constraints.

## Decision Points

### INCLUDE vs key column?
INCLUDE for columns only in SELECT. Key column for columns in WHERE, JOIN, or ORDER BY.

### INCLUDE vs separate index?
Adding INCLUDE to an existing index is cheaper than creating a new covering index. Only create a new index if the key columns differ significantly.

## Performance Considerations

INCLUDE columns increase leaf page size (more I/O per page read) but eliminate heap fetches. Best for columns that are frequently selected but not filtered.

## Security Considerations

INCLUDE columns store data in the index. For sensitive payloads, consider if index-level access is a concern (backup exposure, statistics).

## Related Rules

- Use INCLUDE for payload columns, key columns for conditions
- Don't over-cover with large INCLUDE columns
- Verify index-only scan with EXPLAIN

## Related Skills

- Use Covering Indexes for Index-Only Scans
- Design Nulls Not Distinct Indexes
- Design Partial Indexes for Targeted Data Subsets

## Success Criteria

- INCLUDE columns enable index-only scans for hot queries
- Index size remains reasonable
- Unique constraint semantics preserved
- EXPLAIN confirms "Index Only Scan"
