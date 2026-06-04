# Phase 5: Rules — Querying Soft Deletes

## Rule 1: Always use `withTrashed()` for admin queries by default
---
## Category
Architecture
---
## Rule
Default admin panel queries to `withTrashed()` instead of showing only active records. Do not require explicit user action to see soft-deleted records in administrative contexts.
---
## Reason
Administrators need visibility into all records, including deleted ones, for auditing, recovery, and troubleshooting. Hiding soft-deleted records by default in admin contexts causes confusion and support requests when looking up entities that were deleted.
---
## Bad Example
```php
// Admin panel — only active records shown
class UserController extends Controller
{
    public function index(): LengthAwarePaginator
    {
        return User::paginate(); // Soft-deleted users are invisible to admins
    }
}
```
---
## Good Example
```php
// Admin panel — all records visible
class AdminUserController extends Controller
{
    public function index(): LengthAwarePaginator
    {
        return User::withTrashed()->paginate(); // Admins see everything
    }
}
```
---
## Exceptions
Public-facing API endpoints where soft-deleted records must never be exposed.
---
## Consequences Of Violation
Admin confusion when records "disappear", wasted debugging time, inability to support restore workflows from admin UI.
---

## Rule 2: Never chain `withTrashed()` after `onlyTrashed()`
---
## Category
Reliability
---
## Rule
Do not call `withTrashed()` on a query that already has `onlyTrashed()` applied. Understand that `onlyTrashed()` adds `WHERE deleted_at IS NOT NULL`, which persists even after scope removal.
---
## Reason
`onlyTrashed()` adds a positive filter (`IS NOT NULL`), while `withTrashed()` removes the global scope. After `onlyTrashed()`, calling `withTrashed()` removes the scope but the `IS NOT NULL` clause remains, leaving the query returning only trashed records — possibly the opposite of what was intended.
---
## Bad Example
```php
// Intended: get all records (active + trashed)
$query = User::onlyTrashed()->withTrashed(); // Still only trashed — IS NOT NULL persists
```
---
## Good Example
```php
// Get all records
$query = User::withTrashed(); // Correct approach

// Switch from trashed-only back to default
$query = User::onlyTrashed();
$query = User::withoutTrashed(); // Explicit re-application of default filter
```
---
## Exceptions
No common exceptions. The behavior is deterministic and the combination is never correct.
---
## Consequences Of Violation
Bugs that are difficult to trace because the query visually appears correct but produces unexpected results; production incidents where only-trashed records are returned when all records were expected.
---

## Rule 3: Always scope bulk operations to `onlyTrashed()` before restore or force-delete
---
## Category
Reliability
---
## Rule
Prepend `onlyTrashed()` before builder-level `restore()` or per-record `forceDelete()` iteration. Do not operate on un-scoped queries.
---
## Reason
Without `onlyTrashed()`, a builder-level `restore()` (which is a no-op on non-trashed records) may silently do nothing, and iterating `Model::all()->each->forceDelete()` permanently deletes every record in the table. Scoping to `onlyTrashed()` provides a safety constraint.
---
## Bad Example
```php
// Danger: restores (or force-deletes) ALL records
User::restore(); // No-op on active records — does nothing silently
User::all()->each->forceDelete(); // Permanently deletes everything
```
---
## Good Example
```php
// Safe: only affects trashed records
User::onlyTrashed()
    ->where('deleted_at', '<=', now()->subDays(30))
    ->restore();

User::onlyTrashed()
    ->where('deleted_at', '<=', now()->subYear())
    ->each(fn (User $user) => $user->forceDelete());
```
---
## Exceptions
Explicit developer intent to restore or force-delete non-trashed records, clearly documented with comments.
---
## Consequences Of Violation
Permanent mass data loss from force-deleting all records; silent no-ops that create the illusion of bulk restore but do nothing.
---

## Rule 4: Use `withTrashed()` in route model binding for admin routes
---
## Category
Architecture
---
## Rule
Apply `->withTrashed()` to route model binding when the route is admin-only and needs to resolve soft-deleted records. Do not force admins to use workarounds.
---
## Reason
Default route model binding resolves only active records, returning 404 for soft-deleted records. Admin routes that manage deleted records (restore UI, audit detail view) must resolve trashed records to function.
---
## Bad Example
```php
// Admin route — returns 404 for soft-deleted users
Route::get('/admin/users/{user}/restore', [AdminUserController::class, 'restore']);
```
---
## Good Example
```php
// Admin route — resolves soft-deleted users
Route::get('/admin/users/{user}/restore', [AdminUserController::class, 'restore'])
    ->withTrashed();
```
---
## Exceptions
Admin routes that should intentionally 404 for deleted records (e.g., viewing a deleted record that can never be restored).
---
## Consequences Of Violation
Admin users get 404 errors when trying to manage deleted records, requiring workarounds like manual ID lookup or raw database queries.
---

## Rule 5: Expose a `trashed` query parameter in API endpoints for flexible client filtering
---
## Category
Design
---
## Rule
Implement a `?trashed=with|only|without` query parameter in API listing endpoints to allow clients to control soft-delete visibility. Do not hardcode a single behavior.
---
## Reason
Different API consumers need different visibility: admin panels want all records, public listings want active only, and analytics/reports may want only trashed. A query parameter provides flexible, documented control.
---
## Bad Example
```php
// Hardcoded — no flexibility for API consumers
class UserController extends Controller
{
    public function index(): JsonResource
    {
        return UserResource::collection(User::paginate()); // Only active, always
    }
}
```
---
## Good Example
```php
class UserController extends Controller
{
    public function index(Request $request): JsonResource
    {
        $query = User::query();

        match ($request->query('trashed', 'without')) {
            'with' => $query->withTrashed(),
            'only' => $query->onlyTrashed(),
            default => $query->withoutTrashed(),
        };

        return UserResource::collection($query->paginate());
    }
}
```
---
## Exceptions
Public endpoints that must never expose soft-deleted records — omit the parameter entirely for those routes.
---
## Consequences Of Violation
Inflexible API that forces consumers to use multiple endpoints or workarounds; maintenance burden of adding new endpoints per visibility mode.
---

## Rule 6: Use `Rule::unique()->whereNull('deleted_at')` for validation on soft-deletable tables
---
## Category
Framework Usage
---
## Rule
Apply `->whereNull('deleted_at')` on `Rule::unique()` validation for any column with a unique constraint on a soft-deletable model. Do not use plain `Rule::unique()`.
---
## Reason
Plain `Rule::unique()` checks uniqueness across ALL records including soft-deleted ones, which prevents reusing a unique value (email, slug) after deletion. The `whereNull('deleted_at')` condition ensures uniqueness is enforced only among active records.
---
## Bad Example
```php
Rule::unique('users', 'email')->ignore($userId);
// Fails if the email exists on a soft-deleted user
```
---
## Good Example
```php
Rule::unique('users', 'email')
    ->whereNull('deleted_at')
    ->ignore($userId);
// Allows the email if it only exists on a soft-deleted user
```
---
## Exceptions
Models where unique values must never be reused, even after soft deletion.
---
## Consequences Of Violation
Users cannot re-register with their original email after account deletion; false validation errors that confuse users and require manual database cleanup.
---

## Rule 7: Never assume `withTrashed()` cascades to eager-loaded relationships
---
## Category
Reliability
---
## Rule
Apply `withTrashed()` explicitly on relationship queries. Do not assume parent-level `withTrashed()` causes eager-loaded relationships to include trashed records.
---
## Reason
`withTrashed()` on a parent query removes the `SoftDeletingScope` only for the parent table. Eager-loaded relationships have their own query with their own scope, which must be configured separately via `withTrashed()` in the relationship definition or constraint.
---
## Bad Example
```php
// Parent includes trashed posts, but relationship does not
$user = User::withTrashed()->with('posts')->find($id);
// $user->posts does NOT include trashed posts
```
---
## Good Example
```php
// Define trashed relationship
class User extends Model
{
    public function postsWithTrashed(): HasMany
    {
        return $this->hasMany(Post::class)->withTrashed();
    }
}

// Or use constraint callback
$user = User::withTrashed()
    ->with(['posts' => fn ($q) => $q->withTrashed()])
    ->find($id);
```
---
## Exceptions
Relationships where you explicitly want to exclude trashed children even for parent queries that include trashed records.
---
## Consequences Of Violation
Incomplete data sets when querying parent-child relationships; missing trashed children in admin views where they should appear.
---

## Rule 6: (Renumber to 8) Index the `deleted_at` column for soft-delete scope queries
---
## Category
Performance
---
## Rule
Add a database index on `deleted_at` for every soft-deletable table. Use composite indexes for common query patterns.
---
## Reason
The `SoftDeletingScope` applies `WHERE deleted_at IS NULL` on every query. Without an index, this causes a full table scan. `IS NULL` and `IS NOT NULL` queries benefit from indexing, especially on large tables.
---
## Bad Example
```php
Schema::table('users', function (Blueprint $table) {
    $table->softDeletes();
    // No index — every User query does a full table scan
});
```
---
## Good Example
```php
Schema::table('users', function (Blueprint $table) {
    $table->softDeletes();
    $table->index('deleted_at');
    // Composite for filtered queries:
    // $table->index(['team_id', 'deleted_at']);
});
```
---
## Exceptions
Trivial tables with fewer than 1,000 rows.
---
## Consequences Of Violation
Full table scans on every Eloquent query, degraded performance as data grows, increased database CPU and I/O.
---

## Rule 9: Use `withoutTrashed()` explicitly after `withTrashed()` in subqueries
---
## Category
Reliability
---
## Rule
Call `withoutTrashed()` on subqueries that should exclude soft-deleted records when the outer query uses `withTrashed()`. Do not rely on default scope behavior outside the parent context.
---
## Reason
`withTrashed()` removes the global scope. Any subquery or relationship query executed after the scope is removed may inadvertently inherit the un-scoped context, depending on how the query is constructed. Explicit `withoutTrashed()` restores the default filter.
---
## Bad Example
```php
$subQuery = User::withTrashed()
    ->where('team_id', $teamId); // Subquery intended for active-only count

$count = DB::table('posts')
    ->whereExists($subQuery)
    ->count(); // May include trashed users in the exists check
```
---
## Good Example
```php
$subQuery = User::withTrashed()
    ->where('team_id', $teamId)
    ->withoutTrashed(); // Explicitly re-apply the active-only filter

$count = DB::table('posts')
    ->whereExists($subQuery)
    ->count();
```
---
## Exceptions
Subqueries that intentionally include soft-deleted records.
---
## Consequences Of Violation
Subqueries produce unexpected results by including records that should be excluded; difficult-to-trace data integrity issues in reports.
---

## Rule 10: Never use soft-delete scopes on raw `DB::table()` queries
---
## Category
Reliability
---
## Rule
Apply trashed/active filters manually when using `DB::table()` on soft-deletable tables. Do not assume Eloquent scope methods work on the query builder.
---
## Reason
`withTrashed()`, `onlyTrashed()`, and `withoutTrashed()` are Eloquent builder methods provided by `SoftDeletingScope`. They are not available on `Illuminate\Database\Query\Builder` instances returned by `DB::table()`.
---
## Bad Example
```php
$results = DB::table('users')
    ->withTrashed() // Error: Call to undefined method
    ->get();
```
---
## Good Example
```php
$results = DB::table('users')
    ->whereNotNull('deleted_at') // Manual trashed filter
    ->get();

// Or use Eloquent:
$results = User::onlyTrashed()->get();
```
---
## Exceptions
No common exceptions. Use Eloquent for soft-deletable tables.
---
## Consequences Of Violation
Runtime errors from calling non-existent methods; accidental inclusion of trashed records when no manual `WHERE deleted_at IS NULL` filter is added.
