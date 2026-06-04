# Polymorphic (MorphOne / MorphMany) Rules

## Rule: Polymorphic-Register-MorphMap
---
## Category
Architecture
---
## Rule
Always register `Relation::enforceMorphMap()` in production to prevent FQCNs from being stored in the `*_type` column.
---
## Reason
Without a morph map, model FQCNs (`App\Models\Post`) are stored as strings. Renaming the model class breaks all existing polymorphic rows. Short aliases with enforced mapping prevent this.
---
## Bad Example
```php
// No morph map — stores FQCNs
```
---
## Good Example
```php
// AppServiceProvider::boot()
Relation::morphMap([
    'user' => User::class,
    'post' => Post::class,
    'product' => Product::class,
]);
Relation::enforceMorphMap();
```
---
## Exceptions
None.
---
## Consequences Of Violation
Broken polymorphic relationships on model rename, production outages.

## Rule: Polymorphic-Composite-Index
---
## Category
Performance
---
## Rule
Create a composite index on `(morph_id, morph_type)` in the polymorphic child table migration.
---
## Reason
Polymorphic queries always filter by both the `*_id` and `*_type` columns. Indexing only one column leaves the other unfiltered, forcing a scan.
---
## Bad Example
```php
Schema::create('images', function (Blueprint $table) {
    $table->morphs('imageable'); // Creates separate indexes
    // No composite index on (imageable_id, imageable_type)
});
```
---
## Good Example
```php
Schema::create('images', function (Blueprint $table) {
    $table->morphs('imageable');
    $table->index(['imageable_id', 'imageable_type']); // Composite
});
```
---
## Exceptions
Trivially small tables.
---
## Consequences Of Violation
Slow polymorphic queries, full table scans on type filter.

## Rule: Polymorphic-Cascade-Delete-Via-Events
---
## Category
Reliability
---
## Rule
Add `deleting` event handlers on every parent model that has polymorphic children to cascade cleanup.
---
## Reason
Polymorphic foreign keys cannot use database `ON DELETE CASCADE`. Without application-level cascade, deleting a parent orphans its polymorphic children.
---
## Bad Example
```php
class Post extends Model
{
    // No cascade — deleting Post leaves orphaned Images
}
```
---
## Good Example
```php
class Post extends Model
{
    protected static function booted(): void
    {
        static::deleting(fn ($post) => $post->images()->delete());
    }
}
```
---
## Exceptions
When orphans are cleaned up via scheduled jobs.
---
## Consequences Of Violation
Orphaned polymorphic children, data bloat, storage waste.

## Rule: Polymorphic-Not-For-Single-Type
---
## Category
Design
---
## Rule
Do not use polymorphic relationships when the child always belongs to a single parent type — use `HasOne`/`HasMany` instead.
---
## Reason
Polymorphic relationships add complexity, lose foreign key constraints, and require composite indexes. For single-parent-type scenarios, direct relationships are simpler and more performant.
---
## Bad Example
```php
class Image extends Model
{
    public function imageable(): MorphTo
    {
        return $this->morphTo();
    }
}
// Image always belongs to User — no polymorphism needed
```
---
## Good Example
```php
class Image extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
```
---
## Exceptions
When the domain explicitly requires extensibility to multiple parent types.
---
## Consequences Of Violation
Unnecessary complexity, lost referential integrity, performance overhead.

## Rule: Polymorphic-Not-For-Financial-Data
---
## Category
Security
---
## Rule
Do not use polymorphic relationships for critical financial data that requires referential integrity.
---
## Reason
Polymorphic columns cannot have foreign key constraints. Data integrity depends entirely on application code, which is insufficient for financial or audit-critical data.
---
## Bad Example
```php
class Transaction extends Model
{
    public function transactable(): MorphTo
    {
        return $this->morphTo();
    }
}
// No FK constraint — financial data integrity at risk
```
---
## Good Example
```php
class Transaction extends Model
{
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
// FK constraint enforces referential integrity
```
---
## Exceptions
When no other architecture is feasible and application-level integrity is rigorously tested.
---
## Consequences Of Violation
Data integrity corruption, financial reconciliation failures, compliance violations.

## Rule: Polymorphic-MorphTo-Inverse
---
## Category
Architecture
---
## Rule
Always define `morphTo()` on the child model — without it, the child cannot access its parent.
---
## Reason
`morphTo()` is the inverse side of polymorphic relationships. Omitting it breaks the parent navigation from the child, making the relationship one-directional.
---
## Bad Example
```php
class Image extends Model
{
    // No morphTo() — imageable() not defined
    // $image->imageable throws error
}
```
---
## Good Example
```php
class Image extends Model
{
    public function imageable(): MorphTo
    {
        return $this->morphTo();
    }
}
```
---
## Exceptions
None.
---
## Consequences Of Violation
Missing inverse navigation, runtime errors on child-to-parent access.

## Rule: Polymorphic-Validate-Type-Input
---
## Category
Security
---
## Rule
Validate that the `*_type` value is in the registered morph map before allowing polymorphic writes.
---
## Reason
Accepting arbitrary class names from user input as the morph type allows storing invalid or malicious type references, corrupting the relationship.
---
## Bad Example
```php
// Accepting user input directly as morph type
Image::create([
    'imageable_type' => $request->input('type'), // Arbitrary class name
    'imageable_id' => $request->input('id'),
]);
```
---
## Good Example
```php
// Morph map validation
$allowed = array_keys(Relation::morphMap());
if (! in_array($request->input('type'), $allowed)) {
    throw new InvalidArgumentException('Invalid morph type');
}
Image::create([
    'imageable_type' => $request->input('type'),
    'imageable_id' => $request->input('id'),
]);
```
---
## Exceptions
When the type value comes from a trusted internal source only.
---
## Consequences Of Violation
Data corruption, relationship integrity failures, security vulnerabilities.

## Rule: Polymorphic-Orphan-Detection
---
## Category
Reliability
---
## Rule
Add scheduled orphan detection queries to find polymorphic children with no valid parent.
---
## Reason
Without foreign key constraints, orphaned children accumulate silently. Scheduled detection prevents long-term data bloat and query degradation.
---
## Bad Example
```php
// No orphan detection — orphans grow silently
```
---
## Good Example
```php
// Scheduled command
$orphans = Image::query()
    ->where('imageable_type', 'post')
    ->whereDoesntHave('imageable')
    ->delete();
```
---
## Exceptions
When cascade cleanup is reliably implemented on all parent models.
---
## Consequences Of Violation
Storage bloat, slower queries over time, stale data.
