# Querying Soft Deletes — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Soft Deletes & Pruning
- **Knowledge Unit:** Querying Soft Deletes
- **ECC Version:** 1.0

## Overview
Eloquent provides three query scopes — `withTrashed()`, `onlyTrashed()`, and `withoutTrashed()` — to control whether soft-deleted records appear in query results. These scopes are injected into the query builder by `SoftDeletingScope` and are the primary API for interacting with soft-delete state at the query level. `withTrashed()` removes the global scope filter; `onlyTrashed()` narrows to only deleted records; `withoutTrashed()` re-applies the default filter.

## Core Concepts
- `withTrashed(bool $withTrashed = true)` — removes the global scope filter, returning all records including soft-deleted
- `onlyTrashed()` — narrows results to only soft-deleted records (`WHERE deleted_at IS NOT NULL`)
- `withoutTrashed()` — explicitly applies `WHERE deleted_at IS NULL` (same as default; useful after `withTrashed()`)
- Scope removal vs filter addition — `withTrashed` removes the scope entirely; `onlyTrashed` adds a positive filter
- Relationship chaining — all three scopes are chainable on relationships: `$user->posts()->withTrashed()->get()`
- `Rule::unique()` has `whereNull('deleted_at')` option for ignoring soft-deleted records in validation

## When To Use
- `withTrashed()` — admin panels, audit views, reports that need a complete picture including deleted records
- `onlyTrashed()` — trash/recycle bin views, batch restore/force-delete operations, deleted record analysis
- `withoutTrashed()` — explicitly re-applying the default filter after `withTrashed()` in subqueries or complex joins
- `withTrashed()` on relationships — including deleted children in parent+child queries
- `Rule::unique()->whereNull('deleted_at')` — allowing unique values to be reused after record deletion

## When NOT To Use
- Do NOT use `withTrashed()` on public API listing endpoints — soft-deleted records should not appear by default
- Do NOT chain `withTrashed()` after `onlyTrashed()` — `onlyTrashed()` adds `IS NOT NULL` which persists even after scope removal
- Do NOT use `withTrashed()` without eager-load constraints — parent `withTrashed()` does NOT cascade to eager loads
- Do NOT use these scopes on raw `DB::table()` queries — they only work on Eloquent Builder instances
- Do NOT use `withoutTrashed()` redundantly in default queries — it adds a duplicate clause

## Best Practices (WHY)
- Admin panels should default to `withTrashed()` to avoid confusion when looking up deleted entities
- Map a query parameter (e.g., `?trashed=with|only|without`) in API controllers for flexible client-side filtering
- Always test `count()` and `exists()` calls — they respect the same scopes and may produce unexpected results
- Use `Rule::unique()->whereNull('deleted_at')` to allow re-creation of unique values after soft deletion
- Use `withTrashed()` inside a transaction when checking existence before restore to avoid race conditions

## Architecture Guidelines
- Decide on a query parameter convention for trashed record visibility in API endpoints
- Admin routes should accept trashed IDs via route model binding with `withTrashed()`
- For paginated endpoints, ensure the pagination strategy (length-aware vs cursor) accommodates trashed records
- Use `onlyTrashed()` as the query constraint for bulk operations (restore, force delete)
- Document the default trashed behavior in API documentation so consumers understand what they see

## Performance
- `onlyTrashed()` uses `IS NOT NULL` — can be slower than `IS NULL` on some database engines; test with yours
- Scope removal in joins — `withTrashed()` on a joined model does not automatically affect the join condition
- Subquery scope propagation — removing the scope on a subquery does not affect the outer query
- Index `deleted_at` column — `IS NULL` and `IS NOT NULL` queries benefit from indexing
- Cursor pagination with `withTrashed()` — trashed and active records may interleave; order by a stable column

## Security
- `withTrashed()` exposes soft-deleted records that may contain sensitive data — restrict to authorized contexts
- Soft-deleted records still exist in the database — ensure serialization respects `$hidden` even for trashed records
- `onlyTrashed()` can reveal the existence and count of deleted records, which may be sensitive information
- Route model binding without `withTrashed()` returns 404 for trashed records — intentional by design

## Common Mistakes
- Chaining `withTrashed()` after `onlyTrashed()` — `onlyTrashed()` adds `IS NOT NULL` which persists, leaving all records
- Forgetting scopes apply to `count()` and `exists()` — `User::count()` excludes soft-deleted users
- Using `withTrashed()` on a paginated query inconsistently — produces inconsistent page counts across requests
- Assuming `withTrashed()` persists to eager loads — `User::with('posts')->withTrashed()` does NOT show soft-deleted posts
- Not using `withTrashed()` for route model binding on admin routes — causes 404 for deleted records

## Anti-Patterns
- **Inconsistent trashed visibility**: some endpoints include trashed records, others don't, without documentation
- **`withTrashed()` in public API without auth check**: exposing soft-deleted records to anonymous users
- **Scope removal without re-application**: removing the `SoftDeletingScope` and forgetting to re-apply it in subsequent queries
- **Chaining order confusion**: using `onlyTrashed()` and `withTrashed()` interchangeably without understanding their interaction
- **Raw queries on soft-deletable tables**: bypassing Eloquent scopes and accidentally including/excluding trashed records

## Examples
```php
// Basic usage
User::withTrashed()->get();          // All records (active + deleted)
User::onlyTrashed()->get();          // Only deleted records
User::withoutTrashed()->get();       // Only active records (default)

// Relationship queries
$user->posts()->withTrashed()->get();
$user->posts()->onlyTrashed()->get();

// Count queries
User::count();                       // Excludes deleted
User::withTrashed()->count();        // Includes deleted

// Validation
Rule::unique('users')->whereNull('deleted_at');

// Controller query parameter mapping
public function index(Request $request)
{
    $query = User::query();
    match ($request->query('trashed', 'without')) {
        'with' => $query->withTrashed(),
        'only' => $query->onlyTrashed(),
        default => $query->withoutTrashed(),
    };
    return UserResource::collection($query->paginate());
}

// Route model binding with trashed
Route::get('/admin/users/{user}', function (User $user) {
    // Uses explicit binding with withTrashed
})->withTrashed();
```

## Related Topics
- soft-deletes-trait — the trait that registers these query scopes
- restoring — using `onlyTrashed()` to scope records for restore
- force-deleting — using `onlyTrashed()` to scope records for permanent deletion
- global-scopes — understanding how `SoftDeletingScope` applies query constraints

## AI Agent Notes
- `withTrashed()` removes the global scope; `onlyTrashed()` adds `WHERE deleted_at IS NOT NULL`
- These scopes work on relationships too: `$user->posts()->withTrashed()->get()`
- `count()` and `exists()` respect these scopes — always consider the trashed state
- `Rule::unique()->whereNull('deleted_at')` is essential for soft-deletable tables with unique columns
- Admin routes should use `withTrashed()` for route model binding
- `withTrashed()` on a parent query does NOT cascade to eager-loaded relationships

## Verification
- [ ] `withTrashed()` returns all records including soft-deleted
- [ ] `withTrashed(false)` returns only active records
- [ ] `onlyTrashed()` returns only soft-deleted records
- [ ] `withoutTrashed()` re-applies the null filter after `withTrashed()`
- [ ] Relationship `withTrashed()` includes trashed children
- [ ] `User::count()` after soft-delete returns decremented count
- [ ] `Rule::unique()->whereNull('deleted_at')` ignores soft-deleted records
- [ ] Query parameter mapping for trashed visibility is implemented for API endpoints
