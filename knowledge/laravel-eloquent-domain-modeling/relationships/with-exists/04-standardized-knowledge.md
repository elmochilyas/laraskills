# withExists / loadExists — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Aggregate Methods & Relationship Patterns
- **Knowledge Unit:** with-exists
- **ECC Version:** 1.0

## Overview
`withExists()` and `loadExists()` add a boolean `{relation}_exists` attribute indicating whether a related record exists — without loading the related models or counting them. The subquery uses `SELECT 1 ... LIMIT 1` wrapped in a `CASE WHEN EXISTS(...) THEN 1 ELSE 0 END` expression. This is the most efficient way to answer "does this model have at least one related record?" across a result set.

## Core Concepts
- `Post::withExists('comments')` adds `comments_exists` boolean column
- Subquery: `CASE WHEN EXISTS (SELECT 1 FROM comments WHERE comments.post_id = posts.id LIMIT 1) THEN 1 ELSE 0 END`
- `EXISTS` short-circuits on the first matching row — faster than `withCount()` for boolean checks
- `loadExists()` applies the same pattern after parent models are hydrated
- Constraint callables work to filter which related rows count as "existing"
- Nested dot-syntax: `Team::withExists('users.orders')`

## When To Use
- Feature flag checks: does the user have an active subscription?
- Conditional UI rendering: show/hide sections based on relationship existence
- Authorization gates: does the user have the required role/permission?
- Any yes/no question about relationship existence where cardinality doesn't matter
- Presence detection in list views and index pages

## When NOT To Use
- Do NOT use when you need the actual count (use `withCount()`)
- Do NOT use when you need the related models themselves (use `with()`)
- Do NOT use when you need to filter the parent query by existence (use `has()`/`whereHas()`)
- Do NOT use with `withCount()` on the same relation in the same query — redundant

## Best Practices (WHY)
- Use `withExists()` instead of `withCount()` whenever you only need a yes/no answer — halves query time
- Index the foreign key column for optimal `EXISTS` short-circuit performance
- For polymorphic relations, ensure both `morph_id` and `morph_type` are in a composite index
- Use constraint callbacks to define what counts as "existing" (e.g., active subscriptions only)
- Cast the attribute to boolean in your API response for clarity

## Architecture Guidelines
- Prefer `withExists()` over checking `withCount() > 0` in PHP for efficiency
- Combine with `whereHas()` for parent filtering + existence annotation when both are needed
- Use `loadExists()` for conditional existence checks after the initial query
- Cache existence flags for high-traffic endpoints when the underlying data changes infrequently

## Performance
- `EXISTS` is inherently faster than `COUNT(*)` for existence checks — stops scanning after the first match
- Advantage grows with related-table cardinality: for a post with 10,000 comments, `EXISTS` checks 1 row
- Ensure the child table has an index on the foreign key for optimal short-circuit performance
- The `CASE WHEN` wrapper ensures a single scalar result — no row multiplication
- For soft-deleted models, remember to exclude trashed records in the constraint

## Security
- `withExists()` exposes a boolean — no related model data is exposed
- Constraint callbacks follow standard authorization patterns
- The existence flag doesn't leak information beyond what the parent model already exposes

## Common Mistakes
- Using `withCount()` when only a boolean check is needed — wastes database work
- Forgetting that `withExists()` returns `false` for nullable `belongsTo` with no parent
- Applying `withExists()` and `withCount()` on the same relation in the same query — redundant
- Expecting the attribute to be an integer — it is a boolean

## Anti-Patterns
- **withCount for existence**: using `withCount() > 0` when `withExists()` is more efficient
- **Redundant withExists and withCount**: annotating both on the same relation
- **Unindexed FK with EXISTS**: without an index, EXISTS does a full table scan per parent row
- **Missing constraint for soft deletes**: including trashed records in the existence check unintentionally

## Examples
```php
// Basic existence
$users = User::withExists('activeSubscription')->get();
foreach ($users as $user) {
    if ($user->active_subscription_exists) {
        // show premium content
    }
}

// Constrained existence
$posts = Post::withExists([
    'comments' => fn($q) => $q->where('approved', true),
])->get();

// Nested existence
$teams = Team::withExists('users.orders')->get();

// Combined with eager loading
$users = User::withExists(['roles.permissions' => fn($q) => $q->where('name', 'admin')])
    ->with('profile')
    ->get();

// Deferred existence check
$posts = Post::all();
$posts->loadExists('images');

// Conditional rendering in Blade
@if ($user->active_subscription_exists)
    <div>Premium content</div>
@endif
```

## Related Topics
- withCount — COUNT aggregate (use when cardinality matters)
- withSum / withAvg / withMin / withMax — other aggregate subqueries
- whereHas / orWhereHas — filtering by existence (vs annotating)
- Model Attribute Casting — boolean casting

## AI Agent Notes
- Use `withExists()` for boolean checks, not `withCount()` — it's more efficient
- The attribute is a boolean — cast accordingly in API responses
- `EXISTS` short-circuits on first match — no row scan necessary
- Combine with `whereHas()` when you need both filtering and annotation
- For soft-deleted models, add `->whereNull('deleted_at')` in the constraint callback

## Verification
- [ ] `withExists('relation')` adds boolean `{relation}_exists` attribute
- [ ] `EXISTS` subquery short-circuits on first match
- [ ] Constraint callbacks correctly filter existence criteria
- [ ] Attribute is boolean type in model response
- [ ] Index on foreign key enables short-circuit performance
- [ ] `loadExists()` works on already-hydrated collections
- [ ] `false` returned for null/empty relations
