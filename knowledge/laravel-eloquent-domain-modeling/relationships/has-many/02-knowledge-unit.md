# HasMany

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships â€” Part 1: Relationship Types
- **Last Updated:** 2026-06-02

## Executive Summary
`HasMany` defines a one-to-many relationship where the parent model owns zero, one, or many child records. The foreign key resides on the child table, referencing the parent's local key. This is the most common Eloquent relationship, used whenever a model aggregates a collection of subordinate records.

## Core Concepts
- **Foreign key convention:** Child table column `{parent}_id` (e.g., `user_id` on `posts`). Local key defaults to parent's `id`.
- **Definition syntax:** `return $this->hasMany(Post::class);` on `User`. Custom keys: `$this->hasMany(Post::class, 'foreign_key', 'local_key')`.
- **Return type:** The dynamic property `$user->posts` returns a `Collection` (lazy-loaded). Absolute access always `null`-safe.
- **Inverse:** The child model defines `belongsTo(User::class)`.
- **Querying differences from `HasOne`:** `has('posts')` checks count > 0. `withCount('posts')` attaches an aggregate. Chunking, cursor iteration, and lazy loading all return collections.

## Mental Models
- **Collection container:** The parent holds a collection of children. Operations like `$user->posts->pluck('title')` operate on the in-memory collection after loading.
- **Query builder proxy:** Method calls on `$user->posts()` (with parentheses) return a `HasMany` builder, allowing chaining: `$user->posts()->where('published', true)->get()`.
- **Aggregate window:** `HasMany` is the backbone for dashboard aggregates, reporting, and list-oriented UIs.

## Internal Mechanics

> **Reference:** 
- `HasMany` extends `HasOneOrMany`. The only override in `HasMany` is `getResults()`, which calls `get()` instead of `first()`. All constraint logic, eager matching, and existence queries are inherited.
- `match()` in `HasOneOrMany` groups children by foreign key and sets the full collection via `$parent->setRelation('posts', $children)`.
- Eager loading performs `WHERE foreign_key IN (...)` and hydrates the full collection into each parent.
- `HasOneOrMany::getRelationExistenceQuery()` generates the correlated subquery for `has()` / `whereHas()`.

## Patterns
- **One-to-many:** `User hasMany Post`, `Team hasMany Member`, `Category hasMany Product`.
- **Self-referential:** `Post hasMany Comment`, `Category hasMany SubCategory`.
- **Ordered children:** `hasMany(Comment::class)->orderBy('created_at', 'desc')` in the definition.
- **Constrained by pivot-like column:** `hasMany(Role::class, 'team_id')->where('active', true)`.

## Architectural Decisions
- **Lazy vs. eager loading strategy:** `HasMany` is the primary source of N+1 problems. Use `$with` for always-needed relations, `load()` for request-specific paths, and `lazy()` or `cursor()` for memory-bound iteration.
- **Pagination:** Never chain `->get()` without limit on unbounded `HasMany`. Use `paginate()`, `simplePaginate()`, or `cursorPaginate()` on the relationship builder.
- **Default ordering:** Define `$this->hasMany(Comment::class)->latest()` if children have a natural order. Avoid ordering by non-indexed columns.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Rich collection API (map, filter, reduce) | N+1 risk on property access | Eager load or use `load()` before iteration |
| Composable query pipeline | Memory overhead for large collections | Use `cursor()` or chunked iteration |
| `withCount` for zero-query aggregates | Ordering defaults may cause confusion | Always specify order explicitly in query |

## Performance Considerations
- **Eager loading with large datasets:** `HasMany` loads all children per parent into memory. For parents with hundreds of children, consider lazy eager loading or pagination on the relationship.
- **`withCount` optimization:** Attaches `SELECT COUNT(*)` as a subquery. Indexed foreign keys make this fast. Avoid `withCount` on unindexed columns.
- **Chunking:** `User::chunk(100)` with `->load('posts')` loads posts for 100 users at a time, keeping peak memory bounded.
- **Cursor vs. chunk:** `cursor()` uses PHP generators (low memory) but holds the connection open longer. `chunk()` is safer for long-running jobs.

## Production Considerations
- **Serialization guard:** `$user->posts` in API responses triggers lazy loading. Use `$user->load('posts')` or append in `$with`.
- **Mass assignment protection:** `$user->posts()->create($data)` respects `$fillable` / `$guarded` on the child model.
- **N+1 detection:** Use Laravel's `once` property or packages like `laravel-n+1` to detect lazy loading in development.

## Common Mistakes
- **Forgetting `()->` for query chaining:** `$user->posts()->where(...)` vs. `$user->posts->where(...)`. The first is a query builder; the second is `Collection::where()`.
- **Unbounded eager loading:** `User::with('posts')->get()` on 10,000 users loads all posts into memory. Use `chunk` or `lazy()`.
- **N+1 in Blade loops:** Accessing `$user->posts` inside a `@foreach($users as $user)` without prior eager loading. Always `->load('posts')` before passing to views.

## Failure Modes
- **Out of memory:** 10k users Ã— 100 posts each = 1M models in memory. Use chunked loading instead.
- **Missing index:** Full table scan on `posts.user_id` for every existence query. Monitor `EXPLAIN` output.
- **Orphaned children:** Deleting a parent without cascading. Add `ON DELETE CASCADE` or handle in model event.

## Ecosystem Usage
- **Laravel Spark:** Uses `HasMany` for team members, subscriptions, and invoices.
- **Laravel Horizon:** Queued jobs and failed jobs are managed via `HasMany` relationships.
- **Laravel Nova:** Resource index pages rely on `HasMany` for relationship fields and lenses.

## Related Knowledge Units

### Prerequisites
HasOne, BelongsTo, Eloquent Collections

### Related Topics
`BelongsTo` (inverse), `HasManyThrough`, `HasOneOfMany`

### Advanced Follow-up Topics
Eager Loading Strategies, Lazy Loading vs. Lazy Eager Loading, Cursor vs. Chunk

## Research Notes
- **Source Analysis:** `Illuminate\Database\Eloquent\Relations\HasMany.php` â€” only 15 lines; the entire class exists to set `getResults()` to `get()`. This demonstrates how Eloquent minimizes duplication through inheritance.
- **Key Insight:** `HasMany` is the most performance-sensitive relationship type because it is the primary source of both N+1 problems and memory exhaustion. Every production system should have eager loading audits.
- **Version-Specific Notes:** Laravel 11 introduced `Model::preventLazyLoading()` in the service provider for strict development environments.
