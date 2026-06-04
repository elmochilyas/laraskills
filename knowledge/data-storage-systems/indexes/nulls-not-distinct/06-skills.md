# Skill: Design Nulls Not Distinct Indexes for Unique Nullable Columns

## Purpose

Use PostgreSQL 15+ `NULLS NOT DISTINCT` to enforce that `NULL` values are treated as equal in unique indexes — allowing only one row with `NULL` in a unique column — for single-active-record patterns and unique nullable foreign keys.

## When To Use

- Single active record per entity (only one row can have `current_version = NULL`)
- Unique nullable foreign keys (at most one row with NULL parent_id)
- Any nullable column that should have unique non-NULL values AND at most one NULL

## When NOT To Use

- Multiple NULLs should be allowed (default behavior)
- PostgreSQL < 15 (NULLS NOT DISTINCT not available)

## Prerequisites

- PostgreSQL 15+
- Understanding of standard SQL NULL comparison rules

## Inputs

- Column that should allow only one NULL
- Existing data (check for duplicate NULLs before creating)

## Workflow

1. Check for existing duplicate NULLs: `SELECT col, COUNT(*) FROM table WHERE col IS NULL GROUP BY col`
2. Create unique index with NULLS NOT DISTINCT: `DB::statement('CREATE UNIQUE INDEX ON users (email) NULLS NOT DISTINCT')`
3. Verify first NULL inserts successfully, second fails
4. For soft-delete integration, combine with partial index

## Validation Checklist

- [ ] No existing duplicate NULLs in the column
- [ ] PostgreSQL version is 15+
- [ ] Business logic requires single-NULL constraint
- [ ] Combined with partial index for soft-delete unique constraint if needed

## Common Failures

### Not checking for existing duplicate NULLs
Adding NULLS NOT DISTINCT to a column with existing duplicate NULLs will fail. Clean data first.

## Decision Points

### NULLS NOT DISTINCT vs partial index?
NULLS NOT DISTINCT for simple single-NULL constraint. Partial index `WHERE deleted_at IS NULL` for soft-delete filtered uniqueness.

### NULLS NOT DISTINCT vs application logic?
Database-enforced constraint is more reliable than application-level checks. Use when data integrity is critical.

## Performance Considerations

NULLS NOT DISTINCT doesn't add measurable overhead. The index structure is the same; only the comparison semantics differ.

## Security Considerations

Enforcing single-NULL at the database level prevents race conditions that application-level checks would miss. Prevents data integrity issues.

## Related Rules

- Check for existing duplicate NULLs before creating the index
- Combine with partial indexes for soft-delete scenarios
- Ensure PostgreSQL 15+ minimum version

## Related Skills

- Apply Partial Indexes for Targeted Data Subsets
- Index Soft Delete Columns Effectively
- Create RLS-Compatible Partial Indexes

## Success Criteria

- Only one NULL allowed in the indexed column
- Existing duplicate NULLs are resolved before creating the index
- Partial index integration for soft-delete works correctly
- PostgreSQL version is 15+
