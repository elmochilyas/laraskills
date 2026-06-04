## Add Searchable Per Model, Not Base Classes
---
## Category
Code Organization
---
## Rule
Always add the `Searchable` trait to individual Eloquent models, never to a base `Model` class.
---
## Reason
Adding `Searchable` to a base class makes every model searchable, causing unnecessary API calls and bloating indexes with non-searchable models like pivots or logs.
---
## Bad Example
```php
// BaseModel.php
class BaseModel extends Model
{
    use Searchable; // Every model now triggers index sync
}
```
---
## Good Example
```php
// Post.php
class Post extends Model
{
    use Searchable; // Only searchable models get the trait
}
```
---
## Exceptions
When every model in the application legitimately needs search and you have verified the index cost is acceptable.
---
## Consequences Of Violation
Unnecessary search engine API calls, index bloat, increased costs, degraded search relevance on non-searchable data.

## Customize toSearchableArray Always
---
## Category
Performance
---
## Rule
Always override `toSearchableArray()` to return only the fields needed for search display and filtering, never rely on the default `$this->toArray()`.
---
## Reason
The default sends all model attributes to the search engine, increasing storage costs, transfer time, and exposing sensitive fields.
---
## Bad Example
```php
class Post extends Model
{
    use Searchable;
    // Uses default toArray() — sends all columns including internal flags
}
```
---
## Good Example
```php
class Post extends Model
{
    use Searchable;

    public function toSearchableArray(): array
    {
        return [
            'title' => $this->title,
            'body' => $this->body,
            'author_name' => $this->author->name,
            'status' => $this->status,
        ];
    }
}
```
---
## Exceptions
Development/testing or models with very few attributes where all are safe and necessary to index.
---
## Consequences Of Violation
Index bloat, higher costs, slower searches, potential data exposure of sensitive fields.

## Implement shouldBeSearchable for Conditional Indexing
---
## Category
Design
---
## Rule
Always implement `shouldBeSearchable()` on models that have draft/published, active/inactive, or visibility-based states.
---
## Reason
Without gating, draft, archived, or inactive records appear in search results, degrading UX and potentially leaking unpublished content.
---
## Bad Example
```php
class Post extends Model
{
    use Searchable;
    // Draft posts appear in search results
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
        return $this->isPublished() && !$this->archived;
    }
}
```
---
## Exceptions
Models where every record should always be searchable regardless of state.
---
## Consequences Of Violation
Unpublished content appearing in search, poor UX, potential data leakage.

## Enable Queue for Production Searchable Models
---
## Category
Performance
---
## Rule
Always set `SCOUT_QUEUE=true` or configure `'queue' => true` in `config/scout.php` for production environments.
---
## Reason
Synchronous indexing adds search engine latency (20-200ms) to every HTTP response, degrading user experience and increasing page load times.
---
## Bad Example
```php
// config/scout.php
'queue' => false, // Every model save blocks on search engine in production
```
---
## Good Example
```php
// config/scout.php
'queue' => [
    'connection' => 'redis',
    'queue' => 'scout',
],
```
---
## Exceptions
Development and testing environments where synchronous indexing simplifies debugging.
---
## Consequences Of Violation
Slow HTTP responses, queued search engine calls under load, degraded user experience.

## Use withoutSyncingToSearch for Bulk Operations
---
## Category
Performance
---
## Rule
Always wrap bulk Eloquent operations (mass updates, imports, migrations) in `withoutSyncingToSearch()` and re-index afterward.
---
## Reason
Updating 10,000 records individually triggers 10,000 separate search engine API calls instead of one batch call, wasting time and resources.
---
## Bad Example
```php
foreach ($posts as $post) {
    $post->update(['status' => 'published']);
    // Each update triggers an index sync (10000 API calls)
}
```
---
## Good Example
```php
Post::withoutSyncingToSearch(function () use ($posts) {
    foreach ($posts as $post) {
        $post->update(['status' => 'published']);
    }
});
Post::whereIn('id', $posts->pluck('id'))->searchable();
```
---
## Exceptions
Real-time applications requiring immediate index consistency for each record change.
---
## Consequences Of Violation
Excessive API calls, slow bulk operations, rate limiting from search engine provider.

## Normalize Related Data in toSearchableArray
---
## Design
---
## Category
Design
---
## Rule
Always include related model data (author name, category, tags) in `toSearchableArray()` rather than relying on joins at query time.
---
## Reason
Search engines are denormalized by design. Related data must be embedded in the indexed document for filtering, display, and relevance scoring.
---
## Bad Example
```php
public function toSearchableArray(): array
{
    return $this->toArray(); // No related data, searches can't filter by author name
}
```
---
## Good Example
```php
public function toSearchableArray(): array
{
    return [
        'title' => $this->title,
        'author_name' => $this->author->name,
        'category' => $this->category->name,
    ];
}
```
---
## Exceptions
When related data is not needed for search display or filtering.
---
## Consequences Of Violation
Incomplete search results, inability to filter by related attributes, poor relevance.
