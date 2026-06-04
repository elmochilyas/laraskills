## Combine Batch and Incremental Indexing Strategies
---
## Category
Architecture
---
## Rule
Always implement both batch (full re-index) and incremental (event-driven) indexing strategies in production search applications.
---
## Reason
Using only batch indexing leaves the index stale between runs. Using only incremental indexing provides no recovery mechanism after corruption. Both strategies together provide completeness and recovery.
---
## Bad Example
```php
// Only incremental — no recovery mechanism
// Queue failure loses records permanently
```
---
## Good Example
```php
// Incremental for day-to-day sync
SCOUT_QUEUE=true

// Batch for initial load and scheduled recovery
$schedule->command('scout:import', ['model' => Product::class])
    ->monthly();
```
---
## Exceptions
Very small datasets that can be fully re-indexed on every change in under 1 second.
---
## Consequences Of Violation
No recovery from corrupted index, permanent data loss on queue failures.

## Enable Queue for Incremental Indexing in Production
---
## Category
Performance
---
## Rule
Always enable `SCOUT_QUEUE=true` in production environments for incremental indexing.
---
## Reason
Sync indexing adds search engine round-trip latency (20-200ms) to every write request. Queue mode decouples writes from index updates, keeping API response times fast.
---
## Bad Example
```php
// .env.production
SCOUT_QUEUE=false // Every save waits for search engine
```
---
## Good Example
```php
// .env.production
SCOUT_QUEUE=true
```
---
## Exceptions
Real-time applications requiring immediate index consistency on every write.
---
## Consequences Of Violation
Slow API responses, degraded user experience, potential request timeouts.

## Implement Conditional Indexing with shouldBeSearchable
---
## Category
Design
---
## Rule
Always implement `shouldBeSearchable()` on models where records have visibility states (published/draft, active/inactive) to gate which records are indexed.
---
## Reason
Without conditional indexing, all records are indexed regardless of state, causing draft, expired, or restricted content to appear in search results.
---
## Bad Example
```php
// No shouldBeSearchable — draft posts appear in search
class Post extends Model { use Searchable; }
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
Restricted content exposed in search, poor UX, data leakage.
