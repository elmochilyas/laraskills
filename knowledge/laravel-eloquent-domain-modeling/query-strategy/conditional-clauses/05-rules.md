# Phase 5: Rules — Conditional Clauses

## Rule 1: Always Explicitly `return $q` from `when()` and `unless()` Callbacks
---
## Category
Reliability
---
## Rule
Always write an explicit `return $q` statement inside every `when()` and `unless()` callback. Never rely on the default `?? $this` fallback behavior.
---
## Reason
The `?? $this` fallback silently swallows `void` returns from callbacks where a non-query method is called last (e.g., `$q->where(...)->dd()`). An explicit `return $q` makes the intent clear and prevents silent no-ops.
---
## Bad Example
```php
User::when($request->filled('status'), function ($q) use ($request) {
    $q->where('status', $request->status); // no return — constraint silently dropped
})->get();
```
---
## Good Example
```php
User::when($request->filled('status'), function ($q) use ($request) {
    return $q->where('status', $request->status);
})->get();
```
---
## Exceptions
No common exceptions. Always return the builder explicitly.
---
## Consequences Of Violation
Filter constraints silently ignored; users see unfiltered results; security filters bypassed; hours of debugging time wasted on "missing" filters.

## Rule 2: Use `$request->filled()` Instead of `$request->has()` as `when()` Conditions
---
## Category
Framework Usage
---
## Rule
Use `$request->filled('param')` as the condition in `when()` for query parameters. Do not use `$request->has('param')`.
---
## Reason
`$request->has()` returns `true` even when the parameter exists but has an empty string value. `$request->filled()` returns `false` for empty strings, null, and empty arrays — which correctly skips the filter when the user provided no meaningful value.
---
## Bad Example
```php
User::when($request->has('status'), fn($q) => $q->where('status', $request->status))->get();
// Applied with status="" — generates WHERE status = '' which returns wrong results
```
---
## Good Example
```php
User::when($request->filled('status'), fn($q) => $q->where('status', $request->status))->get();
// Skips filter when status is empty
```
---
## Exceptions
When you explicitly need to distinguish between "parameter not sent" and "parameter sent as empty string". Use `$request->exists()` in that case and handle the empty value explicitly inside the callback.
---
## Consequences Of Violation
Filters applied with empty string values returning incorrect results; confusing UX where empty filters appear active but produce no meaningful filtering.

## Rule 3: Never Nest `when()` Calls Beyond 3 Levels
---
## Category
Maintainability
---
## Rule
Extract nested `when()` chains exceeding 3 levels into named methods, separate query objects, or a filter strategy class.
---
## Reason
Deeply nested conditionals are unreadable, untestable, and impossible to reason about. Each level adds branching complexity that obscures the final SQL structure.
---
## Bad Example
```php
User::when($a, fn($q) => $q->when($b, fn($q) => $q->when($c, fn($q) => $q->when($d, ...))))
```
---
## Good Example
```php
// Extract to a filter method
$query = User::query();
$query = $this->applyStatusFilter($query, $request);
$query = $this->applyDateFilter($query, $request);
$query = $this->applySearchFilter($query, $request);
return $query->get();
```
---
## Exceptions
Simple filter pipelines with 3 levels that are well-documented and tested, where extraction would add more complexity than it removes.
---
## Consequences Of Violation
Unreadable filter chains that no developer can confidently modify; high defect rates in filter logic; difficulty adding new filters.

## Rule 4: Never Place Side Effects (Logging, API Calls, Caching) Inside `when()` Callbacks
---
## Category
Architecture
---
## Rule
Limit `when()` and `unless()` callbacks to query-constraining logic only. Never use them for logging, caching, API calls, or other side effects.
---
## Reason
`when()` callbacks should be pure query builders. Side effects obscure the query construction intent, make testing harder, and violate the principle of separation of concerns. Side effects need explicit, visible code paths.
---
## Bad Example
```php
User::when($isAdmin, function ($q) use ($user) {
    Log::info("Admin filter applied by {$user->id}");
    Mail::send(...); // side effect inside query callback
    return $q->withoutGlobalScope(TenantScope::class);
})->get();
```
---
## Good Example
```php
if ($isAdmin) {
    Log::info("Admin filter applied by {$user->id}");
}
$users = User::when($isAdmin, fn($q) => $q->withoutGlobalScope(TenantScope::class))->get();
```
---
## Exceptions
Audit logging of scope suppression that is explicitly documented and required by compliance. Even then, separate the logging and the query into distinct steps.
---
## Consequences Of Violation
Hard-to-debug side effects triggered conditionally; untestable query builders; mixed concerns that violate single responsibility.

## Rule 5: Use `when()` with a Default Closure to Provide Fallback Ordering or Constraints
---
## Category
Design
---
## Rule
When using `when()` to conditionally apply a constraint, pass a third argument (default closure) to provide a fallback behavior when the condition is false.
---
## Reason
The default closure ensures explicit handling of the "else" case, preventing accidental missing constraints. This is especially important for ordering — without a default, the query may have no `ORDER BY`, producing undefined sort order.
---
## Bad Example
```php
User::when($sortField, fn($q) => $q->orderBy($sortField))->get();
// No ordering when $sortField is null — undefined sort order
```
---
## Good Example
```php
User::when(
    $sortField,
    fn($q) => $q->orderBy($sortField),
    fn($q) => $q->orderBy('created_at', 'desc')
)->get();
```
---
## Exceptions
When the absence of the condition explicitly means "no constraint needed" and this is documented. For ordering, always provide a default.
---
## Consequences Of Violation
Undefined query ordering; inconsistent pagination results; duplicate rows appearing across pages; random result ordering confusing users.

## Rule 6: Use Callable Conditions for Expensive Checks in `when()`
---
## Category
Performance
---
## Rule
Pass a callable (closure) as the first argument to `when()` when the condition involves expensive computation (database queries, API calls, complex authorization checks).
---
## Reason
Callable conditions are evaluated lazily — the expensive check only runs if `when()` is called. If the builder chain is never executed (e.g., reused or short-circuited), the cost is avoided.
---
## Bad Example
```php
$isAdmin = Auth::user()->isAdmin(); // evaluated even when not in a query context
User::when($isAdmin, fn($q) => $q->withTrashed())->get();
```
---
## Good Example
```php
User::when(
    fn() => Auth::user()->isAdmin(), // deferred until builder execution
    fn($q) => $q->withTrashed()
)->get();
```
---
## Exceptions
When the condition is a simple property access or cheap boolean check (e.g., `$request->filled('status')`). Reserve callable conditions for expensive operations only.
---
## Consequences Of Violation
Unnecessary overhead from computing conditions that are never used; wasted CPU cycles on every request including non-query code paths.

## Rule 7: Extract Recurring `when()` Patterns into Named Scope Methods
---
## Category
Maintainability
---
## Rule
When the same `when()` condition-constraint pair appears in 3 or more places across the codebase, extract it to a named local scope or custom builder method.
---
## Reason
Duplicate `when()` patterns violate DRY. Extracting to a named method centralizes the logic, documents it by name, enables unit testing, and prevents drift between implementations.
---
## Bad Example
```php
// In UsersController
User::when($request->filled('status'), fn($q) => $q->where('status', $request->status))->get();
// In AdminController
User::when($request->filled('status'), fn($q) => $q->where('status', $request->status))->get();
// In ApiController
User::when($request->filled('status'), fn($q) => $q->where('status', $request->status))->get();
```
---
## Good Example
```php
class User extends Model {
    public function scopeOfStatus(Builder $q, ?string $status): Builder {
        return $status ? $q->where('status', $status) : $q;
    }
}

User::ofStatus($request->status)->get(); // single call everywhere
```
---
## Exceptions
One-off `when()` patterns specific to a single controller action and unlikely to be reused.
---
## Consequences Of Violation
Scattered filter logic that drifts apart; inconsistent behavior across endpoints; difficulty updating filter rules; high testing burden from duplicated code.
