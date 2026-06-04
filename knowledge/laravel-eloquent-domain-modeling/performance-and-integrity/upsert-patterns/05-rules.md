## Always Create a Unique Constraint Before Using upsert
---
## Category
Reliability
---
## Rule
Add a database unique index on the `$uniqueBy` columns before deploying code that calls `upsert()`.
---
## Reason
`$uniqueBy` tells Laravel which columns to reference in the `ON DUPLICATE KEY` / `ON CONFLICT` clause — but without a database-level unique constraint, the database has no mechanism to detect conflicts. Rows are inserted as duplicates silently. The constraint is the safety mechanism, not the `$uniqueBy` parameter.
---
## Bad Example
```php
// No unique constraint on email
User::upsert(
    $apiUsers,
    ['email'],           // References email in ON DUPLICATE KEY
    ['name', 'role']     // But without constraint, duplicates still insert
);
```
---
## Good Example
```php
// Migration: $table->string('email')->unique();
User::upsert(
    $apiUsers,
    ['email'],
    ['name', 'role']
);
// Unique constraint prevents duplicate inserts
```
---
## Exceptions
No common exceptions. Without the constraint, `upsert()` does not perform upsert — it inserts.
---
## Consequences Of Violation
Duplicate rows accumulate silently. The code claims to upsert but actually inserts every row. The first call creates records, subsequent calls create duplicates, and the dataset grows unbounded.
---
## Chunk Large Datasets to 500-1000 Records per Call
---
## Category
Performance
---
## Rule
Split datasets larger than 1000 records into chunks of 500-1000 before passing to `upsert()`.
---
## Reason
A single `upsert()` with 100k records generates an enormous SQL statement that may exceed MySQL's `max_allowed_packet` (default 64MB) or cause query timeouts. Chunking also limits the blast radius: if one chunk fails, the rest of the data is still processed.
---
## Bad Example
```php
User::upsert($apiUsers, ['email'], ['name', 'updated_at']);
// $apiUsers has 50,000 records — SQL statement may exceed packet limit
```
---
## Good Example
```php
collect($apiUsers)->chunk(500)->each(function ($chunk) {
    User::upsert($chunk->toArray(), ['email'], ['name', 'updated_at']);
});
// Each statement handles 500 records — safe for packet limits
```
---
## Exceptions
Trivially small datasets (< 1000 records) that fit within a single statement without risk.
---
## Consequences Of Violation
Query failures due to `max_allowed_packet` (MySQL) or statement timeout. The entire upsert operation fails, requiring a retry from scratch.
---
## Always Include updated_at in $update
---
## Category
Maintainability
---
## Rule
Explicitly include `'updated_at' => now()` in the `$update` array of every `upsert()` call.
---
## Reason
`upsert()` bypasses Eloquent's automatic timestamp handling. Matched rows do not receive a new `updated_at` value unless explicitly specified. Without it, `updated_at` remains at the original creation time, breaking time-based reporting and caching logic.
---
## Bad Example
```php
User::upsert(
    $apiUsers,
    ['email'],
    ['name', 'role'] // updated_at not included — stale timestamps
);
// Matched users keep their original created_at in updated_at
```
---
## Good Example
```php
User::upsert(
    $apiUsers,
    ['email'],
    ['name', 'role', 'updated_at' => now()] // Explicit timestamp update
);
// Matched rows have current updated_at
```
---
## Exceptions
Tables that do not use timestamp columns (rare). Document the exception.
---
## Consequences Of Violation
Stale `updated_at` values on upserted rows. Caching systems that key on `updated_at` (e.g., `Model::where('updated_at', '>', $lastSync)`) miss updated records, causing stale data to be served indefinitely.
---
## Handle Model Events Separately
---
## Category
Maintainability
---
## Rule
Do not rely on model lifecycle events (`creating`, `created`, `updating`, `updated`, `saving`, `saved`) when using `upsert()`.
---
## Reason
`upsert()` operates at the query builder level, bypassing all Eloquent model events. Code that depends on events for logging, cache invalidation, webhooks, or other side effects will not execute. Handle these side effects explicitly before or after the upsert call.
---
## Bad Example
```php
class User extends Model
{
    protected static function booted(): void
    {
        static::updated(fn($user) => $user->invalidateCache());
    }
}
User::upsert($apiUsers, ['email'], ['name', 'updated_at' => now()]);
// Cache is never invalidated — booted() events do not fire
```
---
## Good Example
```php
// Query IDs before upsert to detect changes
$beforeEmails = User::whereIn('email', $emails)->pluck('email');
User::upsert($apiUsers, ['email'], ['name', 'updated_at' => now()]);
// Refresh cache for affected users explicitly
$updatedEmails = User::whereIn('email', $emails)->pluck('email');
User::whereIn('email', $updatedEmails)->get()->each->invalidateCache();
```
---
## Exceptions
No common exceptions. If model events are critical, use individual `updateOrCreate()` calls (accepting the performance cost) or implement post-upsert change tracking.
---
## Consequences Of Violation
Missing side effects — cache not invalidated, webhooks not sent, logs not written. The application state becomes inconsistent between the database and dependent systems.
---
## Never Include Auto-Increment PK in $update
---
## Category
Reliability
---
## Rule
Exclude the auto-increment primary key column from the `$update` array in `upsert()`.
---
## Reason
Including the PK in `$update` generates `ON DUPLICATE KEY UPDATE id = VALUES(id)`. This attempts to overwrite the auto-increment value, which causes unexpected behavior — it may succeed (assigning a new ID to an existing row) or fail with an integrity constraint error depending on the database engine.
---
## Bad Example
```php
User::upsert(
    $apiUsers,
    ['email'],
    ['id', 'name', 'email'] // id in $update — overwrites auto-increment
);
```
---
## Good Example
```php
User::upsert(
    $apiUsers,
    ['email'],
    ['name', 'email', 'updated_at' => now()] // id excluded
);
// Auto-increment preserved for new rows; not modified on conflict
```
---
## Exceptions
Tables using UUID primary keys (not auto-increment). UUID PKs can be safely included in `$update` if needed.
---
## Consequences Of Violation
Corrupted primary key assignments. Existing rows may receive new IDs, breaking foreign key references in related tables. This is difficult to detect until related queries return incorrect results.
---
## Validate All Incoming Data Before upsert
---
## Category
Security
---
## Rule
Validate and sanitize all data before passing it to `upsert()` — do not rely on Eloquent attribute casting or model validation.
---
## Reason
`upsert()` bypasses the Eloquent model layer entirely, including attribute casting (`$casts`), accessors, mutators, and validation rules. Raw data goes directly to the database. Untrusted input could insert malformed or malicious data without the usual Eloquent protections.
---
## Bad Example
```php
class User extends Model
{
    protected $casts = ['is_admin' => 'boolean'];
}
User::upsert(
    $externalApiData, // Untrusted data from external API
    ['email'],
    ['name', 'is_admin', 'updated_at' => now()]
);
// is_admin bypasses boolean cast — "1" or arbitrary string stored directly
```
---
## Good Example
```php
$validated = collect($externalApiData)->map(fn($row) => [
    'email' => filter_var($row['email'], FILTER_VALIDATE_EMAIL),
    'name' => strip_tags($row['name']),
    'is_admin' => filter_var($row['is_admin'] ?? false, FILTER_VALIDATE_BOOLEAN),
    'updated_at' => now(),
]);
User::upsert($validated->toArray(), ['email'], ['name', 'is_admin', 'updated_at']);
```
---
## Exceptions
Trusted internal data sources (internal microservices, system-generated data) where validation is guaranteed upstream.
---
## Consequences Of Violation
Malformed or malicious data stored in the database. SQL injection via raw data (if using raw queries), broken application logic due to incorrect data types, or privilege escalation if casting bypassed for security-sensitive columns.
