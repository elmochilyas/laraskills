# Morph Pivot Rules

## Rule: MorphPivot-Extend-MorphPivot-Not-Pivot
---
## Category
Reliability
---
## Rule
Extend `MorphPivot` (not `Pivot`) when creating custom pivot models for polymorphic many-to-many relationships.
---
## Reason
`MorphPivot` adds type-constrained write operations. Extending `Pivot` ignores the morph type during `delete()` and `save()`, potentially corrupting data.
---
## Bad Example
```php
use Illuminate\Database\Eloquent\Relations\Pivot;

class TaggablePivot extends Pivot // Wrong — should extend MorphPivot
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
    protected $casts = [
        'created_at' => 'datetime',
    ];
}
```
---
## Exceptions
None.
---
## Consequences Of Violation
Data corruption on write operations, broken type constraint enforcement.

## Rule: MorphPivot-Register-MorphMap
---
## Category
Architecture
---
## Rule
Always register `Relation::enforceMorphMap()` in production for polymorphic pivot relationships.
---
## Reason
Without a morph map, FQCNs like `App\Models\Post` are stored in the `*_type` column. Renaming the model class breaks all existing pivot rows. A morph map with short aliases prevents this.
---
## Bad Example
```php
// No morph map — stores FQCNs
Relation::morphMap([]); // Not configured
```
---
## Good Example
```php
// AppServiceProvider::boot()
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

## Rule: MorphPivot-Composite-Index
---
## Category
Performance
---
## Rule
Create a composite index on `(morph_type, morph_id, related_id)` in the polymorphic pivot migration.
---
## Reason
Polymorphic pivot queries always filter by `type` first, then by `id`. A composite index covering all three columns enables efficient index-only lookups.
---
## Bad Example
```php
Schema::create('taggables', function (Blueprint $table) {
    $table->morphs('taggable'); // Creates individual indexes
    $table->foreignIdFor(Tag::class);
    // No composite index — queries scan
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
Trivially small tables under 1,000 rows.
---
## Consequences Of Violation
Slow polymorphic pivot queries, full table scans.

## Rule: MorphPivot-Cascade-Cleanup-AppLevel
---
## Category
Reliability
---
## Rule
Add application-level cascade cleanup via `deleting` events since polymorphic foreign keys cannot use database `ON DELETE CASCADE`.
---
## Reason
Polymorphic columns (`*_type` + `*_id`) cannot have foreign key constraints. Deleting a parent model without application-level cleanup orphans pivot rows.
---
## Bad Example
```php
// No cleanup — deleting Post leaves orphaned taggable rows
$post->delete();
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
```
---
## Exceptions
When orphaned rows are acceptable or cleaned up via scheduled jobs.
---
## Consequences Of Violation
Orphaned pivot rows, data bloat, query pollution.

## Rule: MorphPivot-MorphName-Consistency
---
## Category
Reliability
---
## Rule
Ensure the same morph name is used in both `morphToMany()` on parent models and `morphedByMany()` on the shared model.
---
## Reason
Mismatched morph names between the two sides cause Eloquent to look in different columns, resulting in empty relationships.
---
## Bad Example
```php
// Post
public function tags(): MorphToMany
{
    return $this->morphToMany(Tag::class, 'taggable');
}
// Tag — mismatched morph name
public function posts(): MorphToMany
{
    return $this->morphedByMany(Post::class, 'categorizable');
}
```
---
## Good Example
```php
// Both use 'taggable'
public function tags(): MorphToMany
{
    return $this->morphToMany(Tag::class, 'taggable');
}
public function posts(): MorphToMany
{
    return $this->morphedByMany(Post::class, 'taggable');
}
```
---
## Exceptions
None.
---
## Consequences Of Violation
Empty relationship results, broken bidirectional access.

## Rule: MorphPivot-Orphan-Detection
---
## Category
Reliability
---
## Rule
Add scheduled cleanup jobs or queries to detect and remove orphaned polymorphic pivot rows.
---
## Reason
With no database foreign key constraints, orphaned rows accumulate silently when parent models are deleted without cleanup. Over time, this degrades query performance and produces incorrect results.
---
## Bad Example
```php
// No orphan detection — bloat accumulates silently
```
---
## Good Example
```php
// Scheduled command
$orphans = DB::table('taggables')
    ->leftJoin('posts', fn ($j) => $j->on('taggables.taggable_id', '=', 'posts.id')
        ->where('taggables.taggable_type', 'post'))
    ->whereNull('posts.id')
    ->delete();
```
---
## Exceptions
When cascade cleanup is reliably implemented on all parent models.
---
## Consequences Of Violation
Data bloat, slow queries, misleading results.

## Rule: MorphPivot-Validate-Type-Input
---
## Category
Security
---
## Rule
Validate that `*_type` values are in the registered morph map before allowing `attach()` or `sync()` operations.
---
## Reason
Accepting unvalidated type values allows storing arbitrary class names or invalid type aliases, corrupting the polymorphic relationship.
---
## Bad Example
```php
$post->tags()->attach($tagId);
// If morph map is enforced, this is safe; if not, type could be wrong
```
---
## Good Example
```php
// Rely on Relation::enforceMorphMap() to reject invalid types
return $this->morphToMany(Tag::class, 'taggable');
```
---
## Exceptions
None.
---
## Consequences Of Violation
Data corruption, broken relationship queries, runtime errors.
