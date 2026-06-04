# Metadata

Domain: Data & Storage Systems
Subdomain: Eloquent ORM & Query Builder
Knowledge Unit: 2.2 Relationship types (hasOne, hasMany, belongsTo, belongsToMany, hasManyThrough, hasOneThrough, morphMany, morphToMany, morphedByMany)
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Eloquent relationship types define how models relate to each other in the database. Each type generates specific SQL join patterns and has different hydration and memory characteristics. Choosing the correct relationship type determines query efficiency, data loading strategy, and code clarity.

---

# Core Concepts

- **hasOne/hasMany**: Parent model "has" one or many child models. Child has FK to parent PK. `hasMany` generates `SELECT * FROM children WHERE parent_id IN (...)`.
- **belongsTo**: Child "belongs to" parent. Defines the FK on the child table. Inverse of `hasOne`/`hasMany`.
- **belongsToMany**: Many-to-many relationship via a pivot table. Generates INNER JOIN on pivot table.
- **hasManyThrough/hasOneThrough**: Access distant relations through an intermediate model. Generates multi-table JOIN.
- **morphMany/morphToMany**: Polymorphic relationships where a model belongs to multiple other model types. Uses a `morphable_type` and `morphable_id` column pair.

---

# Mental Models

Relationships define the query shape, not just the data shape. The relationship type determines the SQL JOIN pattern, the number of queries, and how data is hydrated.

---

# Internal Mechanics

- `hasMany` loads children in a single `WHERE parent_id IN (...)` query. Parent IDs are collected from the hydrated parent collection.
- `belongsToMany` fetches pivot table rows first, then fetches related models using the pivot's foreign IDs.
- Polymorphic relationships store the related class name as a string, requiring careful handling during class renaming or refactoring.

---

# Patterns

**Prefer explicit inverse definitions**: Always define the `belongsTo` side explicitly. It enables eager loading from both directions and improves query flexibility.

**belongsToMany with custom pivot**: Use `->withPivot('column')` to access additional pivot table columns. Avoid loading full pivot models when only timestamps are needed.

**Polymorphic sparingly**: Polymorphic relationships complicate indexing (two-column index on type + id) and make schema evolution harder. Use only when genuinely needed.

---

# Architectural Decisions

| Relationship | Use Case | SQL Strategy |
|-------------|----------|-------------|
| hasMany | One-to-many (posts -> comments) | WHERE parent_id IN (...) |
| belongsToMany | Many-to-many (users <-> roles) | JOIN pivot, JOIN target |
| morphMany | Multiple model types share a child (posts/images, users/images) | WHERE type=?, parent_id IN (...) |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Expressive relationship definitions | SQL generation is implicit | Must inspect generated queries for performance
Lazy loading convenience | N+1 risk | Always specify eager loading for hot paths
Polymorphic flexibility | Indexing complexity, schema opacity | Harder to query directly via SQL

---

# Common Mistakes

**Not defining the inverse relationship**: `Comment belongsTo Post` is not defined. You can't eager load `comment->post`. Always define both sides.

**Polymorphic for simple cases**: Using `morphMany` when a `hasMany` with a dedicated FK column would work. Polymorphic adds complexity without benefit.

---

# Related Knowledge Units

2.3 Eager loading | 2.6 Relationship existence filtering | 2.7 Relationship counting
## Ecosystem Usage

Laravel's Eloquent ORM is the dominant PHP ORM in the ecosystem. Community patterns are shared through Laracasts, Laravel News, and open-source packages. Features like eager loading and model events are used in virtually every Laravel project.

## Failure Modes

N+1 query problems occur when relationships are lazy-loaded in loops. Mass assignment vulnerabilities arise when fillable/guarded are misconfigured. Serialization failures happen when models with relationships are queued without proper eager loading. Memory exhaustion occurs with chunking without chunkById.

## Performance Considerations

Eager loading reduces query count from N+1 to 2 queries. chunkById is preferable to chunk for production processing as it avoids offset drift. Subquery selects in addSelect avoid N+1 count queries. lazy() and cursor() use generators to reduce memory for large result sets.

## Production Considerations

Enable preventLazyLoading in production to catch N+1 issues early. Use Telescope or Debugbar to monitor query counts. Set strict mode to catch missing attributes. Configure query logging carefully as enableQueryLog retains queries in memory.

## Research Notes

Laravel 11 introduced new strict mode features. The once() method prevents duplicate relationship loads. Model casting to enums reduces validation code. The community trend is toward lighter models with dedicated action classes.

