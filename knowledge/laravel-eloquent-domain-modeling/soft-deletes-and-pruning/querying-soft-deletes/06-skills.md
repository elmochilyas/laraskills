# Querying Soft Deletes Skills

## Skill: Query soft-deleted records using withTrashed/onlyTrashed/withoutTrashed

### Purpose
Use `withTrashed()`, `onlyTrashed()`, and `withoutTrashed()` query scopes on soft-deletable models to control whether soft-deleted records appear in query results.

### When To Use
- `withTrashed()` — admin panels, audit views, reports needing a complete picture including deleted records
- `onlyTrashed()` — trash/recycle bin views, batch restore/force-delete operations, deleted record analysis
- `withoutTrashed()` — explicitly re-applying the default filter after `withTrashed()` in subqueries or complex joins
- `withTrashed()` on relationships — including deleted children in parent+child queries
- `Rule::unique()->whereNull('deleted_at')` — allowing unique values to be reused after record deletion

### When NOT To Use
- `withTrashed()` on public API listing endpoints — soft-deleted records should not appear by default
- Chaining `withTrashed()` after `onlyTrashed()` — `onlyTrashed()` adds `IS NOT NULL` which persists
- `withTrashed()` without eager-load constraints — parent `withTrashed()` does NOT cascade to eager loads
- These scopes on raw `DB::table()` queries — they only work on Eloquent Builder instances
- `withoutTrashed()` redundantly in default queries — it adds a duplicate clause

### Prerequisites
- Model using `SoftDeletes` trait
- `deleted_at` column indexed for performance

### Inputs
- Eloquent query builder on a soft-deletable model

### Workflow
1. For all records including deleted: `Model::withTrashed()->get()`
2. For only soft-deleted records: `Model::onlyTrashed()->get()`
3. For only active records (explicit): `Model::withoutTrashed()->get()`
4. On relationships: `$user->posts()->withTrashed()->get()`
5. For route model binding with trashed: `Route::get(...)->withTrashed()`
6. For unique validation: `Rule::unique('table')->whereNull('deleted_at')`
7. Implement a `?trashed=with|only|without` query parameter in API listing endpoints
8. Use `withTrashed()` by default in all admin panel queries
9. Scope bulk operations (restore, force delete) with `onlyTrashed()`

### Validation Checklist
- [ ] `withTrashed()` returns all records including soft-deleted
- [ ] `onlyTrashed()` returns only soft-deleted records
- [ ] `withoutTrashed()` re-applies the null filter after `withTrashed()`
- [ ] Relationship `withTrashed()` includes trashed children
- [ ] `User::count()` after soft-delete returns decremented count
- [ ] `Rule::unique()->whereNull('deleted_at')` ignores soft-deleted records
- [ ] Query parameter mapping for trashed visibility is implemented for API endpoints
- [ ] `deleted_at` column is indexed

### Common Failures
- Chaining `withTrashed()` after `onlyTrashed()` — `onlyTrashed()` adds `IS NOT NULL` which persists
- Forgetting scopes apply to `count()` and `exists()` — `User::count()` excludes soft-deleted users
- Assuming `withTrashed()` cascades to eager loads — `User::with('posts')->withTrashed()` does NOT show soft-deleted posts
- Not using `withTrashed()` for route model binding on admin routes — causes 404 for deleted records
- Using scopes on `DB::table()` — they don't exist on the query builder

### Decision Points
- **withTrashed vs onlyTrashed vs withoutTrashed?** — Use `withTrashed()` for admin/all-records views; `onlyTrashed()` for trash bin operations; `withoutTrashed()` for active-only lists
- **Expose trashed parameter in API?** — Yes, for admin/audit endpoints; no, for public-facing endpoints

### Performance Considerations
- `onlyTrashed()` uses `IS NOT NULL` — can be slower than `IS NULL` on some database engines
- Index the `deleted_at` column for both `IS NULL` and `IS NOT NULL` queries
- Scope removal in joins — `withTrashed()` on a joined model does not automatically affect the join condition
- Cursor pagination with `withTrashed()` — order by a stable column for consistency

### Security Considerations
- `withTrashed()` exposes soft-deleted records containing sensitive data — restrict to authorized contexts
- Soft-deleted records still exist in the database — ensure serialization respects `$hidden`
- `onlyTrashed()` can reveal the existence and count of deleted records
- Route model binding without `withTrashed()` returns 404 for trashed records — intentional by design

### Related Rules
- [QuerySoftDeletes-Admin-Default-WithTrashed](../querying-soft-deletes/05-rules.md)
- [QuerySoftDeletes-No-WithTrashed-After-OnlyTrashed](../querying-soft-deletes/05-rules.md)
- [QuerySoftDeletes-OnlyTrashed-For-Bulk-Operations](../querying-soft-deletes/05-rules.md)
- [QuerySoftDeletes-Route-Binding-WithTrashed](../querying-soft-deletes/05-rules.md)
- [QuerySoftDeletes-Trashed-Query-Parameter](../querying-soft-deletes/05-rules.md)
- [QuerySoftDeletes-Unique-Validation](../querying-soft-deletes/05-rules.md)
- [QuerySoftDeletes-WithTrashed-Not-Cascade-To-Eager](../querying-soft-deletes/05-rules.md)
- [QuerySoftDeletes-Index-DeletedAt](../querying-soft-deletes/05-rules.md)
- [QuerySoftDeletes-WithoutTrashed-In-Subqueries](../querying-soft-deletes/05-rules.md)
- [QuerySoftDeletes-No-Scopes-On-DB-Table](../querying-soft-deletes/05-rules.md)

### Related Skills
- Mark records as soft-deleted using the SoftDeletes trait

### Success Criteria
- `withTrashed()` returns active + soft-deleted records
- `onlyTrashed()` returns only soft-deleted records
- `Model::count()` excludes soft-deleted records by default
- Relationship queries respect trashed scope when explicitly applied
- `Rule::unique()->whereNull('deleted_at')` ignores soft-deleted records during validation
- Admin endpoints expose trashed query parameter and use `withTrashed()` by default
