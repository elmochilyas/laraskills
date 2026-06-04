# withDefault Rules

## Rule: WithDefault-Only-Singular
---
## Category
Framework Usage
---
## Rule
Only apply `withDefault()` on singular relationships: `BelongsTo`, `HasOne`, and `MorphOne`.
---
## Reason
`withDefault()` is not supported on `HasMany` or `BelongsToMany`. Applying it to collection-returning relationships has no effect or causes unexpected behavior.
---
## Bad Example
```php
public function posts(): HasMany
{
    return $this->hasMany(Post::class)->withDefault();
    // withDefault does not work on HasMany
}
```
---
## Good Example
```php
public function author(): BelongsTo
{
    return $this->belongsTo(Author::class)->withDefault();
}
```
---
## Exceptions
None.
---
## Consequences Of Violation
Silent no-op, developer confusion about why default behavior isn't working.

## Rule: WithDefault-Not-For-Data-Loss
---
## Category
Reliability
---
## Rule
Do not use `withDefault()` to mask missing data that should be investigated.
---
## Reason
`withDefault()` returns a fake model for missing relationships, hiding data integrity problems. Missing relationships that should exist indicate data loss or bugs.
---
## Bad Example
```php
// Author is required — but withDefault hides missing authors
public function author(): BelongsTo
{
    return $this->belongsTo(Author::class)->withDefault(['name' => 'Unknown']);
}
```
---
## Good Example
```php
// Author is required — let it return null so missing data is obvious
public function author(): BelongsTo
{
    return $this->belongsTo(Author::class);
}
```
---
## Exceptions
When the relationship is genuinely optional and a null object is the correct domain behavior.
---
## Consequences Of Violation
Hidden data integrity issues, delayed bug detection, undiagnosed data loss.

## Rule: Check-Exists-On-Default
---
## Category
Reliability
---
## Rule
Check `$model->exists` on default models when the code needs to distinguish between a real and default relationship.
---
## Reason
Default models have `$exists = false`, making them distinguishable from persisted models. Code that needs to treat them differently must check this flag.
---
## Bad Example
```php
if ($post->author === null) {
    // This block never runs — author is always a default model
}
```
---
## Good Example
```php
if (! $post->author->exists) {
    // This is a default model — no real author exists
    echo $post->author->name . ' (auto-generated)';
}
```
---
## Exceptions
When distinguishing between default and real is not needed.
---
## Consequences Of Violation
Logic that never executes, unreachable branches, incorrect application behavior.

## Rule: WithDefault-Callback-Not-Heavy
---
## Category
Performance
---
## Rule
Do not perform expensive database queries or API calls inside `withDefault()` callables.
---
## Reason
The `withDefault()` callable executes every time the relationship is accessed when no real related model exists. Heavy operations in the callable cause unpredictable slowdowns.
---
## Bad Example
```php
public function author(): BelongsTo
{
    return $this->belongsTo(Author::class)->withDefault(fn ($post) => 
        Author::where('email', $post->author_email)->first() ?? new Author()
    );
    // Database query every time no author exists
}
```
---
## Good Example
```php
public function author(): BelongsTo
{
    return $this->belongsTo(Author::class)->withDefault([
        'name' => 'Guest',
    ]);
}
```
---
## Exceptions
When the callable performs a simple, cheap operation (no database queries).
---
## Consequences Of Violation
Slow relationship access, N+1-like performance problems.

## Rule: WithDefault-Save-Awareness
---
## Category
Framework Usage
---
## Rule
Do not expect `save()` on a default model to auto-associate the foreign key back to the parent.
---
## Reason
Default models have `$exists = false`. Calling `save()` creates a new database record but does NOT update the parent's foreign key — the parent still has no real relationship.
---
## Bad Example
```php
$default = $post->author;
$default->name = 'Real Author';
$default->save();
// $post->author_id is still null — save didn't update parent
```
---
## Good Example
```php
// Create through the relationship to auto-associate
$post->author()->save(new Author(['name' => 'Real Author']));
```
---
## Exceptions
When manual FK assignment follows the save.
---
## Consequences Of Violation
Unlinked records, mystery orphan data.

## Rule: WithDefault-Serialization-Impact
---
## Category
Security
---
## Rule
Be aware that introducing `withDefault()` changes API serialization: null becomes an object with default values.
---
## Reason
Adding `withDefault()` to an existing relationship changes the JSON response shape. Clients expecting `"author": null` now receive `"author": {"name": "Guest"}`. This can break API contracts.
---
## Bad Example
```php
// API client checks: if (data.author === null) — this never triggers after withDefault
// Changed producer without notifying consumers
```
---
## Good Example
```php
// Document API contract change or use conditional inclusion
public function toArray($request): array
{
    return [
        'author' => $this->author->exists ? $this->author : null,
    ];
}
```
---
## Exceptions
When the API contract explicitly documents that the relationship is never null.
---
## Consequences Of Violation
Broken API clients, unexpected response shapes, integration failures.

## Rule: WithDefault-Accessor-Safety
---
## Category
Reliability
---
## Rule
Ensure that default model attribute values do not trigger null errors in accessors, casts, or computed properties.
---
## Reason
Default models have default attributes (often null). If accessors or casts assume database values exist, accessing them on the default model throws errors.
---
## Bad Example
```php
class Author extends Model
{
    public function getDisplayNameAttribute(): string
    {
        return $this->first_name . ' ' . $this->last_name;
        // Fails if first_name or last_name is null on default model
    }
}

// withDefault() on relationship — display_name crashes
```
---
## Good Example
```php
public function getDisplayNameAttribute(): string
{
    return trim(($this->first_name ?? '') . ' ' . ($this->last_name ?? '')) ?: 'Unknown';
}
```
---
## Exceptions
When default attributes are set to non-null values that satisfy the accessor.
---
## Consequences Of Violation
Runtime crashes on default model access, 500 errors.
