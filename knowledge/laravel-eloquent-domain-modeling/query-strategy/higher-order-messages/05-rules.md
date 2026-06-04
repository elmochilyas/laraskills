# Phase 5: Rules — Higher Order Messages

## Rule 1: Use `each()` for Side Effects Only — It Returns Void
---
## Category
Framework Usage
---
## Rule
Use `each()` only for side-effect iteration (sending emails, updating records, logging). Do not use `each()` when you need to collect or transform results — use `filter()`, `map()`, or `pipe()` instead.
---
## Reason
`each()` returns `void` — it is designed for iteration with side effects, not for building result collections. Developers expecting a collection from `each()` will get null, causing subtle bugs downstream.
---
## Bad Example
```php
$emails = User::active()->each(fn($user) => $user->email); // returns void, not emails
```
---
## Good Example
```php
// Side effect iteration — correct use of each()
User::active()->each(fn($user) => $user->sendWelcomeEmail());

// Collection transformation — use map()
$emails = User::active()->map(fn($user) => $user->email);
```
---
## Exceptions
No common exceptions. Use `each()` only when the intent is iteration with side effects.
---
## Consequences Of Violation
Null values where collections are expected; runtime type errors; debugging time wasted understanding why `each()` "returns nothing".

## Rule 2: Eager-Load Relationships Before Higher Order Message Chains
---
## Category
Performance
---
## Rule
Always call `with()` to eager-load relationships before using `each()`, `map()`, `filter()`, or any HOM that accesses related data in its callback.
---
## Reason
Accessing relationships inside HOM callbacks without eager loading triggers N+1 queries — one query per result for each relationship access. Eager loading reduces this to 1-2 queries total regardless of result count.
---
## Bad Example
```php
// N+1: each() loads posts lazily per user
User::active()->each(fn($user) => $user->posts->count()); // 1 + N queries
```
---
## Good Example
```php
// Eager-loaded: 2 queries total
User::active()->with('posts')->each(fn($user) => $user->posts->count());
```
---
## Exceptions
Relationships accessed conditionally on a small subset of results (eager loading wasted on 95% of records). Use `load()` inside the callback for those cases.
---
## Consequences Of Violation
N+1 queries: 1 + N queries instead of 2; severe performance degradation on large datasets; database server overload from unnecessary queries.

## Rule 3: Use `filter()` HOM Only When SQL Cannot Express the Condition
---
## Category
Performance
---
## Rule
Use the `filter()` HOM only for post-query filtering that CANNOT be expressed in SQL (computed fields, permission checks, external data). Never use `filter()` for conditions that a `WHERE` clause can express.
---
## Reason
`filter()` loads ALL results into memory first, then filters in PHP. SQL `WHERE` clauses filter at the database level, transferring only matching rows. For large datasets, `filter()` wastes memory and bandwidth.
---
## Bad Example
```php
// WHERE can express this — filter() loads all records unnecessarily
$users = User::active()->filter(fn($u) => $u->role === 'admin')->get();
```
---
## Good Example
```php
// SQL WHERE — filters at the database, transfers only matching rows
$users = User::where('active', true)->where('role', 'admin')->get();
```
---
## Exceptions
Computed attributes not stored in the database, runtime permission checks, or conditions involving external API data that cannot be joined in SQL.
---
## Consequences Of Violation
Memory exhaustion on large result sets; unnecessary database I/O transferring rows that are immediately discarded; slower response times compared to SQL filtering.

## Rule 4: Limit HOM Chains to 2-3 Methods Maximum
---
## Category
Maintainability
---
## Rule
Keep Higher Order Message chains to 3 methods or fewer. Extract longer chains to named variables or separate processing steps.
---
## Reason
Long HOM chains mix query construction, in-memory transformation, and side-effect iteration in a single expression, making the pipeline impossible to test, debug, or modify confidently.
---
## Bad Example
```php
User::active()
    ->with('posts')
    ->filter(fn($u) => $u->hasPermission('export'))
    ->map(fn($u) => ['id' => $u->id, 'name' => $u->name])
    ->tap(fn($c) => Log::info('Processing', ['count' => $c->count()]))
    ->each(fn($u) => dispatch(new ExportJob($u))); // 5 methods — too long
```
---
## Good Example
```php
$users = User::active()
    ->with('posts')
    ->filter(fn($u) => $u->hasPermission('export'));

$userData = $users->map(fn($u) => ['id' => $u->id, 'name' => $u->name]);

Log::info('Processing', ['count' => count($userData)]);
foreach ($userData as $data) {
    dispatch(new ExportJob($data));
}
```
---
## Exceptions
Pipelines that are simple enough to read as a single expression (2-3 methods) and are well-tested. Never exceed 3 methods in one chain.
---
## Consequences Of Violation
Untestable pipelines; difficult debugging when an intermediate step fails; difficulty understanding the order of operations.

## Rule 5: Never Call `get()` Before HOMs — HOMs Already Execute the Query
---
## Category
Framework Usage
---
## Rule
Do not call `get()` (or other terminal methods) before using HOMs like `each()`, `map()`, or `filter()`. These HOMs internally call `get()` or `cursor()` to execute the query.
---
## Reason
Calling `get()` before an HOM executes the query twice — once for `get()` (loading a Collection) and once for the HOM's internal `get()`/`cursor()`. This doubles query time and memory usage.
---
## Bad Example
```php
// Query executed twice — get() then each() runs cursor() internally
$users = User::active()->get();
$users->each(fn($u) => $u->sendEmail());
```
---
## Good Example
```php
// Single execution — each() calls cursor() internally
User::active()->each(fn($u) => $u->sendEmail());
```
---
## Exceptions
When you need to inspect intermediate results before processing (use a single `get()` and iterate the collection with `each()` on the Collection, not the builder).
---
## Consequences Of Violation
Query executed twice; doubled memory usage; doubled database I/O; confusion about whether the builder or collection API is being used.

## Rule 6: Avoid `map()` for Large Datasets — Use `cursor()` with Manual Iteration
---
## Category
Performance
---
## Rule
Use `map()` on Eloquent result sets only when the expected row count is under 1000. For larger datasets, use `cursor()` with manual iteration to avoid loading all results into memory.
---
## Reason
`map()` calls `get()` internally, loading the entire result set into memory as hydrated models. For 50k records at ~3KB per model, that's 150MB of memory — almost certainly an out-of-memory crash.
---
## Bad Example
```php
// Loads 50k models into memory — OOM risk
$names = User::where('active', true)->map(fn($u) => $u->name);
```
---
## Good Example
```php
// Streams one row at a time — constant memory
$names = [];
foreach (User::where('active', true)->cursor() as $user) {
    $names[] = $user->name;
}
```
---
## Exceptions
Known-small result sets (under 1000 rows) where the convenience of `map()` outweighs the memory concern. Document the expected size.
---
## Consequences Of Violation
Out-of-memory crashes in production; PHP process killed by OOM killer; request timeouts; data processing jobs that fail partway through.

## Rule 7: Use `tap()` for Logging and Monitoring, Not for State Mutation
---
## Category
Architecture
---
## Rule
Use the `tap()` HOM only for logging, monitoring, and debugging that should not affect the collection. Never use `tap()` to mutate or transform results.
---
## Reason
`tap()` passes the collection through unchanged — it is designed for side-effect inspection. Using it for mutation creates code that is unclear about whether the collection is modified. Use `pipe()` for intentional transformations.
---
## Bad Example
```php
// tap() used for mutation — unclear intent
$users = User::active()
    ->tap(fn($c) => $c->each->update(['notified_at' => now()]));
```
---
## Good Example
```php
// tap() for logging
$users = User::active()
    ->tap(fn($c) => Log::info('Processing ' . $c->count() . ' users'))
    ->each(fn($u) => $u->sendEmail());

// pipe() for transformation
$grouped = User::active()->pipe(fn($c) => $c->groupBy('department'));
```
---
## Exceptions
No common exceptions. Use `tap()` exclusively for observation (logging, metrics, debugging dump). Use `pipe()` or `each()` for transformation and side effects.
---
## Consequences Of Violation
Confusing code where it's unclear if `tap()` mutated the collection; bugs from unexpected side effects in observation callbacks.
