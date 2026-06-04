---
## Rule Name
Always Enable Queue in Production

## Category
Performance

## Rule
Always enable Scout's queue integration in production environments (`'queue' => true`).

## Reason
Synchronous indexing adds 20-200ms of search engine latency to every HTTP response. Queueing moves this to background workers.

## Bad Example
```php
// config/scout.php
'queue' => false,  // Sync in production — blocks HTTP responses
```

## Good Example
```php
// config/scout.php
'queue' => [
    'connection' => 'redis',
    'queue' => 'scout',
],
```

## Exceptions
Development and CI environments where simplicity matters over performance.

## Consequences Of Violation
HTTP response times inflated by search engine indexing latency on every model save.

---
## Rule Name
Implement searchIndexShouldBeUpdated

## Category
Performance

## Rule
Always implement `searchIndexShouldBeUpdated()` to gate indexing against non-searchable field changes.

## Reason
Frequently updated fields (view counts, timestamps) trigger unnecessary re-indexing. Gating avoids wasteful API calls.

## Bad Example
```php
// Indexing on every field change — view counter triggers re-index
public function searchIndexShouldBeUpdated(array $changes): bool
{
    return true;  // Always re-index — wasteful
}
```

## Good Example
```php
public function searchIndexShouldBeUpdated(array $changes): bool
{
    return !empty(array_intersect(
        array_keys($changes),
        ['title', 'body', 'tags', 'status']
    ));
}
```

## Exceptions
Models where every field change should be reflected in search immediately.

## Consequences Of Violation
Wasteful re-indexing on trivial updates like view counter increments.

---
## Rule Name
Use withoutSyncingToSearch for Bulk Operations

## Category
Performance

## Rule
Always wrap bulk Eloquent operations in `withoutSyncingToSearch()` to avoid redundant index calls.

## Reason
Bulk updates on thousands of records trigger N individual index calls. `withoutSyncingToSearch()` skips them, and a single `scout:import` catches up.

## Bad Example
```php
// 10K records — 10K individual index calls
Product::where('category', 'old')->update(['category' => 'new']);
```

## Good Example
```php
Product::withoutSyncingToSearch(function () {
    Product::where('category', 'old')->update(['category' => 'new']);
});
// Then re-import affected records
Artisan::call('scout:import', ['model' => Product::class]);
```

## Exceptions
Small batch operations (<10 records) where individual sync overhead is negligible.

## Consequences Of Violation
N redundant index API calls for bulk operations, causing performance degradation.
