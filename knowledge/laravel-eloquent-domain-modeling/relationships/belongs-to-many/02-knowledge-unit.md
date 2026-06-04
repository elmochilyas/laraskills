# BelongsToMany

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships â€” Part 1: Relationship Types
- **Last Updated:** 2026-06-02

## Executive Summary
`BelongsToMany` defines a many-to-many relationship between two models, mediated by a pivot (intermediate) table. Each model can have multiple related records, and each related record can belong to multiple parent records. This is the only Eloquent relationship type that inherently requires a third database table.

## Core Concepts
- **Pivot table convention:** Singular model names in alphabetical order separated by underscore: `role_user` for `User` and `Role`. Columns: `user_id`, `role_id`.
- **Definition syntax:** `return $this->belongsToMany(Role::class);` on `User`. Custom pivot: `$this->belongsToMany(Role::class, 'role_user', 'user_id', 'role_id')`.
- **Return type:** The dynamic property `$user->roles` returns a `Collection` of `Role` models. Each model has a `pivot` attribute containing pivot table data.
- **Inverse method:** The related model defines the same `belongsToMany` with the same pivot table. Both sides are symmetric.
- **Pivot attributes:** Pivot columns are accessible via `$role->pivot->created_at`. Specify extra columns in the definition: `->withPivot('expires_at')`.
- **Timestamps on pivot:** `->withTimestamps()` adds `created_at` / `updated_at` to the pivot. The pivot table must have those columns.

## Mental Models
- **Join table abstraction:** The pivot table is the physical representation. `BelongsToMany` hides the join behind a fluent API, but every operation translates to a query involving the pivot table.
- **Collection of attachments:** Unlike `HasMany`, the related records are not "owned" by the parent. They exist independently and are merely associated. Deleting the parent does not cascade-delete the related records â€” only the pivot rows are removed.
- **Tagging system:** The canonical example. A `Post` can have many `Tag`s; a `Tag` can have many `Post`s. The pivot table `post_tag` contains `post_id` and `tag_id`.

## Internal Mechanics

> **Reference:** 
- `BelongsToMany` extends `Relation`. It is the most complex built-in relationship type.
- `addEagerConstraints()` generates `SELECT ... FROM roles INNER JOIN role_user ON roles.id = role_user.role_id WHERE role_user.user_id IN (...)`.
- `match()` groups pivot rows by parent key, hydrates the related models with their pivot data, and sets the collection on each parent.
- `attach($id, $attributes)` inserts a pivot row. `detach($id)` deletes pivot rows. `sync($ids)` computes diff and executes insert/delete.
- `toggle($ids)` toggles existence: inserts absent IDs, deletes present IDs.
- `updateExistingPivot($id, $attributes)` updates pivot columns without modifying the relationship.
- `get()` always joins the pivot table and maps pivot data onto each model via `hydratePivotRelation()`.

## Patterns
- **Role-based access control:** `User belongsToMany Role` with pivot `role_user`.
- **Tagging:** `Post belongsToMany Tag` with pivot `post_tag`.
- **Favorites / likes:** `User belongsToMany Post (as 'favorites')` with pivot `favorites`.
- **Many-to-many with metadata:** Pivot has `expires_at`, `quantity`, `price` etc. Accessed via `withPivot('quantity')`.
- **Custom pivot model:** Use `->using(Membership::class)` to define a first-class pivot model with its own logic and traits.

## Architectural Decisions
- **Pivot model vs. array access:** Use `->using(PivotModel::class)` when pivot has behavior (events, casts, relationships). Stay with default `Pivot` for simple link tables.
- **Sync vs. attach/detach:** `sync()` is atomic but sends multiple queries. For bulk operations, detach all then attach all. Consider `syncWithoutDetaching()` for additive-only sync.
- **Custom pivot table name:** If convention `role_user` doesn't fit, use `Member` model with `->using(Membership::class)` and table `memberships`.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Symmetric, intuitive API | Multiple queries per `sync` | Batch large syncs in transactions |
| Rich pivot attribute access | Pivot data adds query overhead | Limit `withPivot` to needed columns |
| `toggle` for simple state | No built-in uniqueness violation | Ensure composite unique on pivot FK pair |

## Performance Considerations
- **Eager loading:** `BelongsToMany` eager loading uses a join query per relationship. With 5+ `belongsToMany` relationships, query volume multiplies.
- **Pivot table indexing:** Add a composite unique index on both foreign key columns. Every query filters on one FK, so index both columns.
- **Chunking:** `BelongsToMany` cannot be chunked efficiently via the relationship directly. Workaround: query the pivot table directly with chunking.
- **Detach all:** `$user->roles()->detach()` generates `DELETE FROM role_user WHERE user_id = ?`. Efficient with index.

## Production Considerations
- **Massive pivot tables:** For millions of rows, `sync()` with two queries (SELECT + bulk INSERT/DELETE) is preferable to iterative attach/detach.
- **Pivot events:** Custom pivot models can define events (`creating`, `deleting`) for audit trails or cache invalidation.
- **Composite unique constraint:** Always add `UNIQUE(user_id, role_id)` to prevent duplicate pivots. Eloquent does not enforce this.

## Common Mistakes
- **Missing inverse:** Only one model defines `belongsToMany`, making the relationship one-directional. Both models must define it for symmetric access.
- **Ignoring pivot data:** Retrieving `$user->roles` without `->withPivot('column')` loses pivot columns. Accessing `$role->pivot->column` on a missing column returns error.
- **N+1 with pivot model access:** Accessing `$role->pivot->customColumn` in a loop loads pivot separately. Eager load with `->with('roles.pivot')` or `->withPivot`.
- **Wrong pivot column order:** The second argument is the foreign key on the *defining* model's side. Third argument is the related key. Swapping them produces incorrect SQL.

## Failure Modes
- **Duplicate pivot rows:** Missing composite unique constraint causes duplicate associations. Detect via `GROUP BY user_id, role_id HAVING COUNT(*) > 1`.
- **Orphaned pivot rows:** Deleting a model without deleting pivot rows. Use `deleting` event or database `ON DELETE CASCADE` on both pivot FK columns.
- **Pivot data inconsistency:** Pivot column values don't match expected schema (e.g., `expires_at` null when required). Validate in custom pivot model.

## Ecosystem Usage
- **Laravel Permissions (Spatie):** `Permission` and `Role` models use `BelongsToMany` with a custom pivot via `->using()`.
- **Laravel Nova:** `BelongsToMany` fields enable multi-select relationship management on resource detail views.
- **Laravel Cashier:** Subscriptions and teams use `BelongsToMany` for user-team associations.

## Related Knowledge Units

### Prerequisites
HasMany, BelongsTo, Database Migrations

### Related Topics
HasOneThrough, HasManyThrough, Polymorphic Many-to-Many

### Advanced Follow-up Topics
Custom Pivot Models, `MorphToMany`, Aggregating With Pivot Conditions

## Research Notes
- **Source Analysis:** `Illuminate\Database\Eloquent\Relations\BelongsToMany.php` (~500 lines) is the largest relationship class. The complexity comes from pivot hydration, sync logic, and pivot column management.
- **Key Insight:** `BelongsToMany` is the only relationship where deleting the parent does NOT cascade to related records. Pivot rows must be cleaned up separately. This is by design â€” the related records exist independently.
- **Version-Specific Notes:** Laravel 10+ allows `->wherePivot('column', 'value')` for filtering pivot columns directly in the relationship definition. Laravel 11 added `->as('membership')` for custom pivot accessor naming.
