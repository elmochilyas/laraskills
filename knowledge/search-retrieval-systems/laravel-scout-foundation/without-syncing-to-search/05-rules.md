## Always Use withoutSyncingToSearch for Bulk Updates
---
## Category
Performance
---
## Rule
Always wrap bulk model updates affecting 100+ records in `withoutSyncingToSearch()` to prevent individual per-record index API calls.
---
## Reason
Without suspending sync, updating 10,000 records triggers 10,000 separate search engine API calls (each 20-200ms), causing massive slowdown and potential API rate limiting.
---
## Bad Example
```php
foreach ($posts as $post) {
    $post->update(['status' => 'published']); // N API calls
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
Post::whereIn('id', $posts->pluck('id'))->searchable(); // Batch re-index
```
---
## Exceptions
Real-time applications where immediate per-record index consistency is critical.
---
## Consequences Of Violation
Very slow bulk operations, API rate limit hits, search engine load spikes.

## Always Re-Index After withoutSyncingToSearch
---
## Category
Reliability
---
## Rule
Always call `searchable()` on affected records after a `withoutSyncingToSearch()` block to restore index consistency.
---
## Reason
The most common mistake is forgetting to re-index — records remain in their pre-update state in the search index, causing stale search results.
---
## Bad Example
```php
Post::withoutSyncingToSearch(function () use ($posts) {
    foreach ($posts as $post) {
        $post->update(['status' => 'published']);
    }
});
// Forgot to re-index — index still shows old status
```
---
## Good Example
```php
Post::withoutSyncingToSearch(function () use ($posts) {
    foreach ($posts as $post) {
        $post->update(['status' => 'published']);
    }
});
$posts->searchable(); // Re-index ensures consistency
```
---
## Exceptions
When records will be re-indexed by a separate scheduled job or external process.
---
## Consequences Of Violation
Stale search results, inconsistent database and index states, user-facing data discrepancies.

## Use Chunked Re-Indexing After Bulk Operations
---
## Category
Performance
---
## Rule
Always re-index in chunks after `withoutSyncingToSearch()` to avoid memory exhaustion on large datasets.
---
## Reason
Calling `searchable()` on 50,000 records without chunking loads all records into memory at once and sends one massive bulk request.
---
## Bad Example
```php
Post::withoutSyncingToSearch(function () {
    Post::where('status', 'published')->update(['featured' => true]);
});
Post::where('status', 'published')->searchable(); // 50K records at once
```
---
## Good Example
```php
Post::withoutSyncingToSearch(function () {
    Post::where('status', 'published')->update(['featured' => true]);
});
Post::where('status', 'published')
    ->chunkById(500, fn($chunk) => $chunk->searchable());
```
---
## Exceptions
Small datasets (< 1000 records) where memory is not a concern.
---
## Consequences Of Violation
Memory exhaustion, failed re-index, PHP crash during bulk operations.
