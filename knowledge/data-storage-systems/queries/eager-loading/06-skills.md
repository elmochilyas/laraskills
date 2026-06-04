# Skill: Eager Load Relationships to Prevent N+1 Queries

## Purpose

Use `with()` to eager load relationships before iterating model collections, reducing query count from N+1 to 2 queries total, and preventing the performance degradation of lazy loading inside loops.

## When To Use

- Any loop iterating models and accessing their relationships
- API endpoints returning models with related data
- Blade views rendering model collections with related access
- JSON serialization of model trees

## When NOT To Use

- Single model access (N+1 doesn't apply)
- Relationships not accessed during the request
- Collections where only a subset of models need related data

## Prerequisites

- Relationships defined on the models
- Understanding of when N+1 occurs

## Inputs

- Model query
- Relationship names to load
- Nested relationships (e.g., 'posts.comments')

## Workflow

1. Identify all relationships accessed in the loop/view
2. Add `with('relationship')` to the initial query: `User::with('posts')->get()`
3. For nested relationships: `User::with('posts.comments')->get()`
4. For multiple relationships: `User::with(['posts', 'profile'])->get()`
5. Constrain eager loads: `User::with(['posts' => fn($q) => $q->where('published', true)])->get()`
6. Verify the query count: use Laravel Debugbar or DB::listen to confirm 2 queries instead of N+1

## Validation Checklist

- [ ] All relationships accessed in the loop are eager loaded
- [ ] Nested relationships loaded with dot notation
- [ ] Constrained eager loads filter related data
- [ ] Query count verified with Debugbar or DB::listen
- [ ] Lazy loading prevention enabled in non-production

## Common Failures

### Partial eager loading
Some relationships are eager-loaded but one is missed. N+1 still occurs for the missed relationship. Use `Model::preventLazyLoading()` to catch these during development.

### Over-eager loading
Loading relationships that are never used. Each loaded relationship adds a query. Only load relationships that are actually accessed.

## Decision Points

### with() vs load()?
`with()` for eager loading at query time. `load()` for lazy eager loading after the query when relationships are conditionally needed. Prefer `with()` when you know what's needed upfront.

### Constrained vs unconstrained eager loads?
Constrain when only a subset of related records is needed. Use unconstrained when all related records are required for the response.

## Performance Considerations

Eager loading reduces query count but increases data transfer. Over-eager loading (loading relationships not used) wastes memory. Nested eager loads multiply query count but still far better than N+1.

## Security Considerations

Relationships can expose sensitive related data. Ensure serialization only includes necessary relationship data. Use API resources to control relationship exposure.

## Related Rules

- Always eager load relationships in loops
- Enable preventLazyLoading in non-production
- Avoid over-eager loading

## Related Skills

- Define Eloquent Relationship Types
- Lazy Eager Load Relationships
- Count Related Records

## Success Criteria

- All loops accessing relationships use eager loading
- Query count is 2 (one for parent, one for related) instead of N+1
- Lazy loading prevention catches accidental N+1 in development
- No over-eager loading of unused relationships
