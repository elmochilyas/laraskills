# Select Constraints — Column Reduction & Constrained Eager Loading

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Performance & Data Integrity
- **Knowledge Unit:** Select Constraints
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Select constraints are the practice of limiting which columns and related records are retrieved from the database. Every unnecessary column or row fetched wastes memory, network bandwidth, and query execution time. Eloquent provides multiple mechanisms for controlling the SELECT clause: `select()`, `addSelect()`, constrained eager loading, and model `$hidden`/`$visible` for serialization control. Applied deliberately, select constraints reduce query payloads by 50-90% for models with many columns or deeply nested relations.

---

## Core Concepts

- **`select($columns)`:** Restricts the query to retrieve only specified columns: `User::select('id', 'name', 'email')->get()`.
- **`addSelect($columns)`:** Adds columns to an existing select list, useful in query scopes and global scopes.
- **Constrained eager loading:** Limit related records: `Post::with(['comments' => fn($q) => $q->select('id', 'post_id', 'body')])`.
- **`$hidden` / `$visible`:** Model properties that control serialization output (`toArray()`, `toJson()`). Hidden attributes are never serialized; visible attributes are the only ones serialized.
- **`$appends`:** Add computed attributes to serialization output (accessors). These are not database columns but are included in the serialized payload.
- **Column reduction strategy:** Only select the columns you actually need for the current operation. A `User` model with 20 columns should not always SELECT all 20 when you only need `name` and `email`.

---

## Mental Models

### The Grocery Bag Metaphor
Every column you SELECT is an item in your grocery bag. `User::all()` is like buying everything in the store every time you shop. `User::select('id', 'name')` is buying only what you need for tonight's dinner. The bag is lighter and the checkout (query) is faster.

### The Iceberg Metaphor
Most of the data you SELECT is below the surface — you never look at it. Select constraints let you cut off the submerged part of the iceberg, carrying only the visible tip through your application.

---

## Internal Mechanics

- `select()` sets columns on the query builder's `$columns` property. If called multiple times, the last call overwrites previous calls (unless `addSelect()` is used).
- `addSelect()` merges columns into the existing select list using `array_merge()` on the `$columns` array.
- Without `select()`, Eloquent uses `SELECT *` (or more precisely, `SELECT table_name.*` when joins are present).
- Constrained eager loading applies `select()` to the relationship query's subquery, not the parent query. The relationship still eager-loads, but with fewer columns.
- `$hidden` and `$visible` only affect serialization — they do not alter the SELECT clause. The full model columns are still loaded from the database even if hidden from serialization.

---

## Patterns

- **API resource optimization:**
```php
$users = User::select('id', 'name', 'email', 'avatar_url')
    ->with(['posts' => fn($q) => $q->select('id', 'user_id', 'title')])
    ->get();
```
- **List vs detail queries:** Index/list views select minimal columns (`id`, `title`, `status`). Show/detail views select all needed columns.
- **Repository methods with explicit selects:** Define specific query methods that always include the necessary columns, never relying on `SELECT *`.
- **Select binding to models:** `$user = User::select('id', 'name')->find($id)` returns a partial model. Attempting to access unloaded columns returns `null` (unless `preventAccessingMissingAttributes` is enabled).
- **Aggregate with minimal select:** Combine `select()` with `withCount()`:
```php
User::select('id', 'name')->withCount('posts')->get();
```

---

## Architectural Decisions

- **Explicit selects in repositories:** If using repositories, make every query method explicitly declare its select columns. This prevents "SELECT *" from propagating through the application.
- **Partial model risk:** A model with only some columns loaded (`select('id', 'name')`) may be saved back to the database. If `save()` is called, unloaded columns may be set to null or default values. Avoid saving partial models.
- **`select()` vs `$hidden`:** `select()` reduces database I/O. `$hidden` only controls serialization output. Both are needed: `select()` for network/database optimization, `$hidden` for API response privacy.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Reduced query payload | Partial models if saved back to DB | Never save partial models |
| Faster query execution | Multiple query variants to maintain | Repository pattern helps organize |
| Lower memory usage per model | Cannot access unselected columns | Use `preventAccessingMissingAttributes` to catch bugs |
| Smaller API responses | Extra select() calls in every query | Negligible compared to row data savings |
| Constrained eager loading saves related data | Slightly more verbose code | Document column selection in repository methods |

---

## Performance Considerations

- Selecting 5 columns instead of 20 reduces row data transfer by ~75%. For 10,000 rows, this is the difference between ~2 MB and ~500 KB of data.
- Column reduction helps MySQL's storage engine — InnoDB reads fewer pages from disk when columns are narrower.
- Constrained eager loading reduces memory for related data: loading 10,000 comments with only `id` and `body` instead of all 15 columns saves significant memory.
- The `DISTINCT` requirement: If using `join()` and the parent SELECT returns duplicate rows, `select('parent.*')` with `->distinct()` prevents duplicates.

---

## Production Considerations

- **Never select sensitive columns for list views:** If a model has `ssn`, `password_reset_token`, or `internal_notes`, always explicitly select only needed columns in non-privileged queries. `$hidden` prevents serialization but does not prevent the data from being loaded into memory.
- **Audit `SELECT *` queries:** Database monitoring tools (VividCortex, pgBadger, MySQL Enterprise Monitor) can flag `SELECT *` queries. Set up alerts for tables with >10 columns.
- **Partial model safety:** Add `preventAccessingMissingAttributes()` in development to catch attempts to access unloaded columns:
```php
Model::preventAccessingMissingAttributes();
```
- **Caching with selected columns:** Cache partial models carefully — the cache key should include the selected columns to avoid returning partial data when the application expects full models.

---

## Common Mistakes

- **Saving partial models:** `User::select('id', 'name')->find(1)->update(['email' => 'new@example.com'])` — `email` is not loaded, so it's not set, and the update may fail or produce unexpected results.
- **Selecting on joined queries without disambiguating:** `Post::join('users', 'posts.user_id', 'users.id')->select('name')` — ambiguous column `name`. Use `select('users.name')` or `select('posts.*')`.
- **Using `$hidden` instead of `select()`:** `$hidden` prevents serialization but still loads data into memory. For sensitive or very large columns (BLOBs, TEXT fields), use `select()` to avoid loading them entirely.
- **Not selecting the foreign key in relation queries:** When constraining eager loading, always include the foreign key column: `with(['comments' => fn($q) => $q->select('id', 'post_id', 'body')])`. Without `post_id`, Eloquent cannot match comments to posts.

---

## Failure Modes

- **Partial model save corruption:** A partial model (loaded with `select('id', 'name')`) is saved. Columns not loaded are set to their database defaults or null, overwriting existing data. Mitigation: never save partial models.
- **Missing column in eager loading select:** `Post::with(['comments' => fn($q) => $q->select('id', 'body')])` — missing `post_id`. All comments fail to match because the foreign key is not loaded. Always include the foreign key in constrained selects.
- **Serialization mismatch:** `$hidden` removes a column from JSON output, but the column is still loaded in memory. If the application relies on `$hidden` to protect sensitive data, a debugger or dump can expose it.
- **Inconsistent select across code paths:** Some code paths load full models, others load partial. When a partial model is passed to a function expecting a full model, the result is silent null values for missing columns.

---

## Ecosystem Usage

- **Laravel Nova:** Resource `fields()` method controls which columns are displayed per view. Nova internally selects only visible columns for index views.
- **Laravel API Resources:** `toArray()` method controls serialization output. Combined with `whenLoaded()` to conditionally include relationships.
- **Laravel Telescope:** Query collector shows the full SELECT clause for each query — useful for auditing column selection practices.

---

## Related Knowledge Units

### Prerequisites
- Eloquent query builder basics
- Model serialization (`toArray()`, `$hidden`, `$visible`)

### Related Topics
- `prevention-strategies` (eager loading with constraints)
- `index-aware-queries` (using indexes to support column selection)
- `subquery-optimization` (select within subqueries)

### Advanced Follow-up Topics
- Computed columns and generated columns as alternatives to application-level selects
- Column-level database permissions for sensitive data
- Materialized view patterns for pre-optimized selects

---

## Research Notes

### Source Analysis
`Illuminate\Database\Query\Builder::select()` and `addSelect()` at `src/Illuminate/Database/Query/Builder.php`. The `$columns` property is `null` by default (meaning `SELECT *`). Eloquent's `Builder` inherits these methods.

### Key Insight
Select constraints are an optimization that must be balanced against code maintainability. Over-optimizing selects (choosing different columns for every query) creates a maintenance burden. A good rule of thumb: optimize selects for the 3 most common query patterns per model; use `SELECT *` sparingly for administrative/development contexts.

### Version-Specific Notes
- Laravel 8+: `Model::preventAccessingMissingAttributes()` introduced — throws exception when accessing unloaded model attributes.
- Laravel 9+: Constrained eager loading performance improvements.
- Laravel 10+: `addSelect()` support in `with()` constraint closures for more flexible relation column selection.
