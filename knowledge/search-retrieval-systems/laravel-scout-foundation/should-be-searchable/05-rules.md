## Gate Indexing with shouldBeSearchable for Status-Based Models
---
## Category
Design
---
## Rule
Always implement `shouldBeSearchable()` on models where records have visibility states (published/draft, active/inactive, visible/hidden).
---
## Reason
Without explicit gating, all records are indexed regardless of state, causing unpublished, draft, or expired content to appear in search results.
---
## Bad Example
```php
class Post extends Model
{
    use Searchable;
    // Draft posts appear in public search results
}
```
---
## Good Example
```php
class Post extends Model
{
    use Searchable;

    public function shouldBeSearchable(): bool
    {
        return $this->isPublished();
    }
}
```
---
## Exceptions
Models where every record is always intended for search visibility.
---
## Consequences Of Violation
Unpublished content exposed in search, poor UX, potential data leakage.

## Keep shouldBeSearchable Logic Fast and Query-Free
---
## Category
Performance
---
## Rule
Never perform database queries inside `shouldBeSearchable()`; use preloaded relationship counts or cached attributes instead.
---
## Reason
`shouldBeSearchable()` is called on every model save. Database queries inside the method cause N+1 problems and dramatically slow down batch operations.
---
## Bad Example
```php
public function shouldBeSearchable(): bool
{
    return $this->comments()->count() > 5; // Query on every save!
}
```
---
## Good Example
```php
public function shouldBeSearchable(): bool
{
    return $this->comment_count > 5; // Uses cached counter
}
```
---
## Exceptions
Models with very low write frequency where query overhead is negligible.
---
## Consequences Of Violation
Slow saves, database load spikes during batch operations, timeout risk.

## Combine with searchIndexShouldBeUpdated for Efficiency
---
## Category
Performance
---
## Rule
Always implement `searchIndexShouldBeUpdated()` alongside `shouldBeSearchable()` to avoid re-indexing when only non-searchable attributes change.
---
## Reason
Without gating, saving a model (even for view counter increments) triggers index re-sync. `searchIndexShouldBeUpdated()` prevents this waste.
---
## Bad Example
```php
public function shouldBeSearchable(): bool
{
    return $this->isPublished();
}
// $post->increment('views') still triggers index sync
```
---
## Good Example
```php
public function searchIndexShouldBeUpdated(array $changes): bool
{
    return !empty(array_intersect(
        array_keys($changes), ['title', 'body', 'status']
    ));
}
```
---
## Exceptions
Models where every attribute change should trigger re-indexing.
---
## Consequences Of Violation
Wasteful index updates on every field change, queue congestion, unnecessary search engine load.
