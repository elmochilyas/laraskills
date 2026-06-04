# Morph Pivot

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships
- **Knowledge Unit:** Morph Pivot
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Morph pivot models extend the pivot concept to polymorphic many-to-many relationships (morph-to-many). A single pivot table can connect a parent model (e.g., `Tag`) to multiple types of related models (e.g., `Post`, `Video`, `Comment`) using a `morphs()` column pair (`taggable_type`, `taggable_id`). The `MorphPivot` base class in Eloquent handles the polymorphic type resolution, and custom morph pivot models enable rich behavior on these cross-entity join rows. Understanding morph pivots is essential for building generic tagging, categorization, or attachment systems that span different entity types.

---

## Core Concepts

A morph-to-many relationship is defined with `morphToMany()` on the parent model (e.g., `Tag::morphToMany(Post::class, 'taggable')`) and `morphedByMany()` on the child models (e.g., `Post::morphedByMany(Tag::class, 'taggable')`). The pivot table includes a type column (e.g., `taggable_type`) storing the related model's class name (or morph alias) and an ID column (e.g., `taggable_id`). The third parameter to `morphToMany` is the "name" that generates both columns. The `MorphPivot` class extends `Pivot` and adds a `$morphType` property that Eloquent uses to set the type column on new pivot rows. Custom morph pivot models extend `MorphPivot` directly, not `Pivot`, and are registered with `->using()` just like regular custom pivots.

---

## Mental Models

Think of a morph pivot as a **multi-lane junction** — unlike the standard pivot which only connects two specific tables, a morph pivot connects one table to many possible partner tables. The `_type` column is the "lane selector" that determines which table the `_id` column references. This is analogous to a tagged union (sum type) in type systems: the pivot row is `Tag × (Post | Video | Comment)` rather than `Tag × Post` alone. The `morphedByMany()` call is the inverse lookup: "find all tags that belong to this post/video/comment."

---

## Internal Mechanics

The `MorphPivot` class (`Illuminate\Database\Eloquent\Relations\MorphPivot`) overrides `setKeysForSaveQuery()` and `delete()` to handle the polymorphic type column. When saving a morph pivot, the `$morphType` column is automatically set to the morph alias (or class name) of the related model. The `morphToMany()` query construction uses `WHERE {$type} = {$morphClass}` in addition to the standard pivot join conditions. Eloquent's `morph_type` resolution goes through `Model::getMorphClass()`, which returns the short name from `Model::$morphClass` if set, or the fully qualified class name. When using `->using(CustomMorphPivot::class)`, the morph pivot must extend `MorphPivot` instead of `Pivot` because the base `Pivot` class does not handle the `$morphType` column — calling `delete()` or `save()` on a `MorphPivot` through a `Pivot` instance will miss the type constraint and potentially delete rows from other morph types.

---

## Patterns

- **Morph name parameter**: The second parameter to `morphToMany()` and `morphedByMany()` is the "name" that generates `{name}_id` and `{name}_type`. Choose a singular, descriptive name (e.g., `'taggable'`, `'categorizable'`).
- **Custom morph aliases**: Define `$morphClass` on each model or use `Relation::enforceMorphMap()` to map short aliases, improving readability and avoiding class name refactoring issues.
- **Custom morph pivot models**: Extend `MorphPivot` (not `Pivot`) and register with `->using()` for type-safe accessors and casts on polymorphic pivots.
- **Morph map registration**: Always define a morph map in `AppServiceProvider::boot()` via `Relation::enforceMorphMap()` for production stability.
- **Pivot table migration**: Use `$table->morphs('taggable')` to create both `taggable_id` (big integer) and `taggable_type` (string) columns with indexes.

---

## Architectural Decisions

Laravel's morph pivot design uses a `_type` discriminator column rather than separate pivot tables per related type. This choice (single table per morph group vs multiple specific tables) reduces schema complexity at the cost of referential integrity: foreign key constraints cannot be enforced on the `_id` column because it references different tables depending on the `_type` value. The `MorphPivot` subclass exists precisely to ensure that polymorphic type constraints are applied on writes and deletes, preventing a deletion operation on one morph type from affecting rows of another type.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Single pivot table for N relationships | No foreign key constraint on `taggable_id` | Orphaned pivot rows if related models are deleted (use `cascadeOnDelete` or cleanup jobs) |
| Automatic type discrimination | Type column bloat: stores full class name or morph alias | Use `Relation::enforceMorphMap()` to use short aliases |
| `morphToMany()` + `morphedByMany()` provide clean symmetry | More complex query construction with type filter | Marginal query overhead from additional `WHERE type = ?` clause |
| Custom morph pivots enable rich behavior | Must remember to extend `MorphPivot`, not `Pivot` | Using `Pivot` instead silently drops type filtering on writes |

---

## Performance Considerations

The `_type` column is a string — index it for performance on the `WHERE` clause. The `_id` column is typically an integer. The composite index on `(type, id)` is essential for morph query performance. Because foreign key constraints can't be enforced, orphaned pivot rows accumulate when related models are deleted, requiring periodic cleanup queries. On high-traffic systems, the string `_type` comparison (even indexed) is slightly slower than an integer FK — consider using an enum-like type column with short values.

---

## Production Considerations

Always use `Relation::enforceMorphMap()` in production to map short aliases (e.g., `'post' => Post::class`). This prevents class name refactoring from silently breaking morph relationships because the alias is stored in the database instead of the FQCN. When deleting a model that participates in morph relationships, consider using `Model::deleting` events or `cascadeOnDelete` to clean up orphaned morph pivot rows. Monitor for orphan accumulation via regular database integrity checks. Custom morph pivot models must extend `MorphPivot` — using `Pivot` can cause data corruption in write operations.

---

## Common Mistakes

- **Extending `Pivot` instead of `MorphPivot` for custom morph pivots**: Why it happens: the developer extends the base `Pivot` class they're familiar with. Why it's harmful: `delete()` and `save()` operations don't include the `_type` constraint, potentially corrupting other morph types' rows. Better approach: always extend `MorphPivot` when the pivot table has polymorphic columns.
- **Not registering a morph map in production**: Why it happens: the morph map is seen as optional/advanced. Why it's harmful: renaming a model class breaks all existing morph pivot rows referencing the old class name in the `_type` column. Better approach: always use `Relation::enforceMorphMap()` in any non-trivial application.
- **Forgetting `morphedByMany()` on the inverse side**: Why it happens: the relationship is only defined on one model. Why it's harmful: `$post->tags` works but `$tag->posts` throws a bad method call exception. Better approach: define both `morphToMany()` and `morphedByMany()` for bidirectional access.
- **Missing index on the morph columns**: Why it happens: the migration uses `morphs()` which creates indexes, but custom migration scripts may omit them. Why it's harmful: queries filter by both `_type` and `_id` — without a composite index, scans degrade performance. Better approach: always use `morphs()` or add `->index()` to both columns.

---

## Failure Modes

- **Orphaned pivot rows**: Deleting a `Post` that was tagged does not automatically delete its `taggable` pivot rows. Over time, the pivot table accumulates dead rows.
- **Morph map mismatch**: If a morph map is enforced but a request uses an unmapped class, Eloquent throws `MorphRelationNotMappedException`.
- **Type column truncation**: If the `_type` column is too short (e.g., `VARCHAR(50)`) for a long FQCN, writes fail with truncation errors. Ensure `string()` column has adequate length.
- **Incorrect morph name**: Passing a mismatched morph name to `morphedByMany()` results in empty collections because the join uses the wrong column pair.

---

## Ecosystem Usage

Spatie's `laravel-tags` package uses morph pivots to allow tagging any model (Post, Video, etc.) through a `taggables` table. Laravel's own `Notifications` table uses a similar polymorphic pattern (`notifiable_type`, `notifiable_id`). Media library packages (Spatie MediaLibrary, Plank Mediable) use morph pivots to attach files to any model. Custom CMS systems commonly use morph pivots for generic categorization and menu item assignment.

---

## Related Knowledge Units

### Prerequisites
- pivot-table-conventions (standard pivot fundamentals)
- custom-pivot-models (extending Pivot with behavior)
- Polymorphic Relationships Basics (one-to-one and one-to-many polymorphs)

### Related Topics
- pivot-attributes (accessing data on morph pivots)
- pivot-events (event lifecycle on morph pivot rows)

### Advanced Follow-up Topics
- Morph map registration strategies for package development
- Multi-tenancy with morph pivots (tenant-scoped morph maps)
- Orphaned pivot row cleanup patterns (scheduled jobs, DB triggers)

---

## Research Notes

### Source Analysis
`Illuminate\Database\Eloquent\Relations\MorphPivot` at `src/Illuminate/Database/Eloquent/Relations/MorphPivot.php`. The class overrides `delete()` (line ~30) and `setKeysForSaveQuery()` (line ~50) to include the `$morphType` column. `Illuminate\Database\Eloquent\Relations\MorphToMany` at `src/Illuminate/Database/Eloquent/Relations/MorphToMany.php` extends `BelongsToMany` with polymorphic type handling.

### Key Insight
The morph pivot pattern sacrifices referential integrity for schema flexibility. The `MorphPivot` class exists to prevent the most dangerous consequence: cross-type data corruption on writes. Always extending `MorphPivot` (not `Pivot`) is the single most important rule for morph pivot models.

### Version-Specific Notes
`Relation::enforceMorphMap()` was added in Laravel 7. The `MorphPivot` class has been available since Laravel 5.8. In Laravel 11, morph maps continue to work identically, and `morphs()` migration helper is the recommended approach.
