# Polymorphic (MorphOne / MorphMany)

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships â€” Part 1: Relationship Types
- **Last Updated:** 2026-06-02

## Executive Summary
Polymorphic relationships (`MorphOne` and `MorphMany`) allow a model to belong to multiple other model types using a single association table. Instead of separate foreign key columns for each possible parent type, a polymorphic relationship uses a combination of a foreign key ID column and a type column (morph) to identify the parent. This enables a single model (e.g., `Image`) to be associated with `User`, `Post`, or `Product` without schema changes.

## Core Concepts
- **Morph columns:** The child table contains `{relationship}_id` (integer) and `{relationship}_type` (string). Convention: `imageable_id` and `imageable_type` for an `Image` model.
- **Definition syntax on parent:** `return $this->morphOne(Image::class, 'imageable');` for one-to-one. `return $this->morphMany(Image::class, 'imageable');` for one-to-many.
- **Definition syntax on child (inverse):** `return $this->morphTo();` â€” no model argument needed. Eloquent resolves the parent class from the `*_type` column.
- **Morph map:** `Relation::morphMap(['user' => User::class])` replaces fully-qualified class names with short aliases in the `*_type` column.
- **Return type:** `MorphOne` returns a single model (or null). `MorphMany` returns a `Collection`.

## Mental Models
- **Universal attachment system:** An image can be attached to any entity without creating separate `user_images`, `post_images`, `product_images` tables. The `imageable_type` column records which entity type owns the image.
- **Type discriminator column:** The `*_type` column acts like a Ruby-on-Rails-style polymorphic join. It tells Eloquent which table to join and which model class to instantiate.
- **Reverse polymorphic:** `morphTo()` on the child is the inverse of both `morphOne` and `morphMany`. It automatically resolves the parent type at runtime using the type column value.

## Internal Mechanics

> **Reference:** 
- `MorphOne` extends `HasOneOrMany` via `MorphOneOrMany`. The key difference from `HasOne` is that `addEagerConstraints()` adds `WHERE {morph}_type = 'App\Models\User'` in addition to the FK `IN (...)` constraint.
- `MorphTo` is the inverse. `match()` iterates child models, groups them by `*_type`, eagerly loads each parent type in a separate query (`WHERE id IN (...child_keys)`), and attaches the correct parent to each child.
- `morphMap()` is stored in `Relation::$morphMap`. When resolving, `MorphTo` checks the map first; if no map entry exists, it assumes the type column contains a fully-qualified class name.
- Eager loading `MorphTo` fires one query per unique parent type. If 100 `Image` records have 50 `User` parents and 50 `Post` parents, two queries are executed.

## Patterns
- **Images/attachments:** `Image morphTo imageable`. Used by `User`, `Post`, `Product`.
- **Comments:** `Comment morphTo commentable`. Forum posts, articles, and wiki pages all accept comments.
- **Likes / reactions:** `Like morphTo likeable`. Posts, comments, and media can all be liked.
- **Activity logs:** `Activity morphTo subject`. Track actions on various entity types.
- **Tags (polymorphic):** `Taggable morphs`. A tag can apply to posts, videos, and products.

## Architectural Decisions
- **Morph map required in production:** Always define a morph map. Storing fully-qualified class names in the database couples the DB to the codebase structure. Renaming a model class requires a migration to update type column values.
- **Index strategy:** Create a composite index on both `{morph}_id` and `{morph}_type`. Queries always filter on both columns. Without the composite index, queries scan both columns separately.
- **Single table vs. separate tables:** Polymorphic relationships keep the child data in one table. This simplifies queries but creates a wide table. For highly different child data shapes, separate tables per parent type may be more appropriate.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Single table for shared child data | `*_type` column couples DB to class names | Always use morph map to decouple |
| One relationship for many parent types | Cannot enforce FK constraint (type is a string) | Application-level integrity checks needed |
| Simple eager loading per parent type | Multiple queries for mixed-type collections | `with('comments.parent')` may fire N queries |

## Performance Considerations
- **Mixed-type eager loading:** `MorphTo` eager loading fires a query per unique parent type. With 5 parent types, 5 extra queries execute. This is usually acceptable but can accumulate.
- **Composite index:** Always index `(imageable_id, imageable_type)` together. A query `WHERE imageable_id = ? AND imageable_type = ?` benefits from a composite index.
- **No foreign key constraint:** Since `*_type` is a string, you cannot declare a database foreign key. Integrity depends on application code. Orphaned records are possible.

## Production Considerations
- **Morph map registration:** Register in `AppServiceProvider::boot()`. Use short, stable aliases: `Relation::morphMap(['post' => Post::class])`.
- **Orphan cleanup:** Scheduled command to remove records with invalid `*_type` values or referencing deleted parents.
- **Soft deletes with morph:** If parent uses soft deletes, `morphTo` by default excludes soft-deleted parents. Use `->withTrashed()` if needed.
- **N+1 with morphTo:** `$image->imageable` in a loop triggers N queries. Always eager load: `Image::with('imageable')->get()`.

## Common Mistakes
- **No morph map:** Class names stored as strings break on model rename. Always register a morph map.
- **Missing composite index:** Indexing only the `*_id` column. The `*_type` filter becomes a scan.
- **Forgetting inverse:** Child defines `morphTo()`. Without it, the child cannot access the parent.
- **Incorrect morph name:** `morphOne(Image::class, 'imageable')` expects `imageable_id` and `imageable_type`. Passing `'photo'` expects `photo_id` and `photo_type`.

## Failure Modes
- **Orphaned polymorphic children:** Deleting a parent doesn't cascade (no FK constraint). Handle in `deleting` event or scheduled cleanup.
- **Invalid morph type:** A row has `imageable_type = 'App\OldModels\Post'` after a model rename. Morph map can't resolve it â†’ exception. Migration required to update type values.
- **Type confusion:** Different parent types have same ID (e.g., `User#1` and `Post#1`). The `*_type` column disambiguates. Verify type values are never null.

## Ecosystem Usage
- **Laravel Nova:** `MorphTo` fields for attachments, comments, and activity logs.
- **Laravel Telescope:** `TelescopeEntry` uses polymorphic `morphTo` for monitoring entries.
- **Spatie Media Library:** `Media` model uses `MorphMany` for attaching files to any model.
- **Laravel Activitylog:** `Activity` model uses `MorphMany` for subject/target polymorphism.

## Related Knowledge Units

### Prerequisites
HasOne, HasMany, BelongsTo

### Related Topics
`MorphToMany` (polymorphic many-to-many), `MorphTo` (inverse)

### Advanced Follow-up Topics
Morph Map Strategies, Polymorphic Eager Loading Performance, Soft Deleting Polymorphic Parents

## Research Notes
- **Source Analysis:** `Illuminate\Database\Eloquent\Relations\MorphOne.php` and `MorphMany.php` extend `MorphOneOrMany`, which extends `HasOneOrMany`. The type constraint is added in `MorphOneOrMany::addEagerConstraints()`.
- **Key Insight:** Polymorphic relationships sacrifice referential integrity for schema flexibility. The lack of a FK constraint means orphaned records are the developer's responsibility. This is acceptable for append-only child data (logs, activity) but risky for critical child data (payments, orders).
- **Version-Specific Notes:** Laravel 11 introduced automatic morph map resolution for enums. Morph maps can now map to PHP backed enums instead of class names for better type safety.
