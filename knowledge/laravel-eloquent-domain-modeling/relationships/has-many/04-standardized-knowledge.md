# HasMany — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Part 1: Relationship Types
- **Knowledge Unit:** HasMany
- **ECC Version:** 1.0

## Overview
`HasMany` defines a one-to-many relationship where the parent model owns zero, one, or many child records. The foreign key resides on the child table. This is the most common Eloquent relationship type, forming the backbone of hierarchical data, lists, and aggregates throughout Laravel applications.

## Core Concepts
- Foreign key convention: child table column `{parent}_id`; local key defaults to parent's `id`
- Definition: `return $this->hasMany(Post::class);` on parent; custom keys via extra arguments
- Dynamic property `$user->posts` returns a `Collection`; method call `$user->posts()` returns a `HasMany` builder
- Inverse: child defines `belongsTo(Parent::class)`
- `HasMany` extends `HasOneOrMany` — the only override from `HasOne` is `getResults()` calling `get()` instead of `first()`
- Eager loading groups children by foreign key and hydrates the full collection per parent via `setRelation()`

## When To Use
- One-to-many hierarchies: User→Posts, Category→Products, Team→Members
- Any relationship where a parent aggregates a collection of subordinate records
- List-oriented UIs, dashboards, reporting aggregates
- Self-referential hierarchies: Category→SubCategory, Post→Comments

## When NOT To Use
- Do NOT use when the relationship is many-to-many (use `BelongsToMany` or polymorphic variants)
- Do NOT use for singular relationships where only one child is expected per parent (use `HasOne`)
- Do NOT use when you need to access distant models through an intermediate (use `HasManyThrough`)
- Do NOT use when the child needs to belong to multiple parent types (use polymorphic `MorphMany`)

## Best Practices (WHY)
- Always eager-load `HasMany` relationships in loops to prevent the classic N+1 problem
- Define default ordering in the relationship: `$this->hasMany(Comment::class)->latest()`
- Use `paginate()`, `simplePaginate()`, or `cursorPaginate()` instead of `get()` without limit
- Enable `Model::preventLazyLoading()` in development to catch N+1 early
- Use `chunkById()` or `lazy()` for memory-safe batch processing of large child sets

## Architecture Guidelines
- Add `ON DELETE CASCADE` on the child's foreign key or handle orphan cleanup in model events
- Extract complex relationship queries to local scopes or query objects rather than chaining 20+ methods inline
- Use `withCount()` for aggregate display instead of loading full child collections
- Keep the inverse `BelongsTo` defined on the child model for bidirectional access

## Performance
- `HasMany` is the primary source of N+1 problems and memory exhaustion in Eloquent applications
- Eager loading loads all children per parent into memory — for large datasets, use chunked loading
- `withCount('relation')` attaches a `COUNT(*)` subquery — indexed foreign keys make this fast
- `cursor()` uses PHP generators (low memory) but holds the connection open; `chunk()` is safer for long-running jobs
- Index the foreign key column on the child table for both eager loading and existence queries

## Security
- Ensure child model has `$fillable` / `$guarded` configured when using `$parent->children()->create($data)`
- Validate parent existence before bulk child creation
- Mass assignment protection applies through relationship creation methods

## Common Mistakes
- Forgetting `()->` for query chaining: `$user->posts()` (builder) vs `$user->posts` (collection)
- Unbounded eager loading: `User::with('posts')->get()` on 10,000 users loads all posts into memory
- N+1 in Blade loops: accessing `$user->posts` inside `@foreach($users as $user)` without prior eager loading
- Missing cascade delete — orphaned children accumulate when parents are deleted

## Anti-Patterns
- **Collection in memory, filter in PHP**: loading all children and filtering with Collection methods instead of using `whereHas`
- **HasMany for everything**: using HasMany when the cardinality is actually many-to-many
- **Missing ordering**: relying on unpredictable default ordering for children in list displays
- **Giant unconstrained loads**: `$user->posts()->get()` without `limit()` on users with thousands of posts

## Examples
```php
// Definition
class User extends Model
{
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }
}

class Post extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

// Create children
$user->posts()->create(['title' => 'New Post']);
$user->posts()->createMany([
    ['title' => 'Post One'],
    ['title' => 'Post Two'],
]);

// Eager loading
$users = User::with('posts')->get();

// Existence and count
$usersWithPosts = User::has('posts', '>=', 3)->get();
$users = User::withCount('posts')->get();

// Pagination
$posts = $user->posts()->orderBy('created_at', 'desc')->paginate(20);

// Chunked processing
User::chunkById(100, function ($users) {
    foreach ($users as $user) {
        // process
    }
});
```

## Related Topics
- BelongsTo — inverse of HasMany
- HasOne — singular variant (same parent class)
- HasManyThrough — one-to-many across an intermediate
- Eager Loading Fundamentals — preventing N+1 with HasMany
- withCount — aggregate subquery for HasMany cardinality

## AI Agent Notes
- Always pair HasMany with BelongsTo on the child model
- Use `paginate()` or `cursorPaginate()` on HasMany relationship builders for list endpoints
- When generating controllers with HasMany iteration, always include eager loading
- Prefer `chunkById()` over `chunk()` for stable batched processing
- Remember that HasMany and HasOne share the same parent class — only the result type differs

## Verification
- [ ] Child model defines inverse `belongsTo` relationship
- [ ] `$parent->children` returns a Collection (empty when no children)
- [ ] `Parent::with('children')->get()` executes exactly 2 queries
- [ ] `has('children', '>=', N)` filters correctly
- [ ] Pagination limits query rows and returns correct counts
- [ ] Deleting parent cascades or cleans up children
- [ ] Chunked iteration keeps memory bounded for large datasets
