# Polymorphic MorphToMany — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Part 1: Relationship Types
- **Knowledge Unit:** Polymorphic MorphToMany
- **ECC Version:** 1.0

## Overview
`MorphToMany` (with its inverse `MorphedByMany`) defines a polymorphic many-to-many relationship. A single pivot table can link many different model types to a shared target model. For example, a `Tag` can be associated with `Post`s, `Video`s, and `Product`s through one `taggables` pivot table.

## Core Concepts
- Pivot table with morph columns: contains `{morph}_id`, `{morph}_type`, and `{related}_id`
- Parent definition: `return $this->morphToMany(Tag::class, 'taggable');` on `Post`
- Shared model inverse: `return $this->morphedByMany(Post::class, 'taggable');` on `Tag`
- Pivot table name: plural morph name — `taggables`, `likables`, `categorizables`
- `MorphToMany` extends `BelongsToMany` and adds the type constraint to all queries

## When To Use
- Universal tagging: a `Tag` that applies to Posts, Videos, and Products via one pivot table
- Favorites/bookmarks: polymorphic favorites where users can favorite any entity type
- Categories that span multiple entity types: Products, Articles, Events
- Labels/flags on heterogeneous entities: Orders, Users, Tickets

## When NOT To Use
- Do NOT use when the relationship is many-to-many but not polymorphic (use `BelongsToMany`)
- Do NOT use when foreign key constraints are required on the polymorphic columns
- Do NOT use for one-to-many polymorphic relationships (use `MorphMany`)
- Do NOT use when the pivot table needs different columns per parent type (separate pivot tables may be better)

## Best Practices (WHY)
- Always register a morph map — never store FQCNs in the pivot table
- Create a composite index on `(morph_type, morph_id, related_id)` for query performance
- Define `morphToMany` on parent models and `morphedByMany` on the shared model for bidirectional access
- Add cascade cleanup via `deleting` events on both parent and shared models
- Use custom morph pivot models extending `MorphPivot` (not `Pivot`) for rich pivot behavior

## Architecture Guidelines
- Choose the morph name carefully — it generates both `{name}_id` and `{name}_type` columns
- Use `Relation::enforceMorphMap()` to prevent unmapped parent types
- Never remove a morph map alias — existing rows with orphaned type values cause runtime errors
- Add scheduled cleanup jobs to remove orphaned pivot rows
- For high-traffic applications, the pivot table becomes a hot table — consider partitioning or read replicas

## Performance
- Composite index on `(morph_type, morph_id, related_id)` is mandatory for query performance
- Eager loading constrains on type — different parent types generate separate queries
- Pivot table size grows with the number of parent types — monitor for table bloat
- Extra pivot columns increase result set size — use `withPivot()` selectively

## Security
- Validate that the `*_type` value is in the morph map before allowing attach/sync operations
- Never accept arbitrary class names from user input as the morph type
- Orphaned pivot rows can expose relationship data if parent models are deleted without cleanup
- Morph map aliases prevent class name refactoring from breaking existing pivot rows

## Common Mistakes
- Using `morphToMany` instead of `morphedByMany` on the shared model — `morphedByMany` is the inverse
- Missing morph map: storing FQCNs in the pivot table that break on model rename
- Wrong morph name: the name must match between `morphToMany`, `morphedByMany`, and the pivot columns
- Forgetting composite index: only indexing single columns — the query planner needs a composite index
- Extending `Pivot` instead of `MorphPivot` for custom morph pivot models — write operations may corrupt data

## Anti-Patterns
- **No cascade cleanup**: never removing pivot rows when parent or shared models are deleted
- **Missing composite index**: letting queries scan the pivot table for every operation
- **Polymorphic pivot with parent-specific columns**: using one pivot table when columns differ per parent type
- **Using FQCNs in type column**: storing `App\Models\Post` instead of morph alias `'post'`

## Examples
```php
// Register morph map
Relation::morphMap([
    'post' => Post::class,
    'video' => Video::class,
    'product' => Product::class,
]);

// Parent models
class Post extends Model
{
    public function tags(): MorphToMany
    {
        return $this->morphToMany(Tag::class, 'taggable');
    }
}

class Video extends Model
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

    public function videos(): MorphToMany
    {
        return $this->morphedByMany(Video::class, 'taggable');
    }
}

// CRUD
$post->tags()->attach($tagId);
$post->tags()->sync([1, 2, 3]);
$post->tags()->toggle([3]);
$tag->posts()->detach($postId);

// Eager loading
$posts = Post::with('tags')->get();
```

## Related Topics
- BelongsToMany — non-polymorphic many-to-many
- MorphOne / MorphMany — polymorphic one-to-many
- Morph Pivot — custom pivot models for polymorphic many-to-many
- Pivot Attributes — reading/writing extra pivot columns
- Pivot Events — lifecycle hooks for attach/detach

## AI Agent Notes
- The inverse of `morphToMany` is `morphedByMany`, NOT `morphToMany` — they are distinct methods
- Custom morph pivot models must extend `MorphPivot`, not `Pivot`
- Always include a composite index on `(type, id, related_id)` in the pivot migration
- Use `morphs()` migration helper or manually add `morphable_id` and `morphable_type` columns
- Cascade cleanup must be application-level — no DB foreign key possible on polymorphic columns

## Verification
- [ ] `$parent->tags` returns Tag collection with pivot data
- [ ] `$tag->posts` returns Post collection via `morphedByMany`
- [ ] Pivot table stores correct `*_type` morph alias
- [ ] `sync()` correctly diff-based inserts/deletes
- [ ] Deleting parent removes associated pivot rows
- [ ] Eager loading produces correct type-constrained queries
- [ ] Composite index covers `(type, id)` filter pattern
