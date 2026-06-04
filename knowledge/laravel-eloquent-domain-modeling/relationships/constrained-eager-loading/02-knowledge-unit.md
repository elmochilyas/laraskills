# Constrained Eager Loading

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships
- **Knowledge Unit:** Constrained Eager Loading
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Constrained eager loading filters, orders, and limits the related models that are eager-loaded via `with()`. Instead of loading all related records, you can apply `where` clauses, `orderBy`, `limit`, and column selection to the eager-loading query using a closure-based syntax: `with(['relation' => fn($query) => $query->where(...)])`. This is essential for loading only relevant subsets of large relationship sets, reducing memory usage, and avoiding the overhead of hydrating thousands of unrelated child records.

---

## Core Concepts

The `with()` method accepts an associative array where keys are relationship names and values are closures that receive the relationship's query builder. Inside the closure, any query builder method can be applied: `where`, `whereIn`, `orderBy`, `limit`, `select`, `withCount`, etc. The constraint only affects the eager loading query — it does not affect the parent query or the relationship definition. "Nested constrained loading" applies constraints at different levels of dot-notation: `with(['posts' => fn($q) => $q->where('published', true), 'posts.comments' => fn($q) => $q->limit(5)])`. Column reduction via `select()` on the eager-loading query prevents selecting unnecessary columns from related tables, which is particularly important for tables with large text/JSON columns.

---

## Mental Models

Think of constrained eager loading as **pre-filtering the graph neighborhood before hydration**. Rather than loading all posts for a user and then filtering in PHP, you push the filter into the SQL query. This is analogous to a WHERE clause on a JOIN — you get only the rows that match, reducing both database I/O and application memory. The closure is a **query modifier callback** that intercepts the relationship query before execution, giving you full control over the SELECT statement while preserving Eloquent's automatic key mapping.

---

## Internal Mechanics

When a closure is passed in the `with()` array, Eloquent calls `BelongsToMany::addEagerConstraints()` or the equivalent for other relation types, then invokes the closure with the relation instance (e.g., `HasMany`, `BelongsToMany`) as the argument. The closure operates on the underlying query builder (`Relation::getQuery()`), which returns an `Illuminate\Database\Eloquent\Builder` instance. All query builder methods are available. For nested constraints, the `with()` parsing in `Builder::parseWithRelations()` recursively processes the dot-notated keys, applying closures at each level. The key mechanism: the constraint modifies the eager load query's `WHERE`, `ORDER BY`, `LIMIT`, and `SELECT` clauses before execution. After the query runs, the standard `match()` method distributes results to parent models — constrained results mean some parents may have empty collections for the relationship.

---

## Patterns

- **Loading only active/visible relationships**: `with(['comments' => fn($q) => $q->where('approved', true)])` to load only approved comments.
- **Limiting recent items**: `with(['posts' => fn($q) => $q->latest()->limit(5)])` to load only the 5 most recent posts per user.
- **Column reduction**: `with(['profile' => fn($q) => $q->select('id', 'user_id', 'avatar_url')])` to avoid loading large profile columns.
- **Ordered relationships**: `with(['tags' => fn($q) => $q->orderBy('pivot_sort_order')])` to maintain a custom order from pivot data.
- **Counting with constraints**: `withCount(['comments' => fn($q) => $q->where('approved', true)])` for conditional counts.
- **Nested filtering**: `with(['posts' => fn($q) => $q->where('published', true), 'posts.comments' => fn($q) => $q->where('approved', true)])`.

---

## Architectural Decisions

The closure-based constraint API (introduced in Laravel 5.x) was designed to replace the earlier array-based constraint syntax (`with(['relation' => function($query) {}])`). The closure approach gives developers access to the full query builder API rather than a limited set of constraint methods. Laravel chose this over a dedicated constraint method API (like `withWhereHas()`) to maintain composability: any query builder method works inside the closure. The tradeoff is that the closure syntax can be verbose for simple constraints, and developers unfamiliar with closures may find it intimidating.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Reduces memory by loading only needed rows | Constraint closures can be verbose for simple filters | Extract complex closures into named methods on the model |
| Full query builder API available inside closures | Closures are not reusable across multiple `with()` calls | Create custom query scopes on the related model for reuse |
| Nested constraints work via dot notation | Deep nesting with constraints is hard to read | Break deeply nested with() into multiple load() calls |
| Constraints apply per-parent (through relationship query) | LIMIT without ordering is non-deterministic | Always pair `limit()` with `orderBy()` in constrained loading |

---

## Performance Considerations

Constrained loading's primary benefit is reduced memory: loading 5 recent posts per user instead of 500 significantly reduces hydration overhead. The `LIMIT` clause inside a constraint requires special attention — `limit()` on a `hasMany` eager load does NOT apply per-parent in standard SQL; Eloquent applies the limit globally to the query. For per-parent limits (e.g., "5 most recent posts per user"), you need `limitBy()` (Laravel 8.52+) or a subquery approach. Column reduction via `select()` on the constrained query is a major performance win when related tables have many columns or large text/blob fields, because those columns are never transferred from the database.

---

## Production Considerations

Always validate that constrained loading actually reduces the number of related rows as expected. Use Laravel Debugbar or Telescope to inspect the result set size. For per-parent limiting, use `Relation::limitBy()` or a window function subquery — standard `limit()` applies to the entire query, not per-parent. Column reduction via `select()` on eager loads can break relationship hydration if you omit the foreign key column from the select — always include the relationship's foreign key in the `select()` call. For paginated responses with constrained loading, ensure the constraint doesn't violate the pagination contract (e.g., loading 5 most recent posts per user when the page shows 10).

---

## Common Mistakes

- **Omitting the foreign key from `select()` in column reduction**: Why it happens: selecting only the columns you need but forgetting the foreign key. Why it's harmful: Eloquent can't match related models to parents — all parents get empty collections. Better approach: always include `id`, `foreign_key` in any constrained `select()`.
- **Using `limit()` expecting per-parent behavior**: Why it happens: `limit(5)` in a constrained eager load looks like it limits per parent. Why it's harmful: the limit is global — the first 5 related records across all parents are returned, leaving most parents empty. Better approach: use `limitBy()` (Laravel 8.52+) or window function subqueries.
- **Applying constraints that don't reduce data**: Why it happens: adding a `where` clause that matches 99% of related rows. Why it's harmful: the query still loads nearly all rows, negating the benefit. Better approach: verify constraint selectivity with `toSql()` or `explain()`.
- **Nested constraints without parent constraint**: Why it happens: `with(['posts.comments' => fn($q) => $q->where('approved', true)])` without constraining posts. Why it's harmful: all posts are loaded before filtering comments — the full N+1 is prevented but memory is wasted on all posts. Better approach: constrain both levels if the parent set is large.

---

## Failure Modes

- **Empty parent relationship after constraint**: If a constraint is too aggressive (e.g., `where('deleted_at', null)` on a soft-deleted relationship that has all rows deleted), parent models have empty collections for that relationship — no error, just missing data.
- **Missing key in select breaks hydration**: As noted, omitting the key from `select()` causes all parents to appear to have no related models.
- **Cross-parent limit imbalance**: With global `limit()`, some parents may get all limited rows while others get none, depending on the order of related rows in the database.
- **Constraint closure exception**: If the closure throws an exception, the entire query fails and no related models are loaded for any parent.

---

## Ecosystem Usage

Nova resource fields use constrained eager loading to display limited relationship previews (e.g., "5 most recent comments"). Filament uses constrained loading in table relationship columns to reduce query size. API resources commonly constrain eager-loaded relationships to include only active or published content. Admin panels use column reduction on `users()` relationships to avoid loading password hashes and remember tokens in eager loads.

---

## Related Knowledge Units

### Prerequisites
- eager-loading-fundamentals (core eager loading mechanics)
- Query Builder (where clauses, orderBy, limit, select)

### Related Topics
- lazy-eager-loading (loading constrained relationships after retrieval)
- dollar-with-blast-radius (`$with` property cannot use constraints)
- Nested eager loading with dot notation

### Advanced Follow-up Topics
- Per-parent limiting with window functions (row_number() subqueries)
- Constrained eager loading on pivot attributes (belongsToMany with pivot constraints)
- Dynamic constraints based on parent model attributes

---

## Research Notes

### Source Analysis
`Illuminate\Database\Eloquent\Builder::parseWithRelations()` at `src/Illuminate/Database/Eloquent/Builder.php` processes the `with()` array and applies closures. The closure receives the `Relation` instance, and all method calls on it delegate to the underlying `Builder` via `__call`.

### Key Insight
Constrained eager loading is the single most effective technique for controlling the memory footprint of relationship hydration. A constrained `with()` can reduce memory usage by 10–100× compared to unconstrained loading, with zero additional queries.

### Version-Specific Notes
`limitBy()` was added in Laravel 8.52 for per-parent limits. Before this, developers used raw subqueries or the `third()` package. The closure-based constraint syntax has been available since Laravel 5.3. Column reduction via `select()` inside constraints has been stable since Laravel 5.x.
