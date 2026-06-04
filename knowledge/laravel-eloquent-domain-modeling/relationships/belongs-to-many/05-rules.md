# BelongsToMany Rules

## Rule: Composite-Unique-Pivot
---
## Category
Reliability
---
## Rule
Always add a composite primary key or unique constraint on both foreign key columns in the pivot table migration.
---
## Reason
Without a composite unique constraint, duplicate relationship pairs silently accumulate. This corrupts the relationship and causes incorrect query results.
---
## Bad Example
```php
Schema::create('role_user', function (Blueprint $table) {
    $table->id();
    $table->foreignIdFor(Role::class)->constrained();
    $table->foreignIdFor(User::class)->constrained();
    // No unique constraint — duplicates possible
});
```
---
## Good Example
```php
Schema::create('role_user', function (Blueprint $table) {
    $table->foreignIdFor(Role::class)->constrained()->cascadeOnDelete();
    $table->foreignIdFor(User::class)->constrained()->cascadeOnDelete();
    $table->primary(['role_id', 'user_id']);
});
```
---
## Exceptions
When the pivot table represents a domain entity with its own identity and duplicate semantics are meaningful.
---
## Consequences Of Violation
Duplicate relationship rows, incorrect query results, data integrity corruption.

## Rule: Pivot-WithPivot-Whitelist
---
## Category
Security
---
## Rule
Always call `->withPivot()` to whitelist extra pivot columns instead of accessing them without registration.
---
## Reason
Without `withPivot()`, extra columns are not hydrated onto the pivot model. Accessing them returns `null` silently, causing subtle bugs.
---
## Bad Example
```php
public function roles(): BelongsToMany
{
    return $this->belongsToMany(Role::class);
    // withPivot never called — expires_at is always null
}
```
---
## Good Example
```php
public function roles(): BelongsToMany
{
    return $this->belongsToMany(Role::class)->withPivot('expires_at', 'level');
}
```
---
## Exceptions
When the pivot table has no extra columns beyond the two foreign keys.
---
## Consequences Of Violation
Silent null returns from pivot attribute access, broken application logic, difficult debugging.

## Rule: Sync-Not-Loop-Attach
---
## Category
Performance
---
## Rule
Use `sync()` for atomic pivot set replacement instead of calling `attach()`/`detach()` in a loop.
---
## Reason
`sync()` computes the diff in a single query and executes the minimal INSERT/DELETE operations. Looping generates multiple round trips and race conditions.
---
## Bad Example
```php
// Manual loop — multiple queries, race condition risk
$user->roles()->detach(); // DELETE all
foreach ($roleIds as $id) {
    $user->roles()->attach($id); // N INSERTs
}
```
---
## Good Example
```php
$user->roles()->sync($roleIds); // Single atomic operation
```
---
## Exceptions
When you need different pivot attributes for each ID and `sync()` with attribute arrays is insufficient.
---
## Consequences Of Violation
Multiple database round trips, race conditions, partial updates on failure.

## Rule: Both-Sides-BelongsToMany
---
## Category
Architecture
---
## Rule
Define `belongsToMany` on both sides of a many-to-many relationship for bidirectional access.
---
## Reason
Many-to-many relationships are inherently bidirectional. Defining the relationship on only one side breaks domain navigation and forces consumers to use workarounds.
---
## Bad Example
```php
class User extends Model
{
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class);
    }
}
// Role has no users() relationship — cannot navigate from Role to Users
```
---
## Good Example
```php
class Role extends Model
{
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class);
    }
}
```
---
## Exceptions
When only one direction is needed for the application's domain scope (unusual).
---
## Consequences Of Violation
Incomplete domain model, additional query overhead from workarounds.

## Rule: Pivot-Cascade-On-Delete
---
## Category
Reliability
---
## Rule
Always add `ON DELETE CASCADE` on both foreign keys in the pivot table migration.
---
## Reason
Deleting either side of a many-to-many relationship must remove the corresponding pivot rows. Without cascading, stale pivot rows accumulate and orphaned pairs cause query pollution.
---
## Bad Example
```php
Schema::create('role_user', function (Blueprint $table) {
    $table->foreignIdFor(Role::class)->constrained();
    $table->foreignIdFor(User::class)->constrained();
});
```
---
## Good Example
```php
Schema::create('role_user', function (Blueprint $table) {
    $table->foreignIdFor(Role::class)->constrained()->cascadeOnDelete();
    $table->foreignIdFor(User::class)->constrained()->cascadeOnDelete();
});
```
---
## Exceptions
When pivot rows must persist for audit purposes after source model deletion.
---
## Consequences Of Violation
Orphaned pivot rows, data bloat, incorrect query results.

## Rule: Pivot-As-Custom-Name
---
## Category
Maintainability
---
## Rule
Use `->as('customName')` on `BelongsToMany` to provide a meaningful pivot accessor name instead of the default `pivot`.
---
## Reason
The generic `pivot` property name becomes ambiguous when a model has multiple `BelongsToMany` relationships. Custom names improve code readability.
---
## Bad Example
```php
$role->pivot->expires_at; // "pivot" is vague
```
---
## Good Example
```php
// In relationship: ->as('membership')
$role->membership->expires_at; // Clear semantic meaning
```
---
## Exceptions
When the model has only one `BelongsToMany` relationship.
---
## Consequences Of Violation
Ambiguous code, reduced readability, confusion when multiple pivots exist.

## Rule: SyncWithoutDetaching-For-Additive
---
## Category
Framework Usage
---
## Rule
Use `syncWithoutDetaching()` when adding new relationships should not remove existing ones.
---
## Reason
`sync()` replaces the entire pivot set by default, removing any IDs not in the provided array. This is destructive for additive-only operations.
---
## Bad Example
```php
$user->roles()->sync([4, 5]); // Removes roles 1, 2, 3 unintentionally
```
---
## Good Example
```php
$user->roles()->syncWithoutDetaching([4, 5]); // Adds 4, 5 without removing 1, 2, 3
```
---
## Exceptions
When full replacement is the intended behavior.
---
## Consequences Of Violation
Unintentional data loss, removed relationships, hard-to-detect bugs.

## Rule: Pivot-Column-Indexing
---
## Category
Performance
---
## Rule
Index both foreign key columns individually in pivot tables when queries filter by a single direction frequently.
---
## Reason
The composite primary key covers both-column lookups, but single-column queries (e.g., all pivot rows for one model) cannot use the composite key efficiently without a secondary index.
---
## Bad Example
```php
$table->primary(['role_id', 'user_id']);
// No individual index on role_id — querying by role_id alone is slow
```
---
## Good Example
```php
$table->primary(['role_id', 'user_id']);
$table->index('role_id'); // For single-direction queries
```
---
## Exceptions
When queries always filter by both foreign keys together.
---
## Consequences Of Violation
Slow single-direction queries, full pivot table scans, performance degradation with scale.

## Rule: Validate-Pivot-Input
---
## Category
Security
---
## Rule
Always validate that IDs passed to `attach()` or `sync()` reference real existing records.
---
## Reason
Passing invalid IDs creates pivot rows referencing non-existent models. Without validation, these phantom rows corrupt query results until cleaned up.
---
## Bad Example
```php
$user->roles()->sync($request->input('role_ids')); // No validation
```
---
## Good Example
```php
$validated = $request->validate([
    'role_ids' => 'required|array',
    'role_ids.*' => 'exists:roles,id',
]);
$user->roles()->sync($validated['role_ids']);
```
---
## Exceptions
When IDs come from an authoritative source (database query, trusted internal data).
---
## Consequences Of Violation
Phantom pivot rows, broken queries, data integrity corruption.
