# Skill: Detect and Eliminate N+1 Queries

## Purpose
Identify and fix N+1 query patterns caused by lazy loading relationships in loops.

## When To Use
- When implementing Eloquent queries with relationships
- When reviewing API endpoints or Blade views
- When setting up query monitoring

## When NOT To Use
- When the number of parent rows is guaranteed small (<10)

## Prerequisites
- Understanding of Eloquent relationships
- Knowledge of eager loading (`with()`, `load()`, `loadMissing()`)

## Inputs
- Eloquent query accessing relationships

## Workflow
1. Enable `Model::preventLazyLoading()` in AppServiceProvider
2. Run the request and watch for lazy loading exceptions
3. Identify the relationship causing N+1
4. Add eager loading: `Model::with('relationship')` or `$model->load('relationship')`
5. For hidden N+1s in API resources/accessors: eager load at the query level
6. Verify query count with `DB::getQueryLog()`

## Validation Checklist
- [ ] `preventLazyLoading` enabled in non-production environments
- [ ] No relationship access inside loops without prior eager loading
- [ ] API resources and accessors don't trigger lazy loads
- [ ] Query count per request is proportional to endpoint complexity

## Common Failures
- N+1 in API resources or accessors (invisible from controller)
- Blind eager loading: `with('comments', 'tags', 'author', ...)` even when not needed
- N+1 within eager loaded relationships: `$post->comments->each(fn($c) => $c->likers->count())`

## Decision Points
- Use `with()` for known relationship needs at query time
- Use `load()` for conditional relationship loading
- Use `loadMissing()` to avoid double loading
- Use `withCount()` for counts instead of loading full collections

## Performance
- N+1: 1 + N queries (N = parent rows) — O(N) queries
- Eager loading: 2 queries — O(1) queries regardless of N
- For 100 posts with comments: 101 queries vs 2 queries

## Security
- Lazy loading exceptions don't expose data — only query patterns
- `preventLazyLoading` is safe for development/staging

## Related Rules
- 4-13-1: Always EXPLAIN Before Optimizing
- 4-13-4: Review And Apply Core Concepts

## Related Skills
- Govern Eager Loading Depth
- Detect Lazy Loading
- Enforce Performance Budget in CI

## Success Criteria
- N+1 queries identified and eliminated
- Query count per request within acceptable threshold
- `preventLazyLoading` active in development/CI
