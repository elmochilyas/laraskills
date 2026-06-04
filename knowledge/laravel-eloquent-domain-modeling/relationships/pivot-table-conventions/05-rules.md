# Pivot Table Conventions Rules

## Rule: PivotTable-Singular-Alphabetical-Name
---
## Category
Code Organization
---
## Rule
Name pivot tables using singular model names in alphabetical order, separated by an underscore (`role_user`, not `user_role` or `roles_users`).
---
## Reason
Eloquent's convention resolves table names from model names in alphabetical singular order. Non-conventional names require explicit table name arguments and cause confusion.
---
## Bad Example
```php
// Table named 'user_role' — violates alphabetical convention
// Eloquent expects 'role_user'
```
---
## Good Example
```php
Schema::create('role_user', function (Blueprint $table) {
    // alphabetical: Role, User -> role_user
});
```
---
## Exceptions
When the pivot table has a domain-specific name (`memberships` instead of `team_user`).
---
## Consequences Of Violation
Eloquent fails to resolve table name, explicit table parameter required everywhere.

## Rule: PivotTable-Composite-Primary-Key
---
## Category
Reliability
---
## Rule
Use a composite primary key on both foreign key columns instead of an auto-increment `id` as the primary key.
---
## Reason
The FK pair is the natural key for pivot rows. An auto-increment `id` without a unique constraint on the FK pair allows duplicate relationship pairs, corrupting the data.
---
## Bad Example
```php
Schema::create('role_user', function (Blueprint $table) {
    $table->id();
    $table->foreignIdFor(Role::class)->constrained();
    $table->foreignIdFor(User::class)->constrained();
    // No unique constraint on FK pair — duplicates possible
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
When the pivot table represents a domain entity with its own identity and is not purely a relationship table.
---
## Consequences Of Violation
Duplicate pivot rows, corrupted relationship data, incorrect query results.

## Rule: PivotTable-Cascade-On-Delete
---
## Category
Reliability
---
## Rule
Always add `ON DELETE CASCADE` on both foreign key constraints in the pivot migration.
---
## Reason
Deleting a model on either side of a many-to-many relationship must remove the corresponding pivot rows. Without cascading, orphaned pivot rows accumulate and cause query pollution.
---
## Bad Example
```php
$table->foreignIdFor(Role::class)->constrained();
$table->foreignIdFor(User::class)->constrained();
// No cascade — deleting Role leaves orphaned pivot rows
```
---
## Good Example
```php
$table->foreignIdFor(Role::class)->constrained()->cascadeOnDelete();
$table->foreignIdFor(User::class)->constrained()->cascadeOnDelete();
```
---
## Exceptions
When pivot rows must persist for audit purposes after source deletion.
---
## Consequences Of Violation
Orphaned pivot rows, data bloat, relationship queries returning stale data.

## Rule: PivotTable-WithTimestamps-Sync
---
## Category
Reliability
---
## Rule
Call `->withTimestamps()` on the `BelongsToMany` relationship when the pivot migration includes `$table->timestamps()`.
---
## Reason
`withTimestamps()` instructs Eloquent to populate `created_at` and `updated_at` on pivot rows during `attach()` and `sync()`. Without it, timestamp columns exist but remain null.
---
## Bad Example
```php
// Migration has timestamps
$table->timestamps();

// Relationship does NOT have withTimestamps
return $this->belongsToMany(Role::class);
// Timestamps never populated
```
---
## Good Example
```php
return $this->belongsToMany(Role::class)->withTimestamps();
```
---
## Exceptions
When pivot timestamps are managed manually or are intentionally not used.
---
## Consequences Of Violation
Null timestamps in pivot rows, broken time-based queries on relationship data.

## Rule: PivotTable-Index-Both-Foreign-Keys
---
## Category
Performance
---
## Rule
Index each foreign key column individually when the pivot table is frequently queried by a single direction.
---
## Reason
The composite primary key covers two-column lookups but cannot be used efficiently for single-column filters. Individual indexes speed up single-direction queries.
---
## Bad Example
```php
$table->primary(['role_id', 'user_id']);
// No single-column index on role_id — filtering by role_id scans
```
---
## Good Example
```php
$table->primary(['role_id', 'user_id']);
$table->index('role_id');
$table->index('user_id');
```
---
## Exceptions
When queries always filter by both columns together.
---
## Consequences Of Violation
Slow single-direction queries, full table scans on large pivot tables.

## Rule: PivotTable-Not-For-One-To-Many
---
## Category
Design
---
## Rule
Do not use a pivot table for one-to-many relationships — use a foreign key column on the child table.
---
## Reason
One-to-many relationships are represented by a single foreign key on the child table. Using a pivot table adds unnecessary complexity, an extra table, and violates the domain model.
---
## Bad Example
```php
// Post belongs to User — but using a pivot table instead of user_id on posts
Schema::create('post_user', function (Blueprint $table) {
    $table->foreignIdFor(Post::class);
    $table->foreignIdFor(User::class);
});
```
---
## Good Example
```php
Schema::create('posts', function (Blueprint $table) {
    $table->foreignId('user_id')->constrained();
});
```
---
## Exceptions
None.
---
## Consequences Of Violation
Overly complex schema, unnecessary joins, domain modeling confusion.

## Rule: PivotTable-Not-For-Domain-Entity
---
## Category
Design
---
## Rule
Do not use a pivot table when the intermediate should be a full domain entity with its own table.
---
## Reason
Pivot tables are for simple many-to-many associations. When the intermediate has its own behavior, attributes, lifecycle, or identity, promote it to a dedicated model.
---
## Bad Example
```php
// Using a pivot table for orders with multiple items
// OrderItem should be a full model, not a pivot
```
---
## Good Example
```php
// OrderItem is a full model with its own migration
Schema::create('order_items', function (Blueprint $table) {
    $table->id();
    $table->foreignIdFor(Order::class)->constrained();
    $table->foreignIdFor(Product::class)->constrained();
    $table->integer('quantity');
    $table->decimal('price', 10, 2);
});
```
---
## Exceptions
When the intermediate truly has no behavior beyond storing the association.
---
## Consequences Of Violation
Missing domain logic, inability to add behavior, architectural debt.
