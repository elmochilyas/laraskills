# Skill: Order Composite Index Columns by Query Access Pattern

## Purpose

Apply the cardinality-based column ordering rule: place columns used in equality conditions (`=`, `IN`) before columns used in range conditions (`>`, `<`, `BETWEEN`, `ORDER BY`) — maximizing the portion of the composite B-Tree index that can be efficiently searched.

## When To Use

- Designing composite indexes with mixed equality and range conditions
- Optimizing queries that filter and sort
- Creating covering indexes

## When NOT To Use

- Single-column indexes (ordering doesn't apply)
- Columns with only equality conditions (order matters less)

## Prerequisites

- Understanding of B-Tree composite index structure
- Knowledge of equality vs range condition classification

## Inputs

- Query WHERE conditions classified as equality or range
- ORDER BY columns
- Column cardinality estimates

## Workflow

1. Identify equality columns: those used with `=`, `IS`, `IN` (IN is treated as multiple equalities)
2. Identify range columns: those used with `>`, `<`, `>=`, `<=`, `BETWEEN`, `LIKE 'prefix%'`
3. Identify sort columns: those in ORDER BY
4. Create index: equality columns → range columns → sort column
5. Verify with EXPLAIN: check for "Using index" without "Using filesort"

## Validation Checklist

- [ ] Equality columns precede range columns in the index
- [ ] ORDER BY column is last (after all equality and range columns)
- [ ] Range column doesn't block subsequent columns in WHERE (it does block equality after it)
- [ ] No "Using filesort" in EXPLAIN for sorted queries

## Common Failures

### Range column in leading position
Index `(created_at, status)` for query `WHERE created_at > ? AND status = ?`. The index can't use `status` for lookup.

### ORDER BY column not in index
Query sorts by a column not in the index. The database loads all matching rows into memory and sorts them (filesort).

## Decision Points

### Two range columns in one index?
Only the first range column is used for range access. The second range column is used for filtering (not range access). May still be beneficial but less effective.

### IN as equality or range?
IN behaves like multiple equality conditions. The database may transform IN to multiple range scans. Treat as equality for ordering purposes.

## Performance Considerations

Correct ordering reduces the scanned portion of the index. Misordering renders the index useless for range/sort. Always verify with EXPLAIN.

## Security Considerations

Column ordering doesn't affect security. Focus on query pattern alignment.

## Related Rules

- Place equality columns before range columns
- Include ORDER BY column at the end of the index
- Verify no filesort in EXPLAIN

## Related Skills

- Design Composite Indexes with Correct Leftmost Prefix
- Use Covering Indexes for Index-Only Scans
- Apply Composite Index Selectivity Principles

## Success Criteria

- Equality columns correctly positioned before range/sort columns
- ORDER BY satisfied by index order (no filesort)
- EXPLAIN confirms efficient index usage
- Range column does not block subsequent equality lookups
