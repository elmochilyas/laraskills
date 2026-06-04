---
## Rule Name
Monitor Failed Indexing Jobs Daily

## Category
Maintainability

## Rule
Always monitor the `failed_jobs` table daily for Scout indexing failures.

## Reason
Failed indexing jobs cause database-index drift. Without monitoring, failures go undetected until users complain about stale results.

## Bad Example
```bash
# Failed_jobs never checked — indexing may be silently failing
```

## Good Example
```php
$schedule->daily(function () {
    $failures = DB::table('failed_jobs')
        ->where('queue', 'scout')
        ->where('failed_at', '>=', now()->subDay())
        ->count();
    if ($failures > 0) {
        Log::warning("$failures scout indexing jobs failed in last 24h");
    }
});
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Silent index staleness — users search against outdated data.

---
## Rule Name
Implement Database Fallback on Engine Failure

## Category
Reliability

## Rule
Always implement a database query fallback when the search engine is unavailable.

## Reason
Search engine downtime should not break the entire search feature. A basic database query provides degraded but functional search.

## Bad Example
```php
// Search fails entirely when engine is down
Product::search($query)->get();  // 500 error
```

## Good Example
```php
try {
    return Product::search($query)->get();
} catch (SearchException $e) {
    Log::warning('Search engine unavailable, falling back to DB');
    return Product::where('name', 'like', "%$query%")->get();
}
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Complete search outage when the search engine experiences downtime.

---
## Rule Name
Run Periodic Consistency Checks

## Category
Reliability

## Rule
Always schedule periodic checks comparing database record count to search index document count.

## Reason
Undetected indexing drift accumulates over time. A count comparison reveals when database and index are out of sync.

## Bad Example
```bash
# No consistency check — drift grows silently
```

## Good Example
```php
$schedule->weekly(function () {
    $dbCount = Product::count();
    $indexCount = Product::search('')->count();
    $diff = abs($dbCount - $indexCount);
    if ($diff > 0.01 * $dbCount) {
        Log::warning("Index count differs from DB by $diff records");
        Artisan::call('scout:import', ['model' => Product::class]);
    }
});
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Gradual, undetected data drift between database and search index.
