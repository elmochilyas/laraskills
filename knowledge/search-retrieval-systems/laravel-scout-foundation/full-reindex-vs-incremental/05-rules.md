## Run Full Re-Index After Schema Changes
---
## Category
Reliability
---
## Rule
Always run `php artisan scout:import` after any index schema change (new fields, changed mappings, filterable/sortable attribute updates).
---
## Reason
Incremental indexing does not backfill existing records with new fields. Records indexed before the schema change will lack the new field, causing inconsistent search results.
---
## Bad Example
```php
// Added 'price' field to toSearchableArray()
// But didn't re-index — existing records don't have 'price'
```
---
## Good Example
```php
// After schema change
Artisan::call('scout:import', ['model' => Product::class]);
```
---
## Exceptions
Schema changes that only affect new records (e.g., optional metadata fields).
---
## Consequences Of Violation
Missing fields on existing indexed records, inconsistent filtering, partial search results.

## Use Incremental Indexing as Primary Production Sync
---
## Category
Reliability
---
## Rule
Always rely on incremental indexing (model event-driven sync) as the primary mechanism for keeping search indexes up to date in production.
---
## Reason
Full re-index is expensive and time-consuming. Running it after every write would create unacceptable delays. Incremental sync ensures near-real-time index consistency for day-to-day operations.
---
## Bad Example
```php
// Only re-index on cron — index is hours stale
$schedule->command('scout:import')->hourly();
```
---
## Good Example
```php
// .env — queue enabled for incremental sync
SCOUT_QUEUE=true

// Monthly full re-index for drift correction
$schedule->command('scout:import')->monthly();
```
---
## Exceptions
Applications where near-real-time consistency is not required and batch-only indexing is acceptable.
---
## Consequences Of Violation
Consistently stale search results, poor user experience.

## Schedule Periodic Full Re-Index for Drift Correction
---
## Category
Reliability
---
## Rule
Always schedule periodic full re-index (e.g., weekly or monthly) even when incremental indexing is in place.
---
## Reason
Incremental indexing can miss updates due to queue failures, job timeouts, or edge cases in model events. Periodic full re-index corrects any accumulated drift.
---
## Bad Example
```php
// Relying solely on incremental indexing — no correction mechanism
```
---
## Good Example
```php
// Weekly re-index for drift correction
$schedule->command('scout:import', ['model' => Product::class])
    ->weekly()
    ->evenInMaintenanceMode()
    ->emailOutputTo('devops@example.com');
```
---
## Exceptions
Applications with extremely low write volume where drift is unlikely.
---
## Consequences Of Violation
Silent data drift, inconsistent search results, gradual decline in search quality.

## Use makeAllSearchableUsing for Efficient Full Re-Index
---
## Category
Performance
---
## Rule
Always configure `makeAllSearchableUsing()` with eager-loaded relations before running `scout:import` on models with relationship data in `toSearchableArray()`.
---
## Reason
Without eager loading, `scout:import` triggers N+1 queries for each record — 10,000 records with 3 relations = 30,001 queries instead of 4.
---
## Bad Example
```php
// No makeAllSearchableUsing — scout:import triggers 30K+ queries
```
---
## Good Example
```php
public function makeAllSearchableUsing($query)
{
    return $query->with(['author', 'category']);
}
```
---
## Exceptions
Models where `toSearchableArray()` only uses model's own attributes.
---
## Consequences Of Violation
Extremely slow import, database overload, import timeout failures.
