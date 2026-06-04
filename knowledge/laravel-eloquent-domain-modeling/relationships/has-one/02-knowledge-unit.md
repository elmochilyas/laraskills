# HasOne

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships â€” Part 1: Relationship Types
- **Last Updated:** 2026-06-02

## Executive Summary
`HasOne` defines a one-to-one relationship where the foreign key resides on the related table. It is the inverse of `BelongsTo`. The owning model (parent) references a single child row via a foreign key on the child table. This is the most constrained cardinality in Eloquent: exactly zero or one related record per parent.

## Core Concepts
- **Foreign key convention:** The child table contains a column named `{parent}_id` (e.g., `user_id` on `profiles`). The local key defaults to the parent's primary key (`id`).
- **Definition syntax:** `return $this->hasOne(Profile::class);` on the `User` model. Custom keys: `$this->hasOne(Profile::class, 'foreign_key', 'local_key')`.
- **Inverse:** The child model defines `belongsTo(User::class)` to complete the bidirectional relationship.
- **Querying:** `has('profile')` filters parents with at least one child; `whereHas('profile', $closure)` constrains the child query. `with('profile')` eager loads. `doesntHave('profile')` filters parents lacking the relation.
- **Nullability:** If no child exists, the dynamic property returns `null`. Method calls (e.g., `$user->profile()->where(...)`) always return a `HasOne` builder instance.

## Mental Models
- **Database row ownership:** The parent model "has one" of something. The child table carries the foreign key, making the child belong to the parent. The arrow of ownership points from parent to child.
- **Singleton relationship:** Only one child is ever expected. If more than one child exists, Eloquent silently returns the first matching row (ordered by child's primary key ascending). This is a data integrity risk if the constraint is not enforced at the database level.
- **Composition root:** Use `HasOne` when modeling domain concepts where the child cannot logically exist without the parent (e.g., User has one Profile, Order has one Invoice). The lifecycle of the child is tied to the parent.

## Internal Mechanics

> **Reference:** 
- `HasOne` extends `HasOneOrMany`, which extends `Relation`. The key method `getResults()` calls `first()` on the builder, limiting to a single record.
- `match()` performs the in-memory hydration: it iterates the parent collection, groups child models by the foreign key value, and attaches the first child via `$parent->setRelation('profile', $child)`.
- `addEagerConstraints()` constrains the query with `WHERE foreign_key IN (...parent_keys)`.
- `getRelationExistenceQuery()` adds a `WHERE` clause matching the foreign key to the parent's local key for subquery exists checks.

## Patterns
- **Profile pattern:** `User::hasOne(Profile::class)` â€” user settings, avatars, extended metadata.
- **Single-child aggregate:** `Order::hasOne(Invoice::class)` â€” exactly one invoice per completed order.
- **Self-referential:** `User::hasOne(User::class, 'referrer_id')` â€” single referral relationship.
- **One-to-one via intermediate:** Combine with `HasOneThrough` when the chain passes through another table.

## Architectural Decisions
- **Unique constraint enforcement:** Eloquent does not enforce uniqueness. Application-level validation or a database `UNIQUE` constraint on the foreign key column is required to guarantee true one-to-one integrity.
- **Cascade vs. nullify:** `$model->profile()->delete()` only deletes the child via the query builder; it does not cascade from the parent unless the child model's `deleting` event or database foreign key `ON DELETE CASCADE` is configured.
- **Lazy vs. eager:** Accessing `$user->profile` triggers a lazy query (N+1). Default to eager loading in serialization contexts (`$with` property on the parent model).

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Simple, intuitive API | No built-in uniqueness enforcement | Must add DB unique constraint or handle duplicates in app code |
| Composable with query builder | N+1 risk on property access | Always eager load in loops |
| Lazy hydration via `setRelation` | Single-row expectation may mask data issues | Periodic data integrity audits recommended |

## Performance Considerations
- **Eager loading overhead:** `HasOne` eager loading uses a single `WHERE IN` query. For very large parent sets, chunking is recommended.
- **Subquery exists:** `has('profile')` generates `WHERE EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = users.id)`. This scales linearly with index usage but can be slow on unindexed foreign keys.
- **Indexing:** Always index the foreign key column on the child table. Without it, both eager loading and exists queries become full table scans.

## Production Considerations
- **Race conditions:** Concurrent inserts without a unique constraint can create duplicate children. Use `firstOrCreate()` or `updateOrCreate()` with unique constraints to prevent.
- **Serialization:** `$user->load('profile')` before API responses to avoid lazy loading in serialization context.
- **Soft deletes:** If the child uses `SoftDeletes`, the relation automatically excludes soft-deleted records. Use `->withTrashed()` to include them.

## Common Mistakes
- **Assuming uniqueness without constraint:** Relying on application logic only. Always add a database `UNIQUE` constraint on the foreign key column.
- **Confusing direction:** Putting `hasOne` on the child model instead of `belongsTo`. The child always uses `belongsTo`; the parent always uses `hasOne`.
- **Missing inverse:** Defining `hasOne` without `belongsTo` breaks bidirectional access and prevents the child from referencing the parent.

## Failure Modes
- **Duplicate children:** Multiple child rows exist; `hasOne` silently returns the first by primary key order. Detectable via periodic `GROUP BY/Having COUNT(*) > 1` queries.
- **Missing foreign key index:** `WHERE foreign_key IN (...)` scans the child table. Monitor slow query logs.
- **Orphaned children:** Deleting the parent without cascading leaves orphaned rows. Use database foreign key `ON DELETE CASCADE` or model events.

## Ecosystem Usage
- **Laravel Jetstream / Fortify:** Uses `HasOne` for profile and team ownership relationships.
- **Laravel Cashier:** Subscription models use `HasOne` for single active subscription references.
- **Laravel Nova:** Resource tools and lenses leverage `HasOne` for detail panel relationships.

## Related Knowledge Units

### Prerequisites
Eloquent Model Basics, Query Builder, Database Migrations

### Related Topics
`BelongsTo` (inverse), `HasMany` (one-to-many variant), `HasOneThrough`

### Advanced Follow-up Topics
Polymorphic Relationships, Eager Loading Strategies, Model Events

## Research Notes
- **Source Analysis:** `Illuminate\Database\Eloquent\Relations\HasOne.php` â€” the class is a thin wrapper over `HasOneOrMany` that overrides `getResults()` to call `first()` instead of `get()`.
- **Key Insight:** `HasOne` and `HasMany` share the same parent class. The only behavioral difference is collection vs. model return type. This means eager loading, constraints, and existence queries are identical between the two.
- **Version-Specific Notes:** Laravel 8+ introduced `HasOneOfMany` for "latest" or "oldest" of a one-to-many relationship, which uses a different mechanism (subquery join).
