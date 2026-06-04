# withCount / loadCount — Scalar Aggregate Loading

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Aggregate Methods & Relationship Patterns
- **Knowledge Unit:** with-count
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary
`withCount()` and `loadCount()` add a scalar `{relation}_count` attribute to a model without loading the related models themselves. This replaces the N+1 anti-pattern of calling `$post->comments()->count()` inside a loop with a single subquery per relationship. The subquery is added to the `SELECT` clause via `addSelect()`, making it a zero-cost operation relative to loading the full relation.

---

## Core Concepts
`withCount()` accepts one or more relationship names and appends a subquery to the parent query's select. The subquery mirrors the relationship's join and where constraints but returns `COUNT(*)`. The resulting column is aliased as `{relation}_count`. `loadCount()` applies the same logic to an already-hydrated collection via a single subsequent query. Both methods support dot-syntax for nested counts (e.g. `posts.comments`) and callable constraints to filter the counted rows.

---

## Mental Models
Think of `withCount()` as a **badge that appears next to each model** — the count is pinned to the model instance at query time, exactly like a computed column. It is not a relation; it is a read-only scalar annotation. Unlike lazy-loading the relation and calling `->count()` in PHP, the subquery runs once per parent query, not once per parent row.

---

## Internal Mechanics
Eloquent generates a correlated subquery: `(SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id) AS comments_count`. The subquery is added in `Illuminate\Database\Eloquent\Concerns\QueriesRelationships::withCount()`, which delegates to `addSelect()` with a `Relation::getRelationExistenceCountQuery()` call. The relationship's `addConstraints()` method binds the foreign key. For `BelongsTo`, the subquery columns are reversed. For `MorphTo`, the subquery includes both `morph_type` and `morph_id`. The result hydration occurs via `Model::setAttribute()` — the key is cast to integer by the `$casts` map set in `withCount()`.

---

## Patterns
- **Eager-load counts with constraints**: `Post::withCount(['comments' => fn($q) => $q->where('approved', true)])`
- **Multiple aggregates**: `Post::withCount(['comments', 'likes', 'views'])`
- **Nested counts**: `User::withCount('posts.comments')` yields `posts_comments_count`
- **Deferred loading**: `$posts->loadCount('comments')` after the collection is already in memory
- **Combined with pagination**: `Post::withCount('comments')->paginate()` — each page has accurate counts

---

## Architectural Decisions
The decision to embed the count as a subquery rather than a join-and-group approach avoids row multiplication (a LEFT JOIN + GROUP BY would duplicate the parent row for each child). The subquery approach guarantees parent rows are not multiplied and requires no `DISTINCT`. The tradeoff is that subqueries execute per parent row, which is acceptable for normal page sizes but can degrade on very large datasets (10k+ parent rows) where aggregate JOINs may outperform.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| No N+1 count queries | Subquery runs per parent row in SQL | Acceptable for normal page sizes; degrades at 10k+ rows |
| Count is a scalar, not a collection | Subquery can't be reused for other aggregates | Need separate `withCount` calls for different aggregates |
| Composable with query builder | Adds complexity to generated SQL | EXPLAIN output is harder to read |
| Works with all relationship types | Morph relationships require polymorphic subquery overhead | Slightly slower than simple FK relationships |

---

## Performance Considerations
The subquery overhead is bounded by the parent query — one correlated subquery execution per row in the result set. For result sets under 1,000 rows, the overhead is negligible. For larger sets, ensure the subquery's WHERE clause can use an index (typically the child table's foreign key index). Use `DB::enableQueryLog()` to inspect the generated SQL. The subquery is added to every selected row, so `LIMIT` + `OFFSET` naturally bounds the cost.

---

## Production Considerations
`withCount()` is safe to use in API responses, list views, and dashboards. The count attribute is cast to integer. If the relationship name contains underscores, the count column follows the same convention. For soft-deleted related models, `withCount()` includes trashed models by default — use `->whereNull('deleted_at')` in the constraint callback to exclude them. Cache the count attribute if it is displayed on a high-traffic public page.

---

## Common Mistakes
- Using `withCount()` and expecting the relationship to be loaded (it only loads the count, not the models).
- Forgetting to constrain the count for soft-deleted or scoped relations.
- Applying `withCount()` on a relationship that is already being eager-loaded — both the relation and the count will be fetched, doubling work.
- Using `->count()` on a collection that already has `withCount()` (unnecessary second query).

---

## Failure Modes
- **Subquery timeout**: Correlated subquery on an unindexed foreign key can cause a full table scan per parent row.
- **Column name collision**: If a model already has a `{relation}_count` attribute, `withCount()` silently overwrites it.
- **Morph alias collision**: Two polymorphic relations with the same alias but different types may produce ambiguous column references.
- **Count mismatch on paginated filtered results**: `withCount()` counts rows before the `WHERE` clause of constraints is applied correctly if the constraint references the parent query.

---

## Ecosystem Usage
Laravel's own Nova, Telescope, and Forge dashboards use `withCount()` to display related resource counts in index views. Spatie's `laravel-medialibrary` uses it for media count display. Most admin panels and CMS index pages rely on it for badge-style counters.

---

## Related Knowledge Units
### Prerequisites
- Basic relationship definitions (hasMany, belongsTo, morphMany)
- Query builder subquery fundamentals
- Eager loading basics (with, load)

### Related Topics
- with-sum-avg-min-max (sibling aggregate pattern)
- with-exists (boolean variant of scalar aggregate)
- Advanced Subqueries (raw subquery columns in select)

### Advanced Follow-up Topics
- Subquery performance tuning across SQL engines
- Custom aggregate macros using `withCount()` internals

---

## Research Notes
### Source Analysis
`Illuminate\Database\Eloquent\Concerns\QueriesRelationships::withCount()` at `src/Illuminate/Database/Eloquent/Concerns/QueriesRelationships.php`. The method builds a `RelationExistenceQuery` and adds it via `addSelect()`.
### Key Insight
The count subquery uses the exact same constraint logic as the relationship's existence query, differing only in the aggregate function (`COUNT(*)` vs `1`). This guarantees the count is always in sync with the relation definition.
### Version-Specific Notes
- Laravel 8+: `withCount()` on nested relations (dot syntax) introduced.
- Laravel 9+: Callable arguments support multiple constraints.
- Laravel 10+: `loadCount()` on a single model instance supported.
- Laravel 11+: Performance improvements in subquery generation for `MorphTo`.
