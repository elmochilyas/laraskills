# Skill: Filter Records by Relationship Existence with has/whereHas

## Purpose

Use `has()` and `whereHas()` to query for records based on relationship existence or relationship conditions — `Post::has('comments')->get()` for posts with at least one comment, or `Post::whereHas('comments', fn($q) => $q->where('approved', true))` for filtered existence.

## When To Use

- Finding records that have (or don't have) related records
- Filtering parent records by conditions on the related model
- Building "exists" queries without raw SQL

## When NOT To Use

- When you need the related data itself (use eager loading)
- Simple FK conditions better expressed with WHERE

## Prerequisites

- Relationship defined on the model
- Understanding of EXISTS SQL clause

## Inputs

- Relationship name
- Existence condition (has or doesn't have)
- Additional constraints on the related model

## Workflow

1. For simple existence: `Post::has('comments')->get()` — posts with >= 1 comment
2. For absence: `Post::doesntHave('comments')->get()` — posts with 0 comments
3. For conditional existence: `Post::whereHas('comments', fn($q) => $q->where('approved', true))->get()`
4. For absence with conditions: `Post::whereDoesntHave('comments', fn($q) => $q->where('spam', true))->get()`
5. For nested existence: `User::whereHas('posts.comments', fn($q) => $q->where('approved', true))->get()`

## Validation Checklist

- [ ] Relationship exists on the model
- [ ] `has()` vs `whereHas()` chosen correctly (with or without conditions)
- [ ] `doesntHave()` used for absence queries
- [ ] Nested dot-notation works for deep relationships

## Common Failures

### Using has() when whereHas() is needed
`has()` doesn't support constraining the related query. If you need conditions on the related model, use `whereHas()`.

### Counting in memory instead of using has()
Loading all posts and filtering those with comments in PHP. Use `has()` to filter at the database level.

## Decision Points

### has() vs whereHas()?
`has()` for simple existence (any related records exist). `whereHas()` when the related records need additional filtering.

### whereHas() vs join?
`whereHas()` generates an EXISTS subquery. JOIN generates a different execution plan. EXISTS is often more efficient for existence checks, especially with LIMIT.

## Performance Considerations

`has()` generates `EXISTS (SELECT 1 FROM ... WHERE ...)` subqueries — efficient for existence checks. `whereHas()` adds WHERE conditions to the subquery. Both can use indexes on the relationship columns.

## Security Considerations

`whereHas()` closures receive a query builder instance. Apply standard SQL injection prevention through parameter binding in the closure.

## Related Rules

- Use has() for relationship existence filtering
- Use whereHas() for conditional existence filtering
- Use doesntHave() for absence filtering

## Related Skills

- Eager Load Relationships
- Query with Where Clauses
- Count Related Records

## Success Criteria

- Existence queries use has()/whereHas() instead of in-memory filtering
- Absence queries use doesntHave()/whereDoesntHave()
- Conditional existence uses whereHas() with proper closure constraints
- Nested existence queries use dot notation correctly
