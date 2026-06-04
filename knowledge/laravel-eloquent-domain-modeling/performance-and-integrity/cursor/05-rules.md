## Never Access Relationships Inside a Cursor Loop
---
## Category
Performance
---
## Rule
Do not access Eloquent relationships inside a `cursor()` iteration loop.
---
## Reason
`cursor()` silently ignores `with()` calls — eager loading does not work. Each `$model->relation` access inside the loop triggers a separate query, producing an N+1 disaster. For 100k rows, this generates 100k extra queries.
---
## Bad Example
```php
foreach (User::with('profile')->cursor() as $user) {
    echo $user->profile->display_name; // with() is ignored — N+1 per row
}
```
---
## Good Example
```php
foreach (User::cursor() as $user) {
    echo $user->name; // No relationship access — single query only
}
```
---
## Exceptions
Use `lazy()` with `with()` when relationships are needed in the loop body. Cursor is for relationship-free row-by-row processing.
---
## Consequences Of Violation
N+1 query explosion — 100k rows become 100k+1 queries. The database connection is overwhelmed, processing time increases from seconds to hours, and the database server may become unresponsive.
---
## Only Use Cursor in CLI or Queue Contexts
---
## Category
Architecture
---
## Rule
Confine `cursor()` usage to artisan commands, queue jobs, and background processes — never in web controllers or middleware.
---
## Reason
`cursor()` holds the database connection open for the entire iteration duration. In a web request (typically 30-60s timeout), this blocks the connection from the pool and risks timeout. The connection is not released until iteration completes or the request ends.
---
## Bad Example
```php
class UserController
{
    public function export()
    {
        foreach (User::cursor() as $user) {
            // Connection held for entire HTTP response
            // Web server may timeout, connection pool starves
        }
    }
}
```
---
## Good Example
```php
class ExportUsersJob implements ShouldQueue
{
    public function handle(): void
    {
        foreach (User::cursor() as $user) {
            // Background processing — no timeout concern
        }
    }
}
```
---
## Exceptions
No common exceptions. Web requests must complete quickly; cursor is fundamentally incompatible with request-response cycles.
---
## Consequences Of Violation
Connection pool exhaustion — all available database connections held by slow cursor iterations. New requests hang waiting for a connection, causing application-wide outage.
---
## Do Not Materialize the LazyCollection
---
## Category
Performance
---
## Rule
Iterate the `LazyCollection` returned by `cursor()` directly with `foreach` or `->each()`. Never call `->toArray()`, `->all()`, or `collect()` on it.
---
## Reason
Calling materialization methods forces the entire result set into memory at once, defeating the memory-efficiency purpose of `cursor()`. For a 10-million-row dataset, materialization consumes memory proportional to the full dataset.
---
## Bad Example
```php
$users = User::cursor()->toArray(); // All rows loaded into memory
foreach ($users as $user) { ... } // Cursor benefit lost
```
---
## Good Example
```php
foreach (User::cursor() as $user) {
    // One model in memory at a time
}
```
---
## Exceptions
Small datasets (< 1000 rows) where materialization overhead is negligible — but then `get()` is simpler.
---
## Consequences Of Violation
Memory exhaustion for large datasets. The PHP process runs out of memory and is killed, or swap thrashes, degrading the entire server. The exact data volume that causes failure depends on row size and PHP memory limit.
---
## Set a Generous Connection Timeout for Cursor Jobs
---
## Category
Reliability
---
## Rule
Configure database `wait_timeout` (MySQL) or `statement_timeout` (PostgreSQL) to accommodate long-running cursor iteration.
---
## Reason
Cursor iteration may run for minutes or hours. Default `wait_timeout` is often 60-300 seconds in cloud environments. When the database kills the connection, the cursor fails mid-iteration with partial processing and no checkpoint.
---
## Bad Example
```php
// MySQL wait_timeout = 60s (default cloud)
foreach (User::cursor() as $user) {
    // Processing takes 5 minutes total
    // Connection dropped after 60 seconds
}
```
---
## Good Example
```php
// Before cursor: set session timeout
DB::statement('SET SESSION wait_timeout = 3600');
foreach (User::cursor() as $user) {
    // 1 hour allowed for processing
}
```
---
## Exceptions
Short-running cursor jobs (under 30 seconds) where the default timeout is sufficient.
---
## Consequences Of Violation
Partial dataset processing without notification. The job appears complete but only processed a fraction of rows. Data integrity issues downstream when reports or exports are incomplete.
---
## Use READ UNCOMMITTED for Read-Only Cursor Processing
---
## Category
Performance
---
## Rule
Set session transaction isolation level to `READ UNCOMMITTED` before cursor iteration over read-only data.
---
## Reason
Default `REPEATABLE READ` isolation causes cursor iteration to acquire shared locks or wait for concurrent writes, potentially causing deadlocks. `READ UNCOMMITTED` eliminates locking overhead entirely for read-only processing.
---
## Bad Example
```php
foreach (User::cursor() as $user) {
    // Default isolation — may deadlock with concurrent writes
}
```
---
## Good Example
```php
DB::statement('SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED');
foreach (User::cursor() as $user) {
    // No locking — safe for read-only processing
}
```
---
## Exceptions
Processing that requires a consistent snapshot (repeatable reads). Use `READ COMMITTED` if dirty reads are unacceptable.
---
## Consequences Of Violation
Deadlocks with concurrent write transactions, causing transaction rollbacks and retry overhead. For long-running cursor jobs, deadlocks are likely because the cursor holds the connection open for extended periods.
---
## Never Add with() Before cursor()
---
## Category
Performance
---
## Rule
Do not chain `with()` before `cursor()` — it is silently ignored and creates a false sense of safety.
---
## Reason
The Eloquent cursor implementation uses `PDOStatement::fetch()` in a generator loop without applying eager loading constraints. `with()` calls are silently discarded. Developers unaware of this may add `with()` believing relationships are eager-loaded, then access relationships inside the loop — triggering N+1.
---
## Bad Example
```php
foreach (User::with('profile', 'settings')->cursor() as $user) {
    // with() is silently ignored
    echo $user->profile->bio; // N+1 query per row
}
```
---
## Good Example
```php
// No with() — cursor works with model columns only
foreach (User::cursor() as $user) {
    echo $user->name;
}
```
---
## Exceptions
Use `lazy()` with `with()` when eager-loaded relationships are required. Cursor is not the right tool for relationship-aware iteration.
---
## Consequences Of Violation
N+1 query explosion with no compile-time or runtime warning. The developer added `with()` believing it was safe, making the bug harder to detect than a missing `with()` entirely.
