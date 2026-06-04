# Polymorphic MorphToMany Rules

## Rule: MorphToMany-Use-MorphedByMany-Inverse
---
## Category
Framework Usage
---
## Rule
Use `morphedByMany()` (not `morphToMany()`) on the shared (inverse) side of a polymorphic many-to-many relationship.
---
## Reason
`morphToMany()` and `morphedByMany()` are distinct methods with different SQL generation. Using `morphToMany()` on both sides generates incorrect joins on the inverse side.
---
## Bad Example
```php
class Tag extends Model
{
    public function posts(): MorphToMany
    {
        return $this->morphToMany(Post::class, 'taggable');
        // Wrong — should use morphedByMany
    }
}
```
---
## Good Example
```php
class Tag extends Model
{
    public function posts(): MorphToMany
    {
        return $this->morphedByMany(Post::class, 'taggable');
    }
}
```
---
## Exceptions
None.
---
## Consequences Of Violation
Incorrect join SQL, empty relationships, bidirectional navigation broken.

## Rule: MorphToMany-Register-Enforce-MorphMap
---
## Category
Architecture
---
## Rule
Always register `Relation::enforceMorphMap()` in production for polymorphic many-to-many relationships.
---
## Reason
Without a morph map, FQCNs are stored in the `*_type` column. Renaming the model class breaks all existing pivot rows. A morph map with short aliases prevents this.
---
## Bad Example
```php
// No morph map — stores App\Models\Post as string
```
---
## Good Example
```php
Relation::morphMap([
    'post' => Post::class,
    'video' => Video::class,
]);
Relation::enforceMorphMap();
```
---
## Exceptions
None.
---
## Consequences Of Violation
Broken pivot rows on model rename, production outages.

## Rule: MorphToMany-Composite-Index
---
## Category
Performance
---
## Rule
Create a composite index on `(morph_type, morph_id, related_id)` in the polymorphic pivot migration.
---
## Reason
Queries on polymorphic pivot tables filter by type first, then by parent ID. A composite index covering all three columns enables efficient index-only lookups.
---
## Bad Example
```php
Schema::create('taggables', function (Blueprint $table) {
    $table->morphs('taggable');
    $table->foreignIdFor(Tag::class);
    // No composite index
});
```
---
## Good Example
```php
Schema::create('taggables', function (Blueprint $table) {
    $table->morphs('taggable');
    $table->foreignIdFor(Tag::class)->constrained()->cascadeOnDelete();
    $table->primary(['taggable_type', 'taggable_id', 'tag_id']);
});
```
---
## Exceptions
Trivially small tables.
---
## Consequences Of Violation
Slow queries, full table scans, performance degradation at scale.

## Rule: MorphToMany-Cascade-Cleanup-AppLevel
---
## Category
Reliability
---
## Rule
Add application-level cascade cleanup via `deleting` events on both parent and shared models.
---
## Reason
Polymorphic pivot tables cannot use database foreign key constraints on the morph columns. Both parent and shared model deletion must be handled in application code.
---
## Bad Example
```php
class Post extends Model
{
    // No cleanup — deleting Post leaves orphaned taggable rows
}
```
---
## Good Example
```php
class Post extends Model
{
    protected static function booted(): void
    {
        static::deleting(fn ($post) => $post->tags()->detach());
    }
}
class Tag extends Model
{
    protected static function booted(): void
    {
        static::deleting(fn ($tag) => $tag->posts()->detach());
    }
}
```
---
## Exceptions
When orphan cleanup is handled via scheduled jobs.
---
## Consequences Of Violation
Orphaned pivot rows, data bloat, stale relationship data.

## Rule: MorphToMany-Validate-Type-Input
---
## Category
Security
---
## Rule
Never accept arbitrary class names from user input as the morph type — validate against the morph map.
---
## Reason
Polymorphic type columns are string-based. Unvalidated user input allows storing arbitrary or malicious type references, corrupting the relationship.
---
## Bad Example
```php
$post->tags()->attach($tagId);
// If morph map is not enforced, type could be anything
```
---
## Good Example
```php
// enforceMorphMap prevents invalid types at the database level
Relation::enforceMorphMap();
```
---
## Exceptions
None.
---
## Consequences Of Violation
Data corruption, broken queries, security vulnerabilities.

## Rule: MorphToMany-Not-FK-Constraints-Awareness
---
## Category
Reliability
---
## Rule
Be aware that polymorphic pivot tables cannot enforce referential integrity on the morph columns — data integrity depends on application code.
---
## Reason
Since morph columns use a string `*_type` and integer `*_id`, database foreign key constraints cannot be applied. Application-level cleanup and validation are the only safeguards.
---
## Bad Example
```php
// Assuming database will prevent orphaned rows
// It won't — there's no FK constraint on polymorphic columns
```
---
## Good Example
```php
// Defensive: always clean up in events and validate input
static::deleting(fn ($post) => $post->tags()->detach());
```
---
## Exceptions
None.
---
## Consequences Of Violation
Silent data corruption, orphaned rows, hard-to-trace bugs.

## Rule: MorphToMany-MorphName-Consistency
---
## Category
Reliability
---
## Rule
Ensure identical morph names across all `morphToMany()` and `morphedByMany()` definitions for the same relationship.
---
## Reason
The morph name maps to the pivot table column names. Inconsistent names cause Eloquent to look in different columns, resulting in empty relationships or query errors.
---
## Bad Example
```php
class Post extends Model
{
    public function tags(): MorphToMany
    {
        return $this->morphToMany(Tag::class, 'taggable');
    }
}
class Tag extends Model
{
    public function posts(): MorphToMany
    {
        return $this->morphedByMany(Post::class, 'categorizable');
        // Mismatched morph name — queries look at wrong columns
    }
}
```
---
## Good Example
```php
// Both use 'taggable'
class Post extends Model
{
    public function tags(): MorphToMany
    {
        return $this->morphToMany(Tag::class, 'taggable');
    }
}
class Tag extends Model
{
    public function posts(): MorphToMany
    {
        return $this->morphedByMany(Post::class, 'taggable');
    }
}
```
---
## Exceptions
None.
---
## Consequences Of Violation
Empty relationship results, broken bidirectional access.

## Rule: MorphToMany-CustomPivot-Extend-MorphPivot
---
## Category
Reliability
---
## Rule
Extend `MorphPivot` (not `Pivot`) when creating custom pivot models for polymorphic many-to-many relationships.
---
## Reason
`MorphPivot` handles the type constraint on write operations. Extending `Pivot` ignores the morph type during `delete()` and `save()`, potentially corrupting data.
---
## Bad Example
```php
class TaggablePivot extends Pivot // Should extend MorphPivot
{
    //
}
```
---
## Good Example
```php
use Illuminate\Database\Eloquent\Relations\MorphPivot;

class TaggablePivot extends MorphPivot
{
    protected $casts = ['created_at' => 'datetime'];
}
```
---
## Exceptions
None.
---
## Consequences Of Violation
Data corruption on write operations, type constraint bypass.
