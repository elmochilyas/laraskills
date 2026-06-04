# Querying Soft Deletes

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Soft Deletes & Pruning
- **Last Updated:** 2026-06-02

## Executive Summary
Eloquent provides three query scopes — `withTrashed()`, `onlyTrashed()`, and `withoutTrashed()` — to control whether soft-deleted records appear in query results. These scopes are injected into the query builder by `SoftDeletingScope` and are the primary API for interacting with the soft-delete state at the query level.

## Core Concepts
- **`withTrashed(bool $withTrashed = true)`** — removes the global scope filter, returning all records (including soft-deleted). Passing `false` re-applies the filter.
- **`onlyTrashed()`** — narrows results to only soft-deleted records (`WHERE deleted_at IS NOT NULL`).
- **`withoutTrashed()`** — explicitly applies the `WHERE deleted_at IS NULL` filter (same as default behavior, useful after calling `withTrashed()` on a subquery or relationship).
- **Scope removal vs. filter addition** — `withTrashed` removes the global scope entirely (reverting to unfiltered querying). `onlyTrashed` adds a positive filter. `withoutTrashed` re-applies the default filter.
- **Relationship chaining** — all three scopes are chainable on relationships: `$user->posts()->withTrashed()->get()`.

## Mental Models
- **Three-state filter** — imagine a three-position switch: "All" (`withTrashed`), "Trashed Only" (`onlyTrashed`), "Active Only" (`withoutTrashed` / default).
- **Scope as toggle** — `withTrashed()` flips a boolean that the scope checks before applying its filter. Calling it multiple times toggles the behavior.
- **Temporary escape hatch** — `withTrashed()` is a one-query override. It does not persist across requests or to other query chains.

## Internal Mechanics

### `withTrashed($withTrashed = true)`
- `SoftDeletingScope@extend()` registers the `withTrashed` macro on the builder.
- The macro stores `$withTrashed` in the scope's internal state via `$scope->withTrashed = $withTrashed`.
- When the scope's `apply()` method checks `$this->withTrashed`, if `true`, the `whereNull('deleted_at')` clause is simply not added.
- **Important:** When applied to a relationship, the scope removal only affects the relationship query, not the parent query.

### `onlyTrashed()`
- Registers a second macro that temporarily removes the default scope, then adds `WHERE deleted_at IS NOT NULL`.
- Internally: calls `withoutGlobalScope(SoftDeletingScope::class)` then adds a `whereNotNull('deleted_at')`.

### `withoutTrashed()`
- Explicitly forces the `WHERE deleted_at IS NULL` clause even if `withTrashed` was previously called on the same query instance.
- Useful in subqueries or unions where scope removal propagates unexpectedly.

## Patterns
- **Macro injection from scope** — the scope extends the builder with methods at registration time. This keeps scope logic and builder macros co-located.
- **Mutable scope state** — the scope holds mutable state (`$withTrashed`) that the macros modify. State resets each request because scopes are re-registered on every model boot.
- **Double-negative filtering** — `withoutTrashed()` adds the null filter unconditionally, even though the default scope already adds it. This provides explicitness at the cost of a redundant clause.

## Architectural Decisions
- **Decision:** Inject scopes as builder macros rather than model-level methods.
  - **Context:** Query scopes (`scopeWithTrashed`, `scopeOnlyTrashed`) exist on the model but macros work on the builder directly.
  - **Consequence:** Scopes work with `Builder` instances obtained from relationships, subqueries, and raw `DB` queries on the model's table.
- **Decision:** `withTrashed()` removes the scope entirely vs. adding a no-op clause.
  - **Context:** Adding `WHERE (deleted_at IS NULL OR deleted_at IS NOT NULL)` would also work but is semantically confusing.
  - **Consequence:** Cleaner SQL output. But the scope removal means any previously applied scope modifications are lost.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| `withTrashed()` is intuitive and chainable | Scope removal loses other modifications | Compose scopes explicitly if combining with other global scopes |
| `onlyTrashed()` provides direct access to trashed set | Must remember to call `withTrashed()` before chaining other scopes on trashed records | Unexpected empty results if chaining order is wrong |
| Scope state resets per request | State is mutable during a query chain | Calling `withTrashed(false)` re-applies the filter |
| Works on relationships natively | Does NOT work on raw `DB::table()` queries | Must use the model class for soft-delete queries |

## Performance Considerations
- **`onlyTrashed()` uses `IS NOT NULL`** — `WHERE deleted_at IS NOT NULL` can be slower than `IS NULL` on some databases because NULL values are typically indexed with a separate nulls list. Test with your database engine.
- **Scope removal in joins** — if you use `withTrashed()` on a joined model, the join condition does not automatically include the soft-delete filter. Use an explicit `join` with the `whereNull` condition.
- **Subquery scope propagation** — removing the scope on a subquery does not affect the outer query, but the outer query may still filter on columns from the subquery. Verify explain plans.

## Production Considerations
- **Admin panels must use `withTrashed()`** — user management interfaces should always query with `withTrashed()` to avoid confusion when searching for deleted users.
- **API responses** — decide whether soft-deleted resources appear in API results. Typically, a `GET /users?trashed=1` query parameter maps to `withTrashed()`.
- **Report queries** — aggregate reports (counts, sums) often need `withTrashed()` or `onlyTrashed()` to provide accurate totals.
- **Soft-delete filtering in validation** — `Rule::unique()` has a `whereNull('deleted_at')` clause option for ignoring soft-deleted records. Use `Rule::unique('users')->whereNull('deleted_at')`.

## Common Mistakes
- **Chaining `withTrashed()` after `onlyTrashed()`** — `onlyTrashed()` applies a positive filter. Calling `withTrashed()` after removes the scope but does NOT remove the `IS NOT NULL` clause, leaving you with all records.
- **Forgetting scopes apply to `count()` and `exists()`** — `User::count()` does NOT include soft-deleted users. This can lead to incorrect pagination totals.
- **Using `withTrashed()` on a paginated query inconsistently** — calling `paginate()` with `withTrashed()` on one request and without on another produces inconsistent page counts.
- **Assuming `withTrashed()` persists to eager loads** — `User::with('posts')->withTrashed()->get()` shows soft-deleted posts only if the relationship query includes `withTrashed()`. Use `withTrashed()` on the nested constraint too.

## Failure Modes
- **Scope removal with many global scopes** — removing `SoftDeletingScope` with `withoutGlobalScope()` also exposes other scopes if not careful. Use `withTrashed()` which is designed for this.
- **Relationship `associate()` with trashed records** — `$post->user()->associate($trashedUser)` sets the foreign key to a soft-deleted user. Validation should check `user.exists` query doesn't filter trashed records.
- **Cursor pagination order** — if ordering by `created_at`, soft-deleted records may appear interspersed with active records when using `withTrashed()`. Consider a secondary order column.

## Ecosystem Usage
- **Laravel Nova** — resource `$withTrashed = true` property makes trashed records visible. The `TrashedStatus` filter uses `withTrashed()`/`onlyTrashed()` internally.
- **Laravel Telescope** — the `Entry` model does not use soft deletes, but Telescope's pruning commands use similar filtering patterns.
- **Laravel Backpack** — CRUD operations check `withTrashed` on the request and apply the scope conditionally.
- **Spatie Permissions** — `Role` and `Permission` models are soft-deletable; permission checks use `withTrashed()` to avoid orphaned foreign keys.

## Related Knowledge Units

### Prerequisites
- soft-deletes-trait — how the SoftDeletes trait registers its scopes
- Eloquent Query Builder Fundamentals — where clauses, scopes, and building queries
- Laravel Query Scopes — local and global scope mechanics

### Related Topics
- Soft Deletes Trait
- Restoring
- Force Deleting

### Advanced Follow-up Topics
- Global Scopes
- Eloquent Query Scopes

## Research Notes
- In Laravel 8+, `withTrashed()` accepts a boolean argument. `withTrashed(false)` re-applies the filter. This was previously done with a separate `withoutTrashed()` call.
- When using `database` query builder (not Eloquent), soft-delete queries must be manually built: `->whereNull('deleted_at')`.
- MySQL 8.0+ uses `Loose Index Scan` for `IS NULL` conditions; PostgreSQL uses bitmap index scans. Both benefit from a partial index on `deleted_at`.
- Consider using `withTrashed()` inside a transaction when checking for existence before restoring, to avoid race conditions with concurrent restore operations.
