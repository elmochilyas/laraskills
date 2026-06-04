---
## Rule Name
Enable Queue in Production Only

## Category
Performance

## Rule
Set `'queue' => true` in production Scout config and disable in development/CI environments.

## Reason
Queueing prevents search latency from affecting HTTP response time in production. Development benefits from synchronous simplicity for debugging.

## Bad Example
```php
// config/scout.php (production)
'queue' => false,  // Blocks HTTP on save
```

## Good Example
```php
// config/scout.php (production)
'queue' => true,

// .env.development
SCOUT_QUEUE=false
```

## Exceptions
No common exceptions.

## Consequences Of Violation
HTTP requests blocked by search engine indexing in production.

---
## Rule Name
Configure Retry Count for Transient Failures

## Category
Reliability

## Rule
Always configure an appropriate retry count (3-5) for Scout queue jobs.

## Reason
Network issues and search engine throttling are transient. Retries handle these without manual intervention.

## Bad Example
```php
// No retry — transient failure causes permanent failure
'queue' => ['connection' => 'redis'],
```

## Good Example
```php
// config/scout.php
'queue' => [
    'connection' => 'redis',
    'queue' => 'scout',
    'retry_after' => 90,
],
// Worker with retries
// php artisan queue:work redis --queue=scout --tries=3
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Transient failures (network blips, rate limits) cause permanent indexing failures.

---
## Rule Name
Monitor Failed Indexing Jobs

## Category
Maintainability

## Rule
Always monitor the `failed_jobs` table for Scout indexing failures.

## Reason
Silent indexing failures cause database and index drift. Monitoring detects failures before users notice stale search results.

## Bad Example
```bash
# Failed_jobs never checked — silent drift
```

## Good Example
```php
// Scheduled health check
$schedule->call(function () {
    $failedCount = DB::table('failed_jobs')
        ->where('queue', 'scout')
        ->where('failed_at', '>=', now()->subDay())
        ->count();
    if ($failedCount > 10) {
        Log::warning("Scout indexing failures: $failedCount in last 24h");
    }
})->hourly();
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Undetected indexing drift between database and search index.
