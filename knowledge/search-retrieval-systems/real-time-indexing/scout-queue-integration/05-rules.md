---
## Rule Name
Always Async in Production

## Category
Performance

## Rule
Always enable Scout queue integration in production (`'queue' => true`); use synchronous only in development.

## Reason
Synchronous indexing adds search engine API latency to every HTTP response. Async moves it to background workers.

## Bad Example
```php
// config/scout.php
'queue' => false,  // Sync — blocks HTTP on every save
```

## Good Example
```php
// config/scout.php
'queue' => ['connection' => 'redis', 'queue' => 'scout'],
```

## Exceptions
Development and CI environments.

## Consequences Of Violation
User-facing HTTP responses delayed by search engine indexing.

---
## Rule Name
Use Dedicated Scout Queue

## Category
Reliability

## Rule
Always configure a dedicated queue name for scout jobs (e.g., `'queue' => 'scout'`).

## Reason
Mixing scout jobs with slow email or report jobs on the same queue causes indexing delays. A dedicated queue ensures fast throughput.

## Bad Example
```php
// Default queue — mixed with slow jobs
'queue' => true,
```

## Good Example
```php
// Dedicated queue
'queue' => ['connection' => 'redis', 'queue' => 'scout'],
```

## Exceptions
Very low-traffic applications where indexing load is negligible.

## Consequences Of Violation
Scout indexing stuck behind long-running jobs, causing index lag.

---
## Rule Name
Run Dedicated Queue Worker

## Category
Reliability

## Rule
Always run a dedicated queue worker for scout jobs with appropriate timeout.

## Reason
Without a running worker, queued indexing jobs never execute. Indexes silently fall out of sync.

## Bad Example
```bash
# No worker — queued jobs never processed
# queue=true but no worker running
```

## Good Example
```bash
# Dedicated worker for scout queue
php artisan queue:work redis --queue=scout,default --tries=3 --max-time=3600
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Silent index staleness — models never indexed despite queue configuration.
