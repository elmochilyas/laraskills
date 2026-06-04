# HasManyThrough

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships â€” Part 1: Relationship Types
- **Last Updated:** 2026-06-02

## Executive Summary
`HasManyThrough` defines a one-to-many relationship that traverses an intermediate model. The parent model accesses a distant collection of child models via an intermediate model. Unlike `HasOneThrough`, the intermediate-to-target relationship is one-to-many, giving access to multiple target records per parent.

## Core Concepts
- **Three-table chain:** Parent â†’ Intermediate (HasMany) â†’ Target (HasMany). Example: `User` has many `Post`s (via a `Country` intermediate: a country has many users, users have many posts). `Country` has many `Post`s through `User`.
- **Definition syntax:** `return $this->hasManyThrough(Post::class, User::class);` on `Country`. Custom keys: `$this->hasManyThrough(Post::class, User::class, 'country_id', 'user_id', 'id', 'id')`.
- **Foreign keys:** Intermediate table has `{parent}_id` (e.g., `country_id`). Target table has `{intermediate}_id` (e.g., `user_id`).
- **Return type:** A `Collection` of target models. Same return type as `HasMany`.
- **Read-only nature:** Like `HasOneThrough`, this relationship does not support `create()` or `save()`. Writes must go through the intermediate chain manually.

## Mental Models
- **Multi-hop collection:** The parent wants all grandchildren-of-a-kind. `Country` wants all `Posts` written by all its `Users`.
- **Aggregation across a one-to-many chain:** The intermediate is a collection (users), each with its own collection (posts). `HasManyThrough` flattens the nested collections into a single collection.
- **"Has many through many":** Not to be confused with `HasMany` through a `BelongsToMany` pivot. This is a true one-to-many chain via regular foreign keys.

## Internal Mechanics

> **Reference:** 
- Extends `ThroughOneOrMany`. The query joins: `SELECT posts.* FROM posts INNER JOIN users ON users.id = posts.user_id WHERE users.country_id = ?`.
- `getResults()` calls `get()` to return a `Collection` of target models.
- Eager loading uses a single join query: `SELECT posts.* FROM posts INNER JOIN users ON users.id = posts.user_id WHERE users.country_id IN (...parent_keys)`.
- `addEagerConstraints()` applies the `WHERE IN` on the intermediate's parent FK column.
- `match()` groups the target collection by the intermediate's parent FK and attaches the collection to each parent via `setRelation()`.

## Patterns
- **Country has many posts through users:** Country â†’ User â†’ Post. Access posts via `$country->posts`.
- **Team has many achievements through members:** Team â†’ Member â†’ Achievement. Aggregate all team members' achievements.
- **Organization has many invoices through projects:** Org â†’ Project â†’ Invoice. Get all invoices across all projects.
- **Category has many products through subcategories:** Category â†’ SubCategory â†’ Product. Flatten the subcategory product hierarchy.

## Architectural Decisions
- **Read-only constraint:** Same as `HasOneThrough`. No direct `create()` or `save()` support. The parent cannot directly create a target record without specifying which intermediate model to attach it to.
- **When to use vs. nested eager loading:** Use `HasManyThrough` when the intermediate exists purely to scope the target collection. Use nested `load('users.posts')` when the intermediate models themselves are needed.
- **Aggregates:** `withCount('posts')` on a `HasManyThrough` generates a nested subquery counting through the join chain. This is more expensive than a simple `hasMany` count.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Single-query collection across chain | Read-only â€” no create/save | Must create targets through intermediate model |
| Flattens nested hierarchy | Complex subquery for aggregates | Test `withCount` on realistic datasets |
| Clean domain API hiding intermediate | Intermediate FK must be indexed on both tables | Add indexes early in migration design |

## Performance Considerations
- **Join scalability:** The join query `INNER JOIN intermediate ON intermediate.id = target.intermediate_id WHERE intermediate.parent_id IN (...)` scales linearly with parent set size. Index both `intermediate.parent_id` and `target.intermediate_id`.
- **Aggregate cost:** `withCount('posts')` generates a correlated subquery. For 1000 parents, this adds significant query time. Consider caching counts.
- **Pagination:** `$country->posts()->paginate()` works, but the paginated query applies `LIMIT` to the target table after the join. Count queries also join the intermediate table, adding overhead.

## Production Considerations
- **Data integrity:** Deleting an intermediate model orphans the target records unless cascade is configured. Add `ON DELETE CASCADE` on the target's FK to the intermediate.
- **Orphaned targets:** Periodically run `Target::doesntHave('intermediate')->get()` to detect orphaned records.
- **Serialization:** `$country->load('posts')` before API responses. Avoid lazy loading in serialization context.

## Common Mistakes
- **Wrong argument order:** `hasManyThrough(Target::class, Intermediate::class)` â€” target first, intermediate second. Like `HasOneThrough`.
- **Intermediate must be HasMany, not HasOne:** If the intermediate has a `HasOne` relationship to the target, use `HasOneThrough` instead.
- **Assuming the target table has a FK to the parent:** The target table has a FK to the *intermediate* table, not the parent table. This is a common source of confusion.
- **No write support surprise:** Trying `$country->posts()->create(...)` throws an exception.

## Failure Modes
- **Missing intermediate records yield empty collection:** No users in a country â†’ `$country->posts` returns empty `Collection`. This may be surprising if the developer expects an error.
- **Slow queries on large intermediate tables:** The join on `intermediate.parent_id` without an index causes a full scan. Always index this column.
- **Broken chain after intermediate delete:** Deleting an intermediate model without cascading or reassigning targets creates orphaned records.

## Ecosystem Usage
- **Laravel Spark:** Team has many subscription invoices through team members.
- **Multi-tenant apps:** Tenant has many logs through users.
- **Analytics dashboards:** `Organization` has many page views through sites and pages.

## Related Knowledge Units

### Prerequisites
HasMany, BelongsTo, HasOneThrough

### Related Topics
`HasOneThrough` (single-result variant), `HasMany` (direct one-to-many)

### Advanced Follow-up Topics
Aggregating Through Relationships, Nested Eager Loading, Caching Strategies

## Research Notes
- **Source Analysis:** `Illuminate\Database\Eloquent\Relations\HasManyThrough.php` â€” the class is relatively small because the complex join logic lives in `ThroughOneOrMany`. The key difference from `HasOneThrough` is `getResults()` calls `get()` instead of `first()`.
- **Key Insight:** `HasManyThrough` is essentially a `HasMany` that adds one extra join to reach the target table. It is the most query-efficient way to aggregate across a two-level hierarchy.
- **Version-Specific Notes:** Laravel 10 improved the join construction in `ThroughOneOrMany`. Earlier versions had issues with ambiguous column names when the intermediate and target tables had same-named columns.
