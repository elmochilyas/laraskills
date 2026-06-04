# Skill: Count Related Records with withCount

## Purpose

Use `withCount()` to retrieve counts of related records in a single query — `Post::withCount('comments')->get()` — avoiding N+1 count queries by calculating counts as subquery selects.

## When To Use

- Displaying counts of related records (comment count, like count)
- Filtering or sorting by relationship count
- Any scenario needing the count but not the related records

## When NOT To Use

- When the related records themselves are needed (use eager loading)
- Simple boolean existence (use `has()` instead)
- Complex aggregations better handled with raw SQL

## Prerequisites

- Relationship defined on the model
- Understanding of subquery selects

## Inputs

- Relationship name to count
- Optional constraint closure

## Workflow

1. Add `withCount('relationship')` to the query: `Post::withCount('comments')->get()`
2. Access the count via `$post->comments_count` attribute
3. For constrained counts: `Post::withCount(['comments' => fn($q) => $q->where('approved', true)])->get()`
4. For multiple counts: `Post::withCount(['comments', 'likes'])->get()`
5. For sorting by count: `Post::withCount('comments')->orderBy('comments_count', 'desc')->get()`

## Validation Checklist

- [ ] Count attribute accessed as `{relation}_count`
- [ ] Constrained counts filter correctly
- [ ] Sorting by count uses the generated attribute
- [ ] No N+1 count queries occur

## Common Failures

### Loading full relationship just for the count
`Post::with('comments')->get()` followed by `count($post->comments)` loads all comment data just for the count. Use `withCount()` to avoid transferring unnecessary data.

### Counting in application code
Collecting all posts and counting comments in a loop: O(N) queries. Use `withCount()` for O(1) query count.

## Decision Points

### withCount() vs loadCount()?
`withCount()` for upfront counting. `loadCount()` for conditional counting after the initial query. Prefer `withCount()` when the count is always needed.

### Count vs exists?
Use `has()` for boolean existence (any comments?). Use `withCount()` when the actual count number matters.

## Performance Considerations

`withCount()` generates a subquery `(SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id)`. This is efficient with proper indexing on the FK column. Each count subquery adds query overhead — avoid withCount on 10+ relationships in one query.

## Security Considerations

Counts can leak information about related data that the user shouldn't see (e.g., counting unpublished comments). Use constrained withCount to filter what's counted.

## Related Rules

- Use withCount() instead of loading relationships just for counting
- Use constrained withCount() for filtered counts
- Avoid excessive withCount() calls in a single query

## Related Skills

- Filter Records by Relationship Existence
- Eager Load Relationships
- Query with Subquery Selects

## Success Criteria

- Related record counts are retrieved with withCount()
- Constrained counts filter related records correctly
- Sorting by count works as expected
- No N+1 count queries in application code
