# Pivot Attributes

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships
- **Knowledge Unit:** Pivot Attributes
- **Difficulty Level:** Intermediate
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Pivot attributes are the extra columns on a many-to-many pivot table beyond the two foreign keys. Eloquent provides the `withPivot()` method to whitelist which extra columns are hydrated onto the pivot model, and `withTimestamps()` to automatically populate `created_at`/`updated_at`. Accessing pivot data via `$model->pivot->attribute` is the standard read pattern, while `attach()`, `sync()`, and `updateExistingPivot()` provide write access. Understanding pivot attribute management is essential for any many-to-many relationship that carries metadata — quantities, roles, flags, or timestamps.

---

## Core Concepts

By default, Eloquent only hydrates the two foreign key columns onto the pivot model. All other pivot table columns are ignored unless explicitly included via `withPivot()`. The `withPivot()` method accepts an array of column names or variadic string arguments: `->withPivot('expires_at', 'level')`. For timestamp columns, `withTimestamps()` is a shortcut that adds `created_at` and `updated_at`. Pivot attributes are accessed through the dynamically-created `pivot` property on each related model — `$role->pivot->expires_at`. For custom pivot models, the same attributes are available plus any accessors/casts defined on the pivot class. Writing pivot data uses `attach()` with extra attributes (second argument array), `sync()` with attribute arrays per related ID, or `updateExistingPivot()` for modifying a single pivot row.

---

## Mental Models

Think of pivot attributes as **edge weights on a graph**. The foreign keys define the connection (which two nodes are linked), and the extra attributes define the properties of that connection (strength, duration, type). This is distinct from node properties (model attributes) — the `expires_at` of a membership is not a property of the user or the group, but of the user-group relationship itself. This mental model clarifies why pivot attributes are accessed via `->pivot` rather than directly on the model: they belong to the relationship, not either endpoint.

---

## Internal Mechanics

When a `BelongsToMany` query runs, the select clause includes `{$table}.*` (all pivot columns). However, `hydratePivotRelation()` in the relation class only keeps attributes that are in the `$pivotColumns` array (populated by `withPivot()`). If `withPivot()` hasn't been called, only the foreign keys are kept. The `Pivot` model stores these attributes in its internal `$attributes` array like any Eloquent model. The `pivot` property on the related model is a `Pivot` instance (or custom pivot instance) that holds `$attributes`, `$original`, and supports dirty checking. For `attach()`, the extra attributes are passed directly to the `INSERT` query. For `sync()`, each related ID can be paired with an array of extra attributes: `$user->roles()->sync([1 => ['expires_at' => now()], 2 => ['expires_at' => null]])`. `updateExistingPivot($id, $attributes)` performs an `UPDATE WHERE` on the matching pivot row.

---

## Patterns

- **Whitelist only needed columns**: Use `withPivot('col1', 'col2')` rather than selecting all pivot columns to reduce memory and avoid unintended data exposure in API responses.
- **Timestamped pivots**: Always call `->withTimestamps()` on the relationship if the pivot migration includes `timestamps()`. Without it, the columns exist in the DB but are never populated.
- **Sync with attributes**: Pass an associative array of `[id => [attr => value]]` to `sync()` for bulk pivot attribute updates in a single atomic operation.
- **Pivot attribute accessors**: On custom pivot models, define `getExpiresAtAttribute()` for computed values or formatting.
- **Pivot attribute casting**: Use `protected $casts = ['expires_at' => 'datetime']` on the custom pivot model for automatic type conversion.
- **Read-only pivot attributes**: If pivot columns should not be writable via `sync()`/`attach()`, keep them out of the relationship definition and manage them through dedicated pivot model methods.

---

## Architectural Decisions

Laravel's decision to hide extra pivot columns by default (requiring `withPivot()` to reveal them) is a deliberate tradeoff. Pivot tables can accumulate many columns — selecting all of them on every relationship hydration wastes memory and bandwidth. The whitelist approach ensures that only explicitly requested columns are loaded. However, this means developers must remember to call `withPivot()` for every relationship that uses extra pivot columns, and the whitelist must be kept in sync with the migration. Custom pivot models partially mitigate this because they can define `$casts` that implicitly expect certain columns.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Memory efficiency — only requested columns loaded | Forgetting `withPivot()` yields missing attributes | Debug: pivot attribute returns `null` silently — hard to distinguish from a null DB value |
| Explicit column declarations make queries predictable | Duplication across relationship definitions | DRY up pivot column lists via model constants or pivot model `$appends` |
| `sync()` with attributes is powerful but ergonomic | Attribute arrays in `sync()` are not validated | Invalid attribute names silently ignored — rows created with missing data |
| Pivot attribute casting on custom models | Must create a full pivot class for simple casting | Use `withPivot()` with manual casting in the parent model for simple cases |

---

## Performance Considerations

Every extra pivot column selected in the join query adds to the result set size. For large collections (thousands of related models), wide pivot columns (text, JSON) increase memory pressure. Use `withPivot()` to select only the columns you actually need. Avoid selecting blob/text columns on pivots if they're not used in the current context. Timestamp columns (`created_at`, `updated_at`) add minimal overhead (8 bytes each) and are generally safe to include.

---

## Production Considerations

API responses that include related models with pivot data may expose internal pivot attributes. Always call `withPivot()` to limit which columns are serialized, or use `$hidden` / `$appends` on the custom pivot model to control JSON output. Pivot timestamps in production should use the application's default timezone consistently. When using `sync()` with attributes in a high-concurrency environment, consider wrapping in a transaction to prevent race conditions on the pivot row.

---

## Common Mistakes

- **Accessing pivot attributes without `withPivot()`**: Why it happens: the attribute exists in the DB but isn't whitelisted. Why it's harmful: `$role->pivot->expires_at` returns `null` even though the DB has a value — silent bug. Better approach: always call `->withPivot(...)` for every extra column you need to read.
- **Forgetting `withTimestamps()` on a timestamped pivot**: Why it happens: the migration has `timestamps()` but the relationship doesn't declare it. Why it's harmful: `created_at` and `updated_at` remain `NULL` in the database. Better approach: make it a habit to chain `->withTimestamps()` on every `belongsToMany` where the pivot has timestamp columns.
- **Passing nested arrays to `attach()` incorrectly**: Why it happens: trying `$user->roles()->attach([1 => ['expires_at' => now()]])` without detach/sync. Why it's harmful: `attach()` with ID-only works fine, but attaching existing pairs creates duplicates. Better approach: use `sync()` (without detach) for upsert behavior with attributes.
- **Assuming pivot attributes are cast without a custom model**: Why it happens: expecting `expires_at` to be a Carbon instance from the generic `Pivot` model. Why it's harmful: the value is a raw string/timestamp integer. Better approach: either cast manually in the consumer code or define a custom pivot model with `$casts`.

---

## Failure Modes

- **Missing attribute on pivot**: If `withPivot()` omits a column, reads return `null` — indistinguishable from a genuinely null database value.
- **Attribute collision**: If a pivot column has the same name as a related model attribute, accessing `$model->attribute` returns the model's attribute, not the pivot's. Use `$model->pivot->attribute` explicitly.
- **Type mismatch on write**: Passing a string to a pivot column expected to be an integer causes a MySQL truncation or cast error at the database level.
- **Sync attribute loss**: Using `sync([1 => ['level' => 3], 2 => ['level' => 5]])` on a pivot that has other extra columns drops those columns' values for synced IDs unless `detach` is `false`.

---

## Ecosystem Usage

Nova resource tools that display pivot data rely on `withPivot()` to make extra columns available for display and editing. Spatie's permissions package uses pivot attributes (`guard_name`, `team_id`) on the `model_has_roles` pivot. E-commerce systems store `quantity`, `price`, or `discount` on product-order pivot rows. Membership/subscription systems store `joined_at`, `expires_at`, and `role` on user-group pivot rows.

---

## Related Knowledge Units

### Prerequisites
- pivot-table-conventions (knowing which columns exist on the pivot)
- Eloquent Basics (accessing model attributes, casting)

### Related Topics
- custom-pivot-models (rich type safety for pivot attributes)
- pivot-events (reacting to changes in pivot attributes)
- eager-loading-fundamentals (eager loading affects when pivot data is available)

### Advanced Follow-up Topics
- JSON columns on pivot tables (querying JSON pivot data)
- Computed pivot attributes via database views
- Pivot attribute auditing (tracking changes to pivot columns over time)

---

## Research Notes

### Source Analysis
`BelongsToMany::withPivot()` at `src/Illuminate/Database/Eloquent/Relations/BelongsToMany.php` merges column names into `$this->pivotColumns`. `BelongsToMany::hydratePivotRelation()` filters the raw pivot row to only these columns. The `sync()` method's array-based attribute syntax is documented in `Illuminate/Database/Eloquent/Relations/Concerns/InteractsWithPivotTable`.

### Key Insight
The `withPivot()` whitelist is a protective default — it's easier to add columns when needed than to debug why extra data is leaking into serialized output. The most common pivot attribute bug is forgetting to whitelist, not whitelisting too much.

### Version-Specific Notes
The `sync()` attribute syntax has been stable since Laravel 5.x. Laravel 10+ supports `syncWithPivotValues($ids, $attributes)` as a convenience method that sets the same attributes for all given IDs. Laravel 11 did not change pivot attribute APIs.
