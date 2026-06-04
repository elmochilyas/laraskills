# Skill: Govern Eager Loading Depth

## Purpose
Limit eager loading depth and scope to prevent over-fetching and complex multi-JOIN queries.

## When To Use
- When defining API endpoints with relationships
- When reviewing deeply nested `with('a.b.c.d')` calls
- When setting list vs detail view loading patterns

## When NOT To Use
- For admin panels with guaranteed small datasets
- When explicit column selection is unnecessary

## Prerequisites
- Understanding of eager loading
- Knowledge of API resource classes

## Inputs
- Eloquent query with deep `with()` chains

## Workflow
1. Review eager loading depth: `with('user.profile.company.address')`
2. Limit depth: max 2 levels for list endpoints, deeper for detail
3. Narrow selects: `with('comments:id,post_id,body')`
4. Create separate scopes: `scopeWithListRelations()` and `scopeWithDetailRelations()`
5. Use different API Resource classes per view type

## Validation Checklist
- [ ] List endpoints load max 2 relationship levels
- [ ] Narrow column selection on eager loaded relationships
- [ ] Detail endpoints use separate, more complete loading
- [ ] No blind `$model->load('allRelations')` patterns

## Common Failures
- Blind `$model->load('allRelations')` loading every defined relationship
- N+1 within eager loaded relationships (loading nested relation but not its sub-relation)
- Same loading pattern for list and detail views

## Decision Points
- List endpoints: 2 levels max, narrow columns
- Detail endpoints: deeper loading allowed, but with narrow column selection
- Use `scopeWithListRelations` and `scopeWithDetailRelations` scopes

## Performance
- Deep eager loading: more JOINs = more data transferred and higher memory
- Narrow selects: reduces data from storage engine and network
- Separated scopes: prevents over-fetching on list endpoints

## Security
- Narrow column selection prevents accidental data exposure
- Different resources per view control attribute visibility

## Related Rules
- 4-14-1: Always EXPLAIN Before Optimizing
- 4-14-4: Review And Apply Core Concepts

## Related Skills
- Detect and Eliminate N+1 Queries
- Apply Query Shape Discipline

## Success Criteria
- Eager loading depth governed per endpoint type
- Narrow column selection on all relationship loads
- Query count and data volume appropriate for view type
