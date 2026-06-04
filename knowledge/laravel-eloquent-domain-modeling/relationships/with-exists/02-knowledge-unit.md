# withExists / loadExists — Boolean Existence Checks via Subquery

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Aggregate Methods & Relationship Patterns
- **Knowledge Unit:** with-exists
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary
`withExists()` and `loadExists()` add a boolean `{relation}_exists` attribute indicating whether a related record exists — without loading the related models or counting them. The subquery uses `SELECT 1 ... LIMIT 1` wrapped in a `CASE WHEN EXISTS(...) THEN 1 ELSE 0 END` expression. This is the most efficient way to answer "does this model have at least one related record?" across a result set.

---

## Core Concepts
`Post::withExists('comments')` adds a `comments_exists` boolean column. The subquery performs an existence check — `EXISTS (SELECT 1 FROM comments WHERE comments.post_id = posts.id LIMIT 1)`. This stops scanning as soon as one matching row is found, making it faster than `withCount()` for boolean checks. `loadExists()` applies the same pattern after the parent models are already hydrated. Constraint callables work to filter which related rows count as "existing."

---

## Mental Models
Think of `withExists()` as a **presence detector** — it answers the yes/no question "is there at least one?" as fast as physically possible. Unlike `withCount()` which asks "how many?", `withExists()` short-circuits after the first match. It is the SQL equivalent of `!empty($collection)` at the database level.

---

## Internal Mechanics
Eloquent generates: `(CASE WHEN EXISTS (SELECT 1 FROM comments WHERE comments.post_id = posts.id LIMIT 1) THEN 1 ELSE 0 END) AS comments_exists`. The `Relation::getRelationExistenceQuery()` is called with `self::CONSTRAINT_EXISTS` flag. The `LIMIT 1` is added by the relation's existence query builder. For `BelongsTo`, the subquery scans the parent table. For `MorphTo`, both `morph_type` and `morph_id` are included. The result value is cast to `bool` by Eloquent's attribute casting.

---

## Patterns
- **Feature flags**: `User::withExists('activeSubscription')` — check access without loading the subscription
- **Conditional UI rendering**: `Post::withExists('images')` — show/hide gallery sections
- **Filtering with presence**: Combine with `WHERE` constraints on the parent: `User::withExists('orders')->get()->filter(fn($u) => $u->orders_exists)`
- **Nested existence**: `Team::withExists('users.orders')` — does the team have any user with orders?
- **Constrainted existence**: `User::withExists(['orders' => fn($q) => $q->where('total', '>', 100)])`

---

## Architectural Decisions
Using `EXISTS` over `COUNT(*) > 0` is a deliberate SQL optimization choice. `EXISTS` short-circuits on the first matching row, while `COUNT(*)` must scan all matching rows. The `CASE WHEN EXISTS ... THEN 1 ELSE 0 END` wrapper ensures a single scalar result is returned. This trades marginal query complexity for consistent performance regardless of related-record cardinality.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Fastest possible existence check | Cannot distinguish "has one" from "has many" | Use withCount when cardinality matters |
| Short-circuits on first match | Subquery overhead for each parent row | Acceptable for normal page sizes |
| Boolean return type is unambiguous | Morph existence queries are slightly slower | Polymorphic relations pay a small type-check penalty |
| Works with constrained subqueries | Complex constraints may prevent short-circuit optimization | Ensure constraint columns are indexed |

---

## Performance Considerations
`EXISTS` is inherently faster than `COUNT(*)` for existence checks because the database stops scanning after the first row. This advantage grows with related-table cardinality — for a post with 10,000 comments, `EXISTS` checks one row while `COUNT(*)` checks all 10,000. Ensure the child table has an index on the foreign key (and morph type for polymorphic relations) for optimal short-circuit performance.

---

## Production Considerations
Use `withExists()` instead of `withCount()` whenever you only need a yes/no answer. This halves query time on high-cardinality relations. The `{relation}_exists` attribute is a boolean, safe for JSON API responses. When combining with pagination, the cost scales with the page size, not the total dataset. For soft-deleted models, remember to exclude trashed records in the constraint if they should not count as existing.

---

## Common Mistakes
- Using `withCount()` when only a boolean check is needed, wasting database work.
- Forgetting that `withExists()` returns `false` for `null` relations (e.g., nullable `belongsTo` with no parent).
- Applying `withExists()` and `withCount()` on the same relation in the same query (redundant).
- Expecting the attribute to be a PHP `int` — it is a `bool`.

---

## Failure Modes
- **Unindexed foreign key**: `EXISTS` scans rows until a match is found; without an index, this becomes a full table scan per parent row.
- **Constraint eliminates all rows**: A too-restrictive constraint callback can cause `EXISTS` to always return `false`.
- **Polymorphic type column missing index**: Morph existence checks scan both `morph_type` (string) and `morph_id` (int) — the compound index is essential.
- **Nested existence on missing intermediate**: `withExists('nonexistent.relation')` throws a relation-not-found exception.

---

## Ecosystem Usage
Authorization systems use `withExists('roles.permissions')` to check access. SaaS applications use it for feature entitlement checks. Messaging apps use `withExists('unreadMessages')` for notification badges. Laravel Cashier uses existence checks for subscription status.

---

## Related Knowledge Units
### Prerequisites
- with-count (subquery infrastructure foundation)
- Basic relationship definitions

### Related Topics
- Query Builder `whereExists` / `whereNotExists`
- Model attribute casting for booleans
- with-sum-avg-min-max (sibling aggregate patterns)

### Advanced Follow-up Topics
- `whereHas` / `orWhereHas` vs `withExists` (filtering vs annotating)
- Database-specific `EXISTS` optimization (PostgreSQL vs MySQL)
- Pre-computed `has_*` boolean columns for extreme write-simple workloads

---

## Research Notes
### Source Analysis
`Illuminate\Database\Eloquent\Concerns\QueriesRelationships::withExists()`. Internally calls `getRelationExistenceQuery()` with the exists flag. The `CASE WHEN` wrapper is added in the query builder's `selectSub()` method.
### Key Insight
`withExists()` is not a shortcut for `withCount() > 0`. It uses a fundamentally different SQL construct (`EXISTS` vs `COUNT`), which has different performance characteristics and short-circuit behavior.
### Version-Specific Notes
- Laravel 8+: `withExists()` introduced.
- Laravel 9+: Nested dot-syntax for existence checks.
- Laravel 10+: `loadExists()` added for post-hydration existence checks.
- Laravel 11+: Constraint callbacks optimized to reduce subquery overhead.
