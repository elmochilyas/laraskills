# Skill: Constrain Eager Loaded Relationships for Filtered Data

## Purpose

Apply constraints to eager loaded relationships using closure-based `with()` syntax to filter, order, or limit related records — `User::with(['posts' => fn($q) => $q->where('published', true)->orderBy('created_at')])` — while keeping the main query separate.

## When To Use

- Loading only a subset of related records (published, recent, active)
- Ordering related records for display
- Limiting the number of related records per parent
- Adding conditional constraints to eager loads

## When NOT To Use

- Loading all related records (unconstrained `with()` is simpler)
- When the constraint should be in the WHERE clause, not the relationship

## Prerequisites

- Relationships defined on the models
- Understanding of `with()` eager loading

## Inputs

- Relationship name
- Constraint closure (where, orderBy, limit)
- Conditional logic for applying constraints

## Workflow

1. Start with the base query: `User::with(['posts' => function ($query) { ... }])->get()`
2. Add WHERE constraints inside the closure: `$query->where('published', true)`
3. Add ORDER BY: `$query->orderBy('created_at', 'desc')`
4. Add LIMIT: `$query->limit(5)` — limits per parent
5. For conditional constraints, use if/else inside the closure or pass parameters
6. Chain multiple constrained relationships as needed

## Validation Checklist

- [ ] Constraint closure filters the related data correctly
- [ ] `limit()` per parent works as expected
- [ ] Nested constrained loads don't cause unexpected empty results
- [ ] Constraints don't accidentally become global scopes

## Common Failures

### Assuming constraints apply globally
Constraints in the `with()` closure only affect the eager load query, not subsequent lazy loads or relationship queries. Each access generates its own query.

### limit() without orderBy
Using `limit(3)` without `orderBy` returns unpredictable rows. Always specify order when limiting.

## Decision Points

### Constrained with() vs lazy load + filter?
Constrained `with()` loads filtered data in one query. Lazy load + filter loads all related data and discards some. Use constrained `with()` when the filter is known at query time.

### Relationship constraint vs global scope?
Relationship constraint for per-query filtering. Global scope for always-applied filters. Prefer relationship constraints to avoid unexpected behavior.

## Performance Considerations

Constrained eager loads reduce data transfer by filtering at the database level. `limit()` per parent prevents loading large collections. Nested constrained loads add query complexity — verify with EXPLAIN.

## Security Considerations

Constraints should not expose filtering logic that reveals data patterns to unauthorized users. Ensure the constraint logic is server-controlled, not user-influenced.

## Related Rules

- Use closure constraints for filtered eager loads
- Specify order when limiting constrained loads
- Prefer constraints over lazy filtering

## Related Skills

- Eager Load Relationships
- Query with Where Clauses
- Define Eloquent Relationship Types

## Success Criteria

- Related data is filtered at query time, not in application code
- `limit()` and `orderBy()` work correctly within constrained loads
- Nested constrained relationships produce correct results
- Lazy load + filter pattern is not used where constrained with() suffices
