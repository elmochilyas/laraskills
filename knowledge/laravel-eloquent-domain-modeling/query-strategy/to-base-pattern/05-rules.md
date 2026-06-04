# Phase 5: Rules — To Base Pattern

## Rule 1: Call `toBase()` After All Eloquent-Specific Constraints Are Applied
---
## Category
Framework Usage
---
## Rule
Call `toBase()` as the last method in the builder chain, after all Eloquent constraints (scopes, where clauses, ordering) have been applied. Never call `toBase()` before applying constraints that should be part of the query.
---
## Reason
Constraints added after `toBase()` are applied to the underlying Query Builder, not the Eloquent Builder. While this works for basic constraints, it bypasses Eloquent features like global scope re-application and model-aware behavior. Placing `toBase()` at the end makes the boundary explicit.
---
## Bad Example
```php
// Scope applied after toBase — may not interact correctly with Eloquent
$users = User::toBase()->where('active', true)->get();
```
---
## Good Example
```php
// All constraints applied before toBase()
$users = User::where('active', true)->verified()->toBase()->get();
```
---
## Exceptions
No common exceptions. Always apply all Eloquent constraints before `toBase()`.
---
## Consequences Of Violation
Scopes and constraints applied after `toBase()` may not benefit from Eloquent's scope re-application logic; inconsistent behavior between `toBase()` and pure Eloquent queries; confusion about when constraints are applied.

## Rule 2: Use `toBase()` as the First Optimization Step — Never Skip Directly to `DB::table()`
---
## Category
Performance
---
## Rule
When profiling identifies hydration as a bottleneck, apply `toBase()` first. Only use `DB::table()` if `toBase()` is proven insufficient.
---
## Reason
`toBase()` provides ~80% of the performance benefit of switching to raw `DB::table()` while requiring minimal code changes and preserving all Eloquent constraints. Skipping to `DB::table()` forfeits all Eloquent features and requires manual reimplementation of scopes.
---
## Bad Example
```php
// Jumped directly to DB::table() — lost all scopes, more code
$users = DB::table('users')->where('active', true)->get();
```
---
## Good Example
```php
// First optimization — toBase() preserves scopes
$users = User::where('active', true)->toBase()->get();
```
---
## Exceptions
Queries using database-specific features (CTEs, window functions, full-text) that are only available via `DB::table()`. When eager loads are essential and cannot be converted to joins.
---
## Consequences Of Violation
Unnecessary code complexity; duplicated scope logic; higher risk from bypassed security scopes; more difficult refactoring when requirements change.

## Rule 3: Never Expect `with()` to Work with `toBase()`
---
## Category
Framework Usage
---
## Rule
Do not use `with()` (eager loading) in a builder chain that ends with `toBase()`. Replace `with()` with explicit JOINs or subqueries before calling `toBase()`.
---
## Reason
`toBase()` does NOT preserve eager loads. The `with()` calls are silently ignored — no error is raised, but the related data is not loaded. Developers only discover the missing data when the results lack expected relationship fields.
---
## Bad Example
```php
// Eager loads silently lost — posts not loaded
$users = User::with('posts')->active()->toBase()->get();
```
---
## Good Example
```php
// Explicit JOIN replaces with()
$users = DB::table('users')
    ->select('users.*', 'posts.title')
    ->leftJoin('posts', 'users.id', '=', 'posts.user_id')
    ->where('active', true)
    ->get();
```
---
## Exceptions
When `toBase()` is used only for aggregation (count, sum) where relationship data is not needed. The `with()` can be omitted entirely in this case.
---
## Consequences Of Violation
Missing relationship data in results; silent data loss — no error is raised; callers receiving incomplete records; debugging time wasted on "missing" related data.

## Rule 4: Verify Global Scope Application Before and After `toBase()`
---
## Category
Reliability
---
## Rule
Compare the SQL output with `toSql()` before and after `toBase()` to confirm all global scopes are applied identically in both paths.
---
## Reason
Some global scopes apply at execution time (during `get()`) rather than at construction time. `toBase()` transfers control to the Query Builder earlier, potentially before certain scopes have been applied.
---
## Bad Example
```php
// Assumed scopes are preserved — never verified
$users = User::where('active', true)->toBase()->get();
```
---
## Good Example
```php
$eloquentSql = User::where('active', true)->toSql();
$hybridSql = User::where('active', true)->toBase()->toSql();
// Both should contain the same WHERE clauses for global scopes
assert($eloquentSql === $hybridSql);
$users = User::where('active', true)->toBase()->get();
```
---
## Exceptions
Models with no global scopes. Verify this explicitly — documentation should note "no global scopes" on such models.
---
## Consequences Of Violation
Security-critical global scopes silently bypassed; multi-tenant data leakage; soft-deleted records in output; data privacy violations.

## Rule 5: Document Why `toBase()` Is Used — Add a Code Comment
---
## Category
Maintainability
---
## Rule
Add a code comment on every `toBase()` call explaining why hydration is unnecessary and what performance requirement drove the decision.
---
## Reason
`toBase()` is an optimization choice. Without documentation, future developers may revert it (thinking it premature), be confused about the non-model return type, or fail to update it when requirements change.
---
## Bad Example
```php
// No context
$users = User::active()->toBase()->get();
```
---
## Good Example
```php
// toBase: CSV export, 50k+ rows. Hydration adds 200ms per export (measured).
// Model features (events, casts) not needed for CSV output.
$users = User::active()->toBase()->get();
```
---
## Exceptions
Team-wide conventions documented in a central ADR or coding standards file. Even then, a brief comment prevents context loss.
---
## Consequences Of Violation
Optimization reverted by developers who assume premature optimization; stale `toBase()` calls that no longer serve a purpose; repeated profiling to rediscover the same bottlenecks.

## Rule 6: Clone the Underlying Query Builder If the Original Eloquent Builder Will Be Reused
---
## Category
Reliability
---
## Rule
Clone the underlying Query Builder (`clone $builder->getQuery()`) when you need to modify the query independently without affecting the original Eloquent Builder.
---
## Reason
`toBase()` and `getQuery()` return a reference to the SAME internal Query Builder instance. Modifications to the returned instance (adding joins, WHERE clauses) WILL affect the original Eloquent Builder, causing unexpected side effects.
---
## Bad Example
```php
$eloquentBuilder = User::where('active', true);
$queryBuilder = $eloquentBuilder->getQuery();
$queryBuilder->where('role', 'admin'); // MUTATES the Eloquent builder too!

$users = $eloquentBuilder->get(); // includes 'admin' filter — unexpected
```
---
## Good Example
```php
$eloquentBuilder = User::where('active', true);
$queryBuilder = clone $eloquentBuilder->getQuery(); // independent copy
$queryBuilder->where('role', 'admin'); // does NOT affect $eloquentBuilder

$users = $eloquentBuilder->get(); // only 'active' filter — correct
```
---
## Exceptions
When you explicitly intend to share state between the Eloquent and Query Builder paths. Document this shared-state decision clearly.
---
## Consequences Of Violation
Silent mutation of Eloquent builder state; unexpected filters appearing in queries; debugging time wasted tracing how constraints leaked between builder instances.

## Rule 7: Never Use `toBase()` for Single-Record Queries
---
## Category
Performance
---
## Rule
Do not use `toBase()` on queries returning a single record (`find()`, `first()`). The performance savings are negligible (< 50µs), and you lose model features without benefit.
---
## Reason
Hydration of a single model costs ~2-5µs. The performance difference between `User::find($id)->name` and `DB::table('users')->find($id)->name` is invisible to users. Meanwhile, you lose access to accessors, casts, relationships, and model events.
---
## Bad Example
```php
// Micro-optimization — saves < 50µs, loses model features
$name = User::where('id', $id)->toBase()->first()->name;
```
---
## Good Example
```php
// Use Eloquent for single records — negligible cost, full features
$name = User::find($id)->name;
```
---
## Exceptions
Hot-path API endpoints under extreme traffic (10k+ requests/second) where every microsecond counts and profiling confirms the bottleneck. Always document this decision.
---
## Consequences Of Violation
Loss of model features (casts, accessors, events) with no measurable performance benefit; code that optimizes prematurely; reduced code readability for no gain.
