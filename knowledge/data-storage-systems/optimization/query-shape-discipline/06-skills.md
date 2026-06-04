# Skill: Apply Query Shape Discipline

## Purpose
Define explicit query shapes for list vs detail views, ensuring each endpoint loads only the data it needs with appropriate column selection and relationship depth.

## When To Use
- When designing API endpoints
- When creating Eloquent scopes
- When defining API Resource classes

## When NOT To Use
- For single-use queries in admin panels with small datasets

## Prerequisites
- Understanding of eager loading
- Knowledge of API Resource classes and Eloquent scopes

## Inputs
- Endpoint specification with data requirements

## Workflow
1. Define list view requirements: 10-20 items, 1-3 columns, 1 relationship max
2. Define detail view requirements: full row, multiple relationships
3. Create `scopeForList()` with minimal selects and narrow eager loads
4. Create `scopeForDetail()` with full data loading
5. Create separate API Resource classes: `PostListResource` and `PostDetailResource`
6. Apply appropriate scope in each endpoint

## Validation Checklist
- [ ] List and detail views use different query shapes
- [ ] `scopeForList` selects only necessary columns
- [ ] No anti-pattern of reusing a full query for list views
- [ ] API Resources match their view's data requirements

## Common Failures
- Reusing `Post::with('comments', 'author', 'tags', 'likes')` for both list and detail
- No explicit scopes — ad-hoc filtering in controllers
- API Resource that load relationships not in the eager load

## Decision Points
- List views: 2 relationships max, 3-5 columns, no large text fields
- Detail views: all columns, multiple relationships, computed attributes
- Admin indexes: more permissive but still scope-controlled

## Performance
- List view with narrow shape: 2-3 queries, few KB transferred
- Reused full query for list: 5-10 queries, unnecessary data transfer
- Memory and response time difference: 50ms vs 500ms on large tables

## Security
- Narrow column selection prevents accidental data exposure
- Separate resources control attribute visibility per endpoint

## Related Rules
- 4-21-1: Always EXPLAIN Before Optimizing
- 4-21-4: Review And Apply Core Concepts

## Related Skills
- Govern Eager Loading Depth
- Know When to Drop to Query Builder

## Success Criteria
- List and detail views use distinct, optimized query shapes
- Response payload size appropriate for view type
- No over-fetching in list endpoints
