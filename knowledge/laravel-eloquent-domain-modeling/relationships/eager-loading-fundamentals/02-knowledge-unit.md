# Eager Loading Fundamentals

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships
- **Knowledge Unit:** Eager Loading Fundamentals
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Eager loading is the mechanism by which Eloquent loads related models in a controlled number of database queries, preventing the infamous N+1 problem. The `with()` method on query builders, `load()` on collections and models, and `loadMissing()` for conditional loading form the three pillars of eager loading in Laravel. Understanding how Eloquent constructs the eager loading query — the `WHERE IN` clause on foreign keys, the result mapping, and the hydration pipeline — is essential before moving to constrained or nested eager loading patterns.

---

## Core Concepts

The N+1 problem occurs when a loop over parent models lazy-loads a relationship for each iteration, producing 1 query for the parents + N queries for the children. Eager loading collapses this to 2 queries total (1 for parents, 1 for all children). `Model::with('relation')` instructs Eloquent to execute a second query after the primary query, fetching all related models whose foreign keys match the parent models' local keys. The results are then mapped onto the parent collection by matching key values. `load()` does the same but on an already-retrieved collection or model instance. `loadMissing()` only loads the relationship if it hasn't been loaded yet. Eager loading works for any relationship type (hasMany, belongsTo, belongsToMany, morphMany, etc.) — each with slightly different join/query construction.

---

## Mental Models

Think of eager loading as **batch-fetching graph neighborhoods**. Given a set of parent nodes, eager loading grabs all their children (or parents) in one query. The mental image is a breadth-first traversal: you fetch level 0 (parents), then level 1 (direct relationships), then level 2 (nested), etc., each level in its own query. The `with()` call defines which branches of the graph to prefetch. This is fundamentally different from lazy loading, which is depth-first: each time you access a relationship, you descend one edge and pay one query. Eager loading trades query count for query width: fewer round trips but potentially larger result sets.

---

## Internal Mechanics

When `with('relation')` is called on a query builder (`Illuminate\Database\Eloquent\Builder`), the relationship name is stored in `$eagerLoads`. During `Builder::eagerLoadRelations()`, Eloquent iterates the loaded models and calls `match()` on each relationship instance. For a `hasMany` relationship, the eager load query is: `SELECT * FROM {related_table} WHERE {foreign_key} IN ({parent_ids})`. For `belongsTo`, it's `SELECT * FROM {related_table} WHERE {local_key} IN ({parent_foreign_keys})`. For `belongsToMany`, an additional join on the pivot table is constructed. The matched results are attached to each parent via `$model->setRelation('relation', $collection)`. The key mapping is performed by `Relation::getRelationExistenceQuery()`, which adds the appropriate `WHERE IN` constraint. After fetching, `Relation::match()` iterates the parent models and assigns the relevant related records by matching keys. For `belongsTo` and `morphTo`, a dictionary is built keyed by the related model's primary key for O(1) lookup.

---

## Patterns

- **Always eager load in views**: Any Blade template that iterates models and accesses relationships must use `with()` on the controller query to avoid N+1 from the view layer.
- **Nested eager loading**: Use dot notation for nested relationships: `with('posts.comments.author')` loads posts, their comments, and each comment's author in 3 queries (not N+1+1).
- **Multiple relationships**: Pass an array to `with()`: `with(['posts', 'profile', 'roles'])` to eager load unrelated relationships in parallel (separate queries).
- **Conditional eager loading**: Use `loadMissing()` when you're unsure if a relationship is already loaded.
- **Lazy eager loading**: Use `load()` on a collection after initial retrieval when you discover you need a relationship later in the request.

---

## Architectural Decisions

Eloquent's eager loading uses separate queries (one per relationship level) rather than JOIN-based eager loading (which `load()` could theoretically use). This design prioritizes result set size over query count: a JOIN-based approach with a `hasMany` relationship produces duplicated parent rows (one per child), which can be extremely large for collections with many children. The separate-query approach keeps each result set lean and lets the ORM handle the mapping in application memory. The tradeoff is more database round trips (one per relationship type per level) but smaller, more manageable payloads.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Eliminates N+1 — 2 queries instead of N+1 | Always 2+ queries even for single-parent retrieval | For single-model access, lazy loading may be simpler |
| Separate queries avoid row duplication | Higher memory usage for relationship mapping | Large collections with many relationships can use significant RAM |
| Dot notation for nested loading is intuitive | Deep nesting (3+ levels) produces many queries | Each dot-separated level adds its own query |
| `loadMissing()` prevents redundant queries | Developers must track loaded state manually | `loadMissing()` is safer but `load()` is more explicit |

---

## Performance Considerations

Eager loading produces a fixed number of queries independent of result count. For a `with('posts.comments')` on 100 users, the query count is 3 (users, posts, comments). Without eager loading, it's 1 + 100 (posts) + up to 100×avg_posts (comments). The memory cost scales with the total number of related rows: all related models are hydrated into memory. For very large datasets (10,000+ parents with 100+ children each), the memory footprint can exceed PHP's `memory_limit`. Use chunking or cursor-based iteration with selective eager loading for large-scale processing. The `WHERE IN` clause size is bounded by the parent collection size — very large parent sets (>10,000) may hit SQL `max_allowed_packet` limits or query plan degradation.

---

## Production Considerations

Always profile eager loading with Laravel Debugbar or Telescope to verify query count. A common production issue is "implicit N+1" where eager loading is used on the parent query but a nested relationship accessor triggers additional queries. Monitor for unexpected lazy loading with `Model::preventLazyLoading()` in development (Laravel 8+) and enforce it in CI. In production API responses, use `loadMissing()` to avoid double-loading when middleware or form requests may have already loaded relationships. For paginated responses, ensure eager loading happens before pagination to avoid querying on the paginated subset only.

---

## Common Mistakes

- **Eager loading after pagination**: Why it happens: `with()` is called on the paginated builder but the relationship is used outside the paginated loop. Why it's harmful: only the current page's models get the relationship — subsequent variable access triggers lazy loading. Better approach: eager load before pagination, or don't rely on relationships outside the paginated context.
- **Assuming nested eager loading is 1 query**: Why it happens: `with('posts.comments')` is read as "load everything in one query." Why it's harmful: developers are surprised by 3+ queries and think something is wrong. Better approach: understand each dot is a separate query.
- **Using `load()` in a loop**: Why it happens: calling `$model->load('relation')` inside a `foreach`. Why it's harmful: this recreates the N+1 problem — N `load()` calls instead of N lazy loads. Better approach: call `load()` on the collection after the loop, or eager load upfront.
- **Forgetting to eager load in API resources**: Why it happens: the API resource accesses a relationship but the controller query didn't `with()` it. Why it's harmful: each API resource serialization triggers a lazy load. Better approach: eager load in the controller or use `loadMissing()` in the resource's `toArray()`.

---

## Failure Modes

- **Memory exhaustion**: Eager loading millions of related rows tries to hydrate all of them into memory. PHP's memory limit is hit, returning a fatal error.
- **`WHERE IN` clause overflow**: Some databases limit the number of values in an `IN` clause (e.g., SQLite limit is ~999, MySQL does not have a hard limit but performance degrades). Split into batches for very large parent sets.
- **Missing relationship method**: If `with('nonexistent')` is called, Eloquent throws `BadMethodCallException` because the relationship method doesn't exist on the model.
- **Collision on non-standard keys**: If the local key is not the primary key (e.g., a UUID or custom string key), the eager loading query may miss matches if the key type mismatches.

---

## Ecosystem Usage

Every Laravel application uses eager loading. The `with()` method is used in controllers, API resource classes, Nova lenses and actions, Filament tables and forms, Livewire components, and Blade view composers. The `load()` method is the primary way to fetch relationships in tests and during request processing after the initial query. Telescope's "N+1 watcher" detects missing eager loading and recommends `with()` calls.

---

## Related Knowledge Units

### Prerequisites
- Eloquent Relationship Definitions (hasMany, belongsTo, belongsToMany, etc.)
- Query Builder Basics (basic query construction, `get()`, `first()`)

### Related Topics
- constrained-eager-loading (filtering which related models are loaded)
- lazy-eager-loading (loading relationships after the initial query)
- dollar-with-blast-radius (automatic `$with` property and its performance implications)

### Advanced Follow-up Topics
- Eager loading with custom selects and subqueries
- Eager loading serialization (API Resources and lazy loading prevention)
- Query optimization for deeply nested eager loading

---

## Research Notes

### Source Analysis
`Illuminate\Database\Eloquent\Builder::eagerLoadRelations()` at `src/Illuminate/Database/Eloquent/Builder.php`. `Relation::getRelationExistenceQuery()` constructs the subquery or join for eager loading. The `match()` methods are defined per relation type (e.g., `HasOneOrMany::match()`, `BelongsTo::match()`).

### Key Insight
Eager loading is not a query optimization technique — it's a query count normalization technique. It guarantees O(levels) queries rather than O(parents × levels). The actual query execution time may increase (fetching all children at once vs incrementally), but the elimination of round trips and connection overhead makes it faster in almost all practical scenarios.

### Version-Specific Notes
`preventLazyLoading()` was introduced in Laravel 8 as a development-time guard. Laravel 9+ added `Model::preventSilentlyDiscouragingLazyLoading()`. `loadMissing()` has been available since Laravel 5.x. The eager loading mechanics have been stable since Laravel 5.x with no significant changes through Laravel 11.
