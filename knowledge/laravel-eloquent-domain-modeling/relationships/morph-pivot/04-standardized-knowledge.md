# Morph Pivot — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships
- **Knowledge Unit:** Morph Pivot
- **ECC Version:** 1.0

## Overview
Morph pivot models extend the pivot concept to polymorphic many-to-many relationships. A single pivot table can connect a parent model (e.g., `Tag`) to multiple types of related models (e.g., `Post`, `Video`, `Product`) using a `morphs()` column pair. The `MorphPivot` base class handles polymorphic type resolution on writes and deletes.

## Core Concepts
- Morph-to-many pivot table contains `{morph}_id`, `{morph}_type`, and `{related}_id` columns
- Parent defines `morphToMany(Tag::class, 'taggable')`; shared model defines `morphedByMany(Parent::class, 'taggable')`
- `MorphPivot` extends `Pivot` and adds `$morphType` handling for write operations
- Custom morph pivot models extend `MorphPivot`, not `Pivot`
- Morph map via `Relation::enforceMorphMap()` for stable type aliases
- Pivot table migration: `$table->morphs('taggable')` creates both columns with indexes

## When To Use
- Universal tagging: one tag system for Posts, Videos, and Products
- Polymorphic favorites/bookmarks where users can favorite any entity type
- Categories/labels that span multiple entity types
- Any many-to-many relationship where the related model can be one of several types

## When NOT To Use
- Do NOT use for non-polymorphic many-to-many (use `BelongsToMany` with regular pivot)
- Do NOT use when foreign key constraints are required on the polymorphic columns
- Do NOT use when the pivot needs different columns per parent type
- Do NOT use for polymorphic one-to-many (use `MorphMany`)

## Best Practices (WHY)
- Always extend `MorphPivot` (not `Pivot`) for custom morph pivot models — critical for write correctness
- Register `Relation::enforceMorphMap()` in production for stable type aliases
- Create a composite index on `(morph_type, morph_id, related_id)` for query performance
- Add cascade cleanup via `deleting` events — no FK constraint on polymorphic columns
- Use `morphs()` migration helper: `$table->morphs('taggable')`

## Architecture Guidelines
- Choose the morph name carefully — it generates both `{name}_id` and `{name}_type` columns
- Never remove a morph map alias — existing rows with orphaned type values crash at runtime
- Add scheduled cleanup jobs for orphaned polymorphic pivot rows
- Document the relationship clearly — the `morphToMany`/`morphedByMany` pair is less common than `belongsToMany`

## Performance
- Composite index on `(type, id, related_id)` is mandatory — queries filter on type first
- The string `_type` comparison is slightly slower than an integer FK — use short morph aliases
- No FK constraint possible — orphaned rows accumulate without cleanup
- Eager loading constrains on type, generating one query per parent type

## Security
- Validate that `*_type` values are in the morph map before allowing writes
- Never accept arbitrary class names from user input as the morph type
- Orphaned pivot rows can expose stale relationship data
- `MorphPivot` ensures type constraint on writes — prevents cross-type data corruption

## Common Mistakes
- Extending `Pivot` instead of `MorphPivot` — `delete()` and `save()` miss the type constraint
- Not registering a morph map — FQCNs in type column break on model rename
- Forgetting `morphedByMany()` on the inverse side — relationship is one-directional
- Missing composite index — queries filter by type and id, requiring both columns indexed

## Anti-Patterns
- **Using Pivot instead of MorphPivot**: data corruption risk on write operations
- **No morph map in production**: FQCNs stored in type column that break on refactoring
- **No orphan cleanup**: pivot rows accumulating when parent models are deleted
- **Wrong morph name between models**: `morphToMany` and `morphedByMany` using different morph names

## Examples
```php
// Register morph map
Relation::morphMap([
    'post' => Post::class,
    'video' => Video::class,
]);

// Migration
Schema::create('taggables', function (Blueprint $table) {
    $table->foreignIdFor(Tag::class)->constrained()->cascadeOnDelete();
    $table->morphs('taggable');
    $table->timestamps();
    $table->primary(['tag_id', 'taggable_id', 'taggable_type']);
});

// Parent model
class Post extends Model
{
    public function tags(): MorphToMany
    {
        return $this->morphToMany(Tag::class, 'taggable');
    }
}

// Shared model
class Tag extends Model
{
    public function posts(): MorphToMany
    {
        return $this->morphedByMany(Post::class, 'taggable');
    }
}

// Custom morph pivot model
class TaggablePivot extends MorphPivot
{
    protected $casts = [
        'created_at' => 'datetime',
    ];
}

// Register custom pivot
return $this->morphToMany(Tag::class, 'taggable')
    ->using(TaggablePivot::class);
```

## Related Topics
- Polymorphic MorphToMany — relationship type itself
- Custom Pivot Models — standard (non-polymorphic) custom pivots
- Pivot Table Conventions — standard pivot naming and structure
- Pivot Attributes — reading/writing pivot data

## AI Agent Notes
- Custom morph pivot models MUST extend `MorphPivot`, not `Pivot`
- Always use `Relation::enforceMorphMap()` in production
- Use `$table->morphs('name')` for migration columns
- `morphToMany()` on parent, `morphedByMany()` on shared model — they are different methods
- No FK constraint on polymorphic columns — cascade cleanup must be application-level

## Verification
- [ ] Custom morph pivot model extends `MorphPivot` (not `Pivot`)
- [ ] Morph map is registered and enforced in production
- [ ] Composite index on `(type, id, related_id)` exists
- [ ] `morphToMany()` and `morphedByMany()` use the same morph name
- [ ] Deleting parent cascades to polymorphic pivot rows
- [ ] Orphan detection query works for invalid morph types
- [ ] Eager loading produces correct type-constrained queries
