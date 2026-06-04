# BelongsTo

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships â€” Part 1: Relationship Types
- **Last Updated:** 2026-06-02

## Executive Summary
`BelongsTo` is the inverse side of a `HasOne` or `HasMany` relationship. The model that defines `belongsTo` holds the foreign key column that references the parent's local key. It is the only relationship type where the defining model's table carries the foreign key pointing to the related model's table.

## Core Concepts
- **Foreign key convention:** The defining model's table contains `{related}_id` (e.g., `user_id` on `posts`). The related model's table provides the local key (defaults to `id`).
- **Definition syntax:** `return $this->belongsTo(User::class);` on `Post`. Custom keys: `$this->belongsTo(User::class, 'foreign_key', 'owner_key')`.
- **Return type:** The dynamic property `$post->user` returns a single model instance (or `null`). Method calls return a `BelongsTo` builder.
- **Default foreign key name:** Eloquent uses `snake_case` of the class basename + `_id`. For `User::class`, the default is `user_id`.
- **Inverse method:** The parent model defines `hasOne` or `hasMany` to complete the bidirectional pair.

## Mental Models
- **Pointer / reference:** The foreign key on `posts` table acts like a pointer to the `users` table. `BelongsTo` dereferences that pointer to a model instance.
- **Child-to-parent navigation:** `BelongsTo` is always on the "child" side. The child belongs to a single parent. The parent may have many children.
- **Required vs. optional:** The foreign key may be nullable, making the relationship optional. A `null` foreign key results in `null` returned from the dynamic property.

## Internal Mechanics

> **Reference:** 
- `BelongsTo` does NOT extend `HasOneOrMany`. It extends `Relation` directly. This is because the foreign key is on the *defining* model, not the related model.
- `addEagerConstraints()` uses `WHERE {$this->ownerKey} IN (...parent_keys)` on the related table. The constraint is on the *related* model's key column.
- `match()` iterates the child models, looks up the parent by matching the child's foreign key to the parent's local key, and calls `$child->setRelation('user', $parent)`.
- `associate()` and `dissociate()` are unique to `BelongsTo`. `associate($model)` sets the foreign key on the child without saving. `dissociate()` sets it to `null`.
- `getResults()` calls `first()` via the parent match logic.

## Patterns
- **Post belongsTo User:** The most common pattern in blog/CMS systems.
- **Comment belongsTo Post:** Multi-level hierarchy.
- **Nullable belongsTo:** `Post belongsTo User` where `user_id` is nullable for guest posts.
- **Self-referential:** `Comment belongsTo Comment (parent_id)` for threaded comments.
- **Aliased relationship:** `$post->belongsTo(User::class, 'author_id')` when the foreign key doesn't match convention.

## Architectural Decisions
- **Cascade vs. restrict:** `ON DELETE CASCADE` on the child's foreign key is standard. If children should persist when the parent is deleted (e.g., logs), make the FK nullable or handle in application code.
- **Required validation:** Always validate that the parent exists before associating. `$request->validate(['user_id' => 'required|exists:users,id'])`.
- **Ownership checks:** `$post->user->is($request->user())` for authorization. Use `BelongsTo` relationships in policies via `$post->user_id === $user->id` for direct key access.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Simple, fast foreign key lookup | Must validate parent existence manually | Add `exists` validation rules |
| `associate`/`dissociate` for easy reassignment | Multiple queries per dissociate | Use `update` directly when possible |
| Supports nullable foreign keys | Null FK may indicate orphan | Audit nullable FKs periodically |

## Performance Considerations
- **Eager loading:** `BelongsTo` eager loading queries the parent table with `WHERE id IN (...child_foreign_keys)`. Very efficient with primary key index.
- **N+1 risk:** Accessing `$post->user` in a loop is the classic N+1. Always `->load('user')` or `->with('user')`.
- **Foreign key index:** The column on the child table (e.g., `posts.user_id`) should be indexed for joins and where clauses.

## Production Considerations
- **Authorization:** Check `$post->user_id` directly instead of loading the relationship for gate checks. This avoids a query.
- **Touch timestamps:** `protected $touches = ['user']` on the child model updates the parent's `updated_at` when the child changes.
- **Eager loading defaults:** Add `$with = ['user']` on the child if the parent is almost always needed in the same request.

## Common Mistakes
- **Reversing the direction:** Defining `belongsTo` on the model that does NOT have the foreign key. The `belongsTo` model MUST have the foreign key column.
- **Missing foreign key in `create()`:** Using `Post::create($data)` without setting `user_id`. Use `$user->posts()->create($data)` to auto-associate.
- **Confusing `belongsTo` with `hasOne`:** `belongsTo` = foreign key on this model's table. `hasOne` = foreign key on the other model's table.

## Failure Modes
- **Orphaned child:** Foreign key points to a deleted parent. Caused by missing `ON DELETE CASCADE` or application-level deletion. Detect via `LEFT JOIN WHERE parent IS NULL`.
- **Null pointer access:** `$post->user->name` when `user_id` is nullable. Always guard: `$post->user?->name` (PHP 8+ nullsafe).
- **Wrong foreign key detection:** Eloquent guesses `user_id` from `User::class`. If the column is `author_id`, the relationship name must match: `belongsTo(User::class, 'author_id')`.

## Ecosystem Usage
- **Laravel Breeze / Jetstream:** `TeamUser` (pivot) uses `BelongsTo` for both `user` and `team`.
- **Laravel Horizon:** `HorizonJob` uses `BelongsTo` for queue references.
- **Laravel Telescope:** `TelescopeEntry` belongs to tagged models in monitoring contexts.

## Related Knowledge Units

### Prerequisites
HasOne, HasMany, Migration Foreign Keys

### Related Topics
`HasOne` / `HasMany` (inverse), `BelongsToMany` (many-to-many variant)

### Advanced Follow-up Topics
Polymorphic `MorphTo`, Model Events, Authorization Policies

## Research Notes
- **Source Analysis:** `Illuminate\Database\Eloquent\Relations\BelongsTo.php` is fundamentally different from `HasOneOrMany` â€” it is the only relationship that keeps the foreign key on the defining model. The `associate()` and `dissociate()` methods are unique to this class.
- **Key Insight:** The naming is confusing: `BelongsTo` refers to the model's relationship *to the parent*, not the parent's relationship to it. Always remember: the model with the foreign key `belongsTo`.
- **Version-Specific Notes:** Laravel 11 added `Relation::enforceMorphMap()` but did not change `BelongsTo` semantics. The `foreignKey()` method was deprecated in favor of `getForeignKeyName()`.
