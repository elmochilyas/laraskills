# Polymorphic MorphToMany

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships â€” Part 1: Relationship Types
- **Last Updated:** 2026-06-02

## Executive Summary
`MorphToMany` (with its inverse `MorphedByMany`) defines a polymorphic many-to-many relationship. It combines the flexibility of polymorphic associations with the many-to-many cardinality. A single pivot table can link many different model types to a shared target model. For example, a `Tag` can be associated with `Post`s, `Video`s, and `Product`s through one `taggables` pivot table.

## Core Concepts
- **Pivot table with morph columns:** Pivot table `taggables` contains `tag_id`, `taggable_id`, and `taggable_type`. No separate pivot per parent type.
- **Definition syntax on parent:** `return $this->morphToMany(Tag::class, 'taggable');` on `Post`. This defines the relationship from the parent (Post) to the shared model (Tag).
- **Definition syntax on shared model (inverse):** `return $this->morphedByMany(Post::class, 'taggable');` on `Tag`. This defines the inverse â€” how the Tag finds all Posts that use it.
- **Pivot table name:** Convention is the plural morph name: `taggables`, `likables`, `commentables`.
- **Return type:** A `Collection` of the related model instances, each with a `pivot` attribute containing `*_id`, `*_type`, and any extra pivot columns.

## Mental Models
- **Universal tagging system:** One `taggables` pivot table serves all taggable models. A tag can be applied to any model without creating `post_tag` and `video_tag` tables separately.
- **MorphMany + BelongsToMany combined:** The morph columns (`*_id`, `*_type`) on the pivot table act like a polymorphic foreign key, while the pivot table itself mediates a many-to-many relationship.
- **Symmetric with type discriminator:** Both sides of the relationship use a similar API. The parent uses `morphToMany`, the shared model uses `morphedByMany`. Both reference the same morph name.

## Internal Mechanics

> **Reference:** 
- `MorphToMany` extends `BelongsToMany`. It overrides `addEagerConstraints()` to add the `WHERE {morph}_type = 'App\Models\Post'` constraint.
- The pivot query: `SELECT tags.*, taggables.* FROM tags INNER JOIN taggables ON tags.id = taggables.tag_id WHERE taggables.taggable_id = ? AND taggables.taggable_type = ?`.
- `morphedByMany` is a method on the related model that creates a `MorphToMany` instance with the parent's role reversed. Internally it swaps the foreign key positions.
- `attach()`, `detach()`, `sync()`, `toggle()` all work like `BelongsToMany`, but always include the `*_type` column in the pivot row.
- Matching during eager loading groups by type, then groups by parent key, and hydrates the collection per parent.

## Patterns
- **Tagging:** `Tag morphToMany taggable`. Posts, videos, products all use the same `tags` and `taggables` table.
- **Favorites / bookmarks:** `User morphToMany likeable`. Posts, comments, media all favorited via one `likables` pivot.
- **Categories (polymorphic):** `Category morphToMany categorizable`. Articles, products, events share a single category system.
- **Labels / flags:** `Label morphToMany labellable`. Orders, users, tickets share a labeling system.

## Architectural Decisions
- **Morph map required:** Same as `MorphOne`/`MorphMany`. Register `Relation::morphMap()` to store short aliases. Without it, `taggable_type` stores `App\Models\Post` â€” brittle against class renames.
- **Pivot index strategy:** Create a composite index on `(taggable_type, taggable_id, tag_id)` for the pivot table. Queries always filter on type first, then id, then join to the tag.
- **Extra pivot columns:** Use `->withPivot('created_at')` to store metadata on the polymorphic association. Custom pivot models via `->using()` are also supported.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Single pivot table for all parent types | Cannot enforce FK on polymorphic column | Application-level cleanup needed |
| Same sync/attach/toggle API as BelongsToMany | Extra type column in every pivot query | Composite index mitigates cost |
| Flexible association model | Morph map required for production stability | Register early in service provider |

## Performance Considerations
- **Composite index is mandatory:** Queries filter `WHERE taggable_type = ? AND taggable_id IN (?)`. Without a composite index on `(taggable_type, taggable_id)`, every query scans the pivot table.
- **Eager loading with diverse types:** `MorphToMany` eager loading constrains on type. If 100 posts and 50 videos reference the same tags, the tags query joins the pivot filtered by type. Two separate queries may be needed for different types.
- **Pivot table size:** As the number of parent types grows, the pivot table becomes a hot table. Partition by type or use read replicas for high-traffic applications.

## Production Considerations
- **Morph map stability:** Never remove a morph map alias. Rows with orphaned type values cause runtime errors. Add new aliases only; never delete aliases from active maps.
- **Orphan cleanup:** Scheduled job to delete pivot rows whose `*_id` references a deleted parent. No FK cascade on polymorphic columns.
- **Pivot data validation:** Validate that `*_type` values are in the morph map before insert. Reject requests with invalid or missing type values.

## Common Mistakes
- **Using `morphToMany` instead of `morphedByMany`:** The tag model uses `morphedByMany` for the inverse. Using `morphToMany` on both sides creates a broken relationship.
- **Missing morph map:** Storing FQCN in the pivot table. Always register a map.
- **Wrong morph name:** The morph name must match between `morphToMany`, `morphedByMany`, and the pivot table columns. `morphToMany(Tag::class, 'taggable')` expects `taggable_id` and `taggable_type`.
- **Forgetting composite index:** Only indexing single columns. The query planner uses only one index per table unless a composite index exists.

## Failure Modes
- **Orphaned pivot rows:** Deleting a tag or parent model leaves pivot rows. Use `deleting` events or scheduled cleanup.
- **Invalid morph type:** Old class name in pivot type column after model rename. Migration to update type values.
- **Pivot data loss on sync:** `sync()` removes pivot rows not in the given array, including any extra pivot data. Use `syncWithoutDetaching()` for additive-only behavior.

## Ecosystem Usage
- **Spatie Tags:** `Tag` model uses `morphToMany` for tagging any model.
- **Laravel Nova:** `MorphToMany` fields for tags, categories, and labels on resources.
- **Laravel Spark:** Feature flags as polymorphic many-to-many on teams and users.

## Related Knowledge Units

### Prerequisites
BelongsToMany, MorphOne/MorphMany

### Related Topics
`BelongsToMany` (non-polymorphic variant), `MorphOne`/`MorphMany` (polymorphic one-to-many)

### Advanced Follow-up Topics
Custom Pivot Models, Morph Map Management, Polymorphic Eager Loading

## Research Notes
- **Source Analysis:** `Illuminate\Database\Eloquent\Relations\MorphToMany.php` extends `BelongsToMany` and adds the type constraint. The `morphedByMany()` helper is defined on the `Model` class, not the relation class.
- **Key Insight:** `MorphToMany` is the most flexible relationship type but the hardest to debug. A missing morph map entry produces a cryptic error when Eloquent can't resolve the type column to a class. Always test with invalid type values in development.
- **Version-Specific Notes:** Laravel 10+ added `wherePivot` and `wherePivotIn` for filtering polymorphic pivot columns. Laravel 11 improved morph map resolution for enum-backed type columns.
