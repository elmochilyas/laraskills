# Polymorphic (MorphOne / MorphMany) — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Part 1: Relationship Types
- **Knowledge Unit:** Polymorphic (MorphOne / MorphMany)
- **ECC Version:** 1.0

## Overview
Polymorphic relationships (`MorphOne`, `MorphMany`) allow a model to belong to multiple other model types using a single association table. Instead of separate FK columns for each possible parent type, a combination of a foreign key ID column and a type column (morph) identifies the parent. This enables a single model (e.g., `Image`) to be associated with `User`, `Post`, or `Product` without schema changes.

## Core Concepts
- Morph columns: child table contains `{morph}_id` (integer) and `{morph}_type` (string)
- Parent definition: `$this->morphOne(Image::class, 'imageable')` or `$this->morphMany(Image::class, 'imageable')`
- Child inverse: `return $this->morphTo();` — no model argument needed; resolves parent from `*_type` column
- Morph map: `Relation::morphMap(['user' => User::class])` replaces FQCNs with short aliases in the type column
- Eager loading `MorphTo` fires one query per unique parent type

## When To Use
- Universal attachment systems: images, comments, likes that apply to multiple entity types
- Activity logs where the subject can be any model type
- Tagging systems where a tag applies to posts, videos, and products (use `MorphToMany` for many-to-many)
- Any scenario where a child model can belong to heterogeneous parent types

## When NOT To Use
- Do NOT use when the child always belongs to a single parent type (use `HasOne`/`HasMany`)
- Do NOT use when foreign key constraints are required (polymorphic type columns cannot have FK constraints)
- Do NOT use for critical financial data where referential integrity must be database-enforced
- Do NOT use when parent types have fundamentally different child data shapes (separate tables may be better)

## Best Practices (WHY)
- Always register a morph map in production — never store FQCNs in the type column
- Create a composite index on both `(morph_id, morph_type)` — queries always filter on both
- Add cascade cleanup via `deleting` events on parent models — no FK cascade for polymorphic children
- Use `Relation::enforceMorphMap()` to prevent unmapped polymorphic types from being stored
- Periodically audit for orphaned polymorphic children and invalid type values

## Architecture Guidelines
- Choose the morph name carefully — it generates both `{name}_id` and `{name}_type` columns
- Keep polymorphic child tables lean — they serve multiple parent types, so column bloat affects all
- Register morph maps in `AppServiceProvider::boot()` or a dedicated service provider
- For mixed-type eager loading, be aware that each unique parent type adds a separate query
- Use scheduled commands to detect and clean orphaned polymorphic children

## Performance
- `MorphTo` eager loading fires one query per unique parent type — 5 parent types = 5 extra queries
- Composite index on `(morph_id, morph_type)` is essential — without it, every query scans both columns
- No foreign key constraint on the type column — integrity depends on application code
- Polymorphic queries are slightly slower than direct FK queries due to the type discriminator

## Security
- Validate that the `*_type` value is in the morph map before allowing writes
- Never accept arbitrary class names from user input as the morph type
- Orphaned polymorphic children can expose stale data if not cleaned up
- Morph map aliases prevent class name refactoring from breaking existing rows

## Common Mistakes
- No morph map: class names stored as strings break on model rename
- Missing composite index: indexing only the `*_id` column — the type filter becomes a scan
- Forgetting inverse: child must define `morphTo()` — without it, the child cannot access the parent
- Incorrect morph name: `morphOne(Image::class, 'imageable')` expects `imageable_id` and `imageable_type`

## Anti-Patterns
- **Polymorphic for everything**: using polymorphic relationships for data that always belongs to one type
- **No orphan cleanup**: never cleaning up children after parent deletion, allowing table bloat
- **Missing morph map in production**: storing FQCNs that break on refactoring
- **Polymorphic for critical financial data**: sacrificing referential integrity when FK constraints are needed

## Examples
```php
// Register morph map
Relation::morphMap([
    'user' => User::class,
    'post' => Post::class,
    'product' => Product::class,
]);

// Parent definitions
class User extends Model
{
    public function image(): MorphOne
    {
        return $this->morphOne(Image::class, 'imageable');
    }
}

class Post extends Model
{
    public function images(): MorphMany
    {
        return $this->morphMany(Image::class, 'imageable');
    }
}

// Child definition
class Image extends Model
{
    public function imageable(): MorphTo
    {
        return $this->morphTo();
    }
}

// CRUD
$user->image()->create(['url' => 'photo.jpg']);
$post->images()->createMany([
    ['url' => 'photo1.jpg'],
    ['url' => 'photo2.jpg'],
]);

// Eager loading
$images = Image::with('imageable')->get();

// Query by type
$postImages = Image::where('imageable_type', (new Post)->getMorphClass())->get();

// Cascade cleanup
static::deleting(fn ($post) => $post->images()->delete());
```

## Related Topics
- MorphToMany — polymorphic many-to-many variant
- MorphTo — inverse relationship
- HasOne / HasMany — non-polymorphic counterparts
- Morph Pivot — custom pivot models for polymorphic many-to-many

## AI Agent Notes
- Always generate a morph map in the service provider when writing polymorphic relationships
- Use `Relation::enforceMorphMap()` to lock down allowed type values
- Remember that eager loading with mixed parent types fires N queries (one per unique type)
- The child model's migration must have both `morphs()` columns — use `$table->morphs('imageable')` helper
- Always add `deleting` event handlers on parent models to clean up polymorphic children

## Verification
- [ ] Morph map is registered and `enforceMorphMap()` is enabled in production
- [ ] Child table has composite index on `(morph_id, morph_type)`
- [ ] `$parent->child` returns single model or collection correctly
- [ ] `$child->parent()` returns the correct parent type via morphTo
- [ ] Deleting parent cascades to children via event
- [ ] Eager loading with mixed types executes correct number of queries
- [ ] Orphan detection query identifies children without valid parents
