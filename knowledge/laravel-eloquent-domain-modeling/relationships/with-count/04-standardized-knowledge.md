# withCount / loadCount — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Aggregate Methods & Relationship Patterns
- **Knowledge Unit:** with-count
- **ECC Version:** 1.0

## Overview
`withCount()` and `loadCount()` add a scalar `{relation}_count` attribute to a model without loading the related models themselves. The subquery mirrors the relationship's join and where constraints but returns `COUNT(*)`. This replaces the N+1 anti-pattern of calling `$post->comments()->count()` inside a loop.

## Core Concepts
- `withCount('relation')` appends a correlated subquery: `(SELECT COUNT(*) FROM ...) AS relation_count`
- `loadCount('relation')` applies the same after parent models are hydrated
- Supports dot-syntax for nested counts: `withCount('posts.comments')` → `posts_comments_count`
- Constraint callables filter which rows are counted: `withCount(['comments' => fn($q) => $q->where('approved', true)])`
- Multiple counts in one call: `withCount(['comments', 'likes', 'views'])`
- Count attribute is cast to integer automatically

## When To Use
- Displaying badge counts in list views and index pages
- Dashboard aggregates and reporting summaries
- Any scenario where you need to know "how many?" without loading the actual related models
- Combined with pagination for per-page counts

## When NOT To Use
- Do NOT use when you only need a boolean existence check (use `withExists()` — faster)
- Do NOT use when you need the actual related models (use `with()`)
- Do NOT use `withCount()` on a relationship that is already being eager-loaded (doubles work)
- Do NOT use on unindexed foreign keys — correlated subquery becomes expensive

## Best Practices (WHY)
- Index the foreign key column on the child table — the subquery uses it in the WHERE clause
- Use constraint callbacks to count only relevant subsets: approved comments, active subscriptions
- Prefer `withCount()` over loading the full relation and calling `Collection::count()` in PHP
- Combine with pagination: `Post::withCount('comments')->paginate()` — correct per-page counts
- Use `loadCount()` for conditional count loading after the initial query

## Architecture Guidelines
- Keep `withCount()` calls on the query builder for known aggregates
- Use `loadCount()` for conditional/deferred count loading
- Store frequently-accessed counts in a cache for high-traffic pages
- Combine with `loadMissing()` semantics by checking if the attribute exists before loading

## Performance
- Correlated subquery overhead is bounded by the parent query — one execution per row in the result set
- For result sets under 1,000 rows, overhead is negligible
- `LIMIT` + `OFFSET` naturally bounds the cost — only counted rows are in the result set
- For soft-deleted related models, `withCount()` includes trashed models by default unless constrained
- Each `withCount()` call adds one subquery — multiple counts add multiple subqueries

## Security
- `withCount()` does not expose related model data — only a count scalar
- Constraint callbacks follow the same authorization patterns as `whereHas()`
- Count columns are integers — no injection risk through the count value itself

## Common Mistakes
- Using `withCount()` and expecting the relationship to be loaded — it only loads the count
- Forgetting to constrain the count for soft-deleted or scoped relations
- Applying `withCount()` on a relationship that is already being eager-loaded — doubles work
- Using `->count()` on a collection that already has `withCount()` — unnecessary second query

## Anti-Patterns
- **withCount when you need withExists**: using COUNT when a boolean existence check suffices
- **Loading the whole collection to count it**: `$user->posts->count()` instead of `$user->withCount('posts')`
- **Unindexed foreign key with withCount**: correlated subquery becomes a full table scan per parent row
- **Multiple redundant withCount calls**: counting the same relationship multiple times with different constraints when one suffices

## Examples
```php
// Basic count
$posts = Post::withCount('comments')->get();
foreach ($posts as $post) {
    echo $post->comments_count; // integer
}

// Constrained count
$posts = Post::withCount(['comments' => fn($q) => $q->where('approved', true)])->get();

// Multiple counts
$posts = Post::withCount(['comments', 'likes', 'views'])->get();

// Nested count
$users = User::withCount('posts.comments')->get(); // posts_comments_count

// Conditional loading
$posts = Post::all();
if ($showCounts) {
    $posts->loadCount('comments');
}

// Combined with pagination
$posts = Post::withCount('comments')->paginate(20);

// With constraint and combined with eager loading
$posts = Post::withCount(['comments' => fn($q) => $q->where('approved', true)])
    ->with(['author', 'tags'])
    ->get();
```

## Related Topics
- withSum / withAvg / withMin / withMax — other aggregate subqueries
- withExists — boolean existence variant (more efficient for yes/no)
- Eager Loading Fundamentals — core with() mechanics
- Constrained Eager Loading — applying constraints in subqueries

## AI Agent Notes
- Use `withExists()` instead of `withCount()` when you only need a yes/no answer
- The count attribute is auto-cast to integer — no manual casting needed
- Constraint callbacks work identically to constrained eager loading closures
- For soft-deleted relations, add `->whereNull('deleted_at')` in the constraint if trashed shouldn't count
- Multiple `withCount()` calls add multiple subqueries — monitor EXPLAIN plans

## Verification
- [ ] `withCount('relation')` adds correct `{relation}_count` attribute
- [ ] Constraint callbacks correctly filter counted rows
- [ ] Nested counts produce correct column name (`posts_comments_count`)
- [ ] Count is integer type in the model response
- [ ] Subquery uses index on foreign key (verify via EXPLAIN)
- [ ] `loadCount()` works on already-hydrated collections
