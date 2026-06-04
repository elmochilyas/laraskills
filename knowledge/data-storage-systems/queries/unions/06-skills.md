# Skill: Combine Query Results with Union and Union All

## Purpose

Use `union` and `unionAll` to combine results from multiple SELECT queries into a single result set, selecting unionAll for performance when duplicates are acceptable, and union when distinct results are required.

## When To Use

- Optimizing OR conditions that should use separate indexes
- Cross-table searches combining results from different tables with same column structure
- Combining paginated results from multiple sources

## When NOT To Use

- Simple OR conditions that the query builder handles efficiently
- Queries where a single WHERE with OR is sufficient and performant

## Prerequisites

- Understanding of UNION vs UNION ALL semantics
- Knowledge that all combined queries must return the same columns with compatible types

## Inputs

- Multiple query builders targeting related data
- Column structure (must match across all queries)
- Deduplication requirement (union vs unionAll)

## Workflow

1. Build the first query: `$first = DB::table('users')->where('role', 'admin')`
2. Add union: `$first->unionAll($second)` where $second is another query builder instance
3. Apply final ORDER BY and LIMIT to the unioned result (not individual queries)
4. Execute with `->get()`, `->paginate()`, or `->cursor()`

## Validation Checklist

- [ ] unionAll used when duplicates are acceptable (avoids sort+distinct overhead)
- [ ] No ORDER BY in individual queries unless combined with LIMIT
- [ ] Final ORDER BY applied to the entire union result
- [ ] All queries return the same number of columns with compatible types

## Common Failures

### Using union when unionAll suffices
The sort+distinct pass for `union` is expensive. If duplicates are impossible or acceptable, use `unionAll`.

### ORDER BY in individual queries
ORDER BY inside a unioned query is only allowed with LIMIT. Order the entire union result with a final ORDER BY.

## Decision Points

### union vs unionAll?
Use unionAll unless deduplication is semantically required. unionAll is faster and avoids the sort pass.

### Union vs OR condition?
Union allows each subquery to use its own optimal index. OR conditions may not use indexes effectively across multiple columns.

## Performance Considerations

unionAll is significantly faster than union because it avoids the sort+distinct pass. Each subquery in a union can use its own index independently.

## Security Considerations

All union queries use parameter binding automatically. Ensure column types are compatible across all queries to prevent implicit conversion issues.

## Related Rules

- Prefer unionAll over union when duplicates are acceptable
- Apply ORDER BY to the final unioned result, not individual queries
- Ensure column count and types match across all unioned queries

## Related Skills

- Execute Joins with Query Builder
- Build Complex Queries with the Fluent Query Builder
- Apply Where Clause Types for Sargable Queries

## Success Criteria

- unionAll used by default, union only when deduplication is required
- Final ORDER BY on entire union result
- No ORDER BY in individual queries (unless with LIMIT)
- Column structure matches across all combined queries
