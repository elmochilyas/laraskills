# Scoped Relationships — Conditional Relation Constraints

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Aggregate Methods & Relationship Patterns
- **Knowledge Unit:** scoped-relationships
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary
Scoped relationships allow defining relationships with pre-applied constraints — default ordering, limiting, where conditions, or complex subqueries — directly in the relationship method. This is achieved by chaining query builder methods on the relation return value (e.g. `$this->hasMany(Comment::class)->where('approved', true)->orderBy('created_at')`). A special variant is `->ofMany()` for `HasOne`/`MorphOne` to define "latest" or "highest" singular relationships (e.g. latest post, most expensive item).

---

## Core Concepts
Any query builder method chain on a relationship definition creates a scoped relationship. The constraints become part of every access to that relationship — both eager and lazy loading. `->ofMany()` creates a "one of many" relationship using a subquery with aggregation (e.g. `latestOfMany('created_at')`). The `->withAttributes()` macro (Spatie, community) or manual `->select()` can attach computed columns to the relation. Scoped relationships are the primary mechanism for domain-specific relation variants.

---

## Mental Models
Think of a scoped relationship as a **pre-programmed filter** — the relationship definition carries not just the FK mapping but also the default constraints that make it useful for a specific domain concept. `latestPost` is not "all posts" — it's "the single most recent post." The constraints are hard-coded into the relationship, making the relationship name the documentation.

---

## Internal Mechanics
When you chain `->where('approved', true)` on `$this->hasMany(Comment::class)`, the `hasMany()` method returns a `HasMany` instance (which extends `Builder`). All subsequent builder calls modify that instance. The constraints are stored in the `Builder`'s `$wheres` array. During relation loading, Eloquent clones this constrained builder and applies it. The `->ofMany()` method uses `getRelationExistenceQuery()` with a `GROUP BY` + aggregate subquery to identify the single "of many" row. It generates a query that joins the parent to a subquery that selects the max/latest row per group.

---

## Patterns
- **Latest relationship**: `$this->hasOne(Order::class)->latestOfMany()` — most recent order
- **Highest value**: `$this->hasOne(Product::class)->ofMany('price', 'max')` — most expensive product
- **Approved comments only**: `$this->hasMany(Comment::class)->where('approved', true)`
- **Ordered collection**: `$this->hasMany(Post::class)->orderBy('published_at', 'desc')`
- **Conditional eager loading**: `User::with(['posts' => fn($q) => $q->where('draft', false)])` — runtime scoping (related but not a defined relationship)

---

## Architectural Decisions
Allowing constraints on relationship definitions is a deliberate design choice to support domain-driven relationship naming. A model can have `comments()` (all), `approvedComments()` (filtered), and `latestComment()` (singular) — each a distinct relationship with its own constraints. This trades relationship proliferation (many methods on the model) for expressiveness. The alternative — applying constraints at query time — is more flexible but less self-documenting.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Self-documenting relationship names | Multiply relationship methods on the model | Models can grow many relationship definitions |
| Constraints applied automatically | Cannot easily access the unconstrained relation | Need a separate relationship for the base set |
| `ofMany` replaces manual subqueries | `ofMany` requires database aggregation support | Not available on all database engines (no JSON support) |
| Works with eager loading | Scoped constraints cannot be overridden at query time | Use callable `with()` constraints for runtime variation |

---

## Performance Considerations
Scoped relationships generate the same SQL as hand-written constraints — no performance penalty. `->ofMany()` uses a correlated subquery with `GROUP BY`, which can be expensive on large datasets. Ensure the ordering column in `latestOfMany()` is indexed. Multiple scoped relationships on the same base table will each generate independent subqueries. Consider database views for complex, frequently-used scoped relationships.

---

## Production Considerations
Scoped relationships are cached in the model's `$relations` array once loaded. Subsequent access returns the cached result — be aware of stale data within a single request. For `ofMany` relationships, the subquery is deterministic only if the ordering column has unique values (ties may produce non-deterministic results). Use `ofMany('id', 'max')` as a tiebreaker. Document scoped relationships clearly — another developer may not expect constraints on a relationship.

---

## Common Mistakes
- Defining a scoped relationship and expecting it to be mutable (the constraints are fixed at definition time).
- Using `latestOfMany()` on a table without a timestamp column.
- Forgetting that scoped relationships are applied during lazy loading too — `$user->comments` always filters.
- Creating deeply nested scoped relationships that generate complex, slow subqueries.
- Expecting `ofMany` to work on `BelongsTo` (it only works on `HasOne`/`MorphOne`).

---

## Failure Modes
- **Non-deterministic `ofMany`**: Ties in the ordering column produce unpredictable results. Always include a tiebreaker column.
- **Unindexed `ofMany`**: The subquery does a full table scan if the grouping/ordering columns are not indexed.
- **Scoped relation name collision**: A scoped relationship name that shadows a method on the model (e.g. `comments()` that actually returns only approved comments).
- **Relationship not refreshable**: After creating a new related model, the scoped relationship's cached result may be incorrect.

---

## Ecosystem Usage
Laravel Cashier uses `latestOfMany('created_at')` for subscription status. Nova uses scoped relationships for resource ordering. Spatie's `laravel-medialibrary` defines scoped relationships for media conversions. Most e-commerce platforms use `ofMany` for "featured product" or "best-selling" relationships.

---

## Related Knowledge Units
### Prerequisites
- HasOne / HasMany / MorphOne / MorphMany definitions
- Query builder chaining fundamentals
- Subquery and aggregate functions understanding

### Related Topics
- has-one-of-many (deep dive on `ofMany` mechanics)
- Relationship query-time constraints (`with()` callbacks)
- Eloquent query scopes (model-level vs relationship-level)

### Advanced Follow-up Topics
- Database-specific `ofMany` optimization (lateral joins vs subqueries)
- Multi-column `ofMany` orderings
- Dynamic scoped relationships via macros

---

## Research Notes
### Source Analysis
`Illuminate\Database\Eloquent\Relations\HasOneOrMany::ofMany()` and `latestOfMany()` at `src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php`. The scoped constraints are standard `Builder` methods chained on the relation instance.
### Key Insight
A scoped relationship is not a different type of relationship — it is the same relation class with pre-applied constraints. The `ofMany()` method is the only exception, using a fundamentally different SQL strategy (subquery with aggregation) to enforce the single-row constraint.
### Version-Specific Notes
- Laravel 8.x+: `ofMany()` and `latestOfMany()` introduced.
- Laravel 9.x+: `oldestOfMany()` added.
- Laravel 10.x+: `ofMany()` supports multiple columns for ordering.
- Laravel 11.x+: Performance optimization — scoped relationship constraints are cloned more efficiently during eager loading.
