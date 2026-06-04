# Anti-Patterns: Querying Soft Deletes

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Soft Deletes & Pruning
- **Knowledge Unit:** Querying Soft Deletes

## Anti-Patterns

### Inconsistent Trashed Visibility
Some endpoints include trashed records, others don't, without documentation or a consistent query parameter pattern. API consumers cannot predict what they will receive.

**Problem:** Confusion for API consumers, unpredictable behavior, maintenance burden from scattered trashed-scope logic across controllers.

**Solution:** Implement a consistent `?trashed=with|only|without` query parameter on all listing endpoints. Default to `without` for public endpoints, `with` for admin endpoints.

### withTrashed() in Public API Without Auth Check
Using `withTrashed()` on public API endpoints without restricting access to authorized users. Soft-deleted records may contain sensitive data that should not be publicly visible.

**Problem:** Exposure of soft-deleted records containing personal or sensitive data to unauthorized users; compliance violations.

**Solution:** Gate `withTrashed()` requests behind authentication. Restrict trashed visibility to admin roles or authorized API consumers.

### Chaining withTrashed() After onlyTrashed()
Calling `withTrashed()` on a query that already has `onlyTrashed()` applied, expecting to get all records. The `IS NOT NULL` clause from `onlyTrashed()` persists even after scope removal.

**Problem:** Subtle, hard-to-trace bugs where queries return only trashed records when all records were expected. The code looks correct but produces the wrong result.

**Solution:** Use `withTrashed()` for all records, `onlyTrashed()` for trashed-only, `withoutTrashed()` for active-only. Never chain these in conflicting combinations.

### Assuming withTrashed() Cascades to Eager Loads
Using `User::with('posts')->withTrashed()` and expecting `$user->posts` to include soft-deleted posts. Parent-level scope removal does not cascade to eager-loaded relationships.

**Problem:** Incomplete data sets in admin views; missing trashed children where they should appear; silent data gaps.

**Solution:** Apply `withTrashed()` explicitly on relationship queries using closure constraints: `User::with(['posts' => fn ($q) => $q->withTrashed()])`.

### No onlyTrashed() Before Bulk Restore or Force Delete
Calling builder-level `restore()` or iterating with `->each(fn => forceDelete())` without scoping to `onlyTrashed()` first. The operation affects all records or is a silent no-op.

**Problem:** Complete, irreversible deletion of all records in the table, or silent no-ops that create the illusion of work. Catastrophic data loss scenarios.

**Solution:** Always prepend `onlyTrashed()` before bulk restore or force-delete iteration: `Model::onlyTrashed()->where(...)->restore()`.

### Raw Queries Without Manual Trashed Filter
Using `DB::table()` queries on soft-deletable tables without manually adding `WHERE deleted_at IS NULL`. Eloquent scopes do not apply to the query builder.

**Problem:** Accidental inclusion of trashed records in results; runtime errors when trying to call Eloquent-specific scope methods on the query builder.

**Solution:** Always add manual `WHERE deleted_at IS NULL` or `WHERE deleted_at IS NOT NULL` filters when using `DB::table()` on soft-deletable tables. Better yet, use Eloquent.

### Route Model Binding Without withTrashed() on Admin Routes
Using default route model binding on admin routes that manage soft-deleted records. Default binding resolves only active records, returning 404 for trashed records.

**Problem:** Admin users get 404 errors when trying to view, restore, or manage deleted records; workarounds like manual ID lookup become necessary.

**Solution:** Apply `->withTrashed()` to route model binding on admin routes: `Route::get('/admin/users/{user}')->withTrashed()`.
