# Skill: Avoid Eloquent Anti-Patterns

## Purpose
Identify and fix common Eloquent performance anti-patterns: nested `whereHas` chains, broad `orWhereHas`, sorting by related columns, and repeated aggregate subqueries.

## When To Use
- When reviewing Eloquent queries for performance
- When `whereHas` generates deeply nested EXISTS subqueries
- When orderBy references a related column

## When NOT To Use
- For simple queries with no performance concerns

## Prerequisites
- Understanding of Eloquent relationship queries
- Knowledge of subquery optimization

## Inputs
- Eloquent query with potential anti-patterns

## Workflow
1. Review `whereHas` depth — chains over 2 levels deep need simplification
2. Check for repeated `withCount` calls — consolidate into `addSelect` subqueries
3. Identify `orderBy` on related columns — requires JOIN or denormalization
4. Check polymorphic queries for missing composite indexes
5. Refactor anti-patterns and verify with EXPLAIN

## Validation Checklist
- [ ] `whereHas` chains limited to 2 levels
- [ ] Repeated `withCount` consolidated where possible
- [ ] Sorting by related columns uses proper JOIN or denormalization
- [ ] Polymorphic columns have composite index on `(type, id)`

## Common Failures
- Deep `whereHas('a.b.c')` — generates nested EXISTS that are hard to optimize
- `Post::withCount('comments')->withCount('likes')->withCount('shares')` — three subqueries
- `Post::orderBy('author.name')` — requires JOIN or subquery

## Decision Points
- Deep whereHas: replace with JOIN or denormalize the filtered column
- Repeated aggregates: use `addSelect` with single subquery or denormalize
- Sort by related: add denormalized column or use JOIN with index

## Performance
- Nested whereHas: correlated subqueries execute per outer row
- Repeated withCount: multiple subqueries in SELECT — each is a separate scan
- Sort by related: requires JOIN — ensure joined column is indexed

## Security
- No direct security implications
- Denormalized columns require write sync logic

## Related Rules
- 4-22-1: Always EXPLAIN Before Optimizing
- 4-22-4: Review And Apply Core Concepts

## Related Skills
- Apply Query Shape Discipline
- Optimize Subqueries

## Success Criteria
- Anti-patterns identified and refactored
- Query count and complexity reduced
- EXPLAIN confirms efficient execution
