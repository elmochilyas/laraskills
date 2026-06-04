# Anti-Patterns: HasMany

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Part 1: Relationship Types
- **Knowledge Unit:** HasMany

## Anti-Patterns

### N+1 in Loops
Accessing `$user->posts` inside a loop without eager loading. This is the classic N+1 problem — one query per parent model, and the single most common performance issue in Laravel applications.

**Problem:** N+1 query explosion, degraded response times, excessive database load.

**Solution:** Always eager-load with `with()` before iterating: `User::with('posts')->get()`.

### Collection in Memory, Filter in PHP
Loading all children and filtering with Collection methods (`->filter()`, `->contains()`) instead of using `whereHas` at the database level. This wastes memory and CPU hydrating models that are immediately discarded.

**Problem:** Memory exhaustion, slow processing, unnecessary data transfer from database.

**Solution:** Use `whereHas()` for database-level filtering: `User::whereHas('posts', fn($q) => $q->where('active', true))`.

### Giant Unconstrained Loads
Calling `$user->posts()->get()` without `limit()` or `paginate()` on users with thousands of children. This loads all child records into memory, potentially exhausting PHP memory.

**Problem:** Memory exhaustion, slow page loads, application crashes on large datasets.

**Solution:** Use `paginate()`, `simplePaginate()`, or `cursorPaginate()` to bound memory usage.

### Loading Full Models Just to Count
Using `$user->posts->count()` instead of `withCount('posts')`. Loading full child model instances just to count them wastes memory and bandwidth on hydrating objects that are immediately discarded.

**Problem:** Memory bloat, slow queries, unnecessary model hydration.

**Solution:** Use `withCount('posts')` — adds a `COUNT(*)` subquery with zero model hydration.

### Missing Cascade Delete
Deleting a parent without cascading to children or handling cleanup in model events. Leaves orphaned children with foreign keys pointing to non-existent parents.

**Problem:** Orphaned child records, foreign key constraint violations, data integrity corruption.

**Solution:** Add `->cascadeOnDelete()` on the child's FK or handle in model events.

### Missing Inverse BelongsTo
Defining `HasMany` on the parent without defining the inverse `BelongsTo` on the child. The child cannot navigate back to its parent.

**Problem:** Incomplete domain model, workarounds that add query overhead.

**Solution:** Always define the inverse `BelongsTo` on the child model.

### Missing Default Ordering
Defining `HasMany` without default ordering when display order matters. Children are returned in unpredictable order (typically by primary key), causing inconsistent display across requests.

**Problem:** Inconsistent display order, confusing user experience, hard-to-reproduce bugs.

**Solution:** Add default ordering in the relationship: `$this->hasMany(Comment::class)->latest()`.

### Unbounded Eager Loading
Using `User::with('posts')->get()` on 10,000 users, loading all posts into memory. Each eager-loaded relationship hydrates every related model for every parent, causing memory exhaustion.

**Problem:** Memory exhaustion, application crashes in batch jobs and large queries.

**Solution:** Use `chunkById()` or `lazy()` for memory-safe batch processing of large parent sets.
