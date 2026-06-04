## Always Chain constrained() After foreignIdFor()
---
## Category
Reliability
---
## Rule
Every `foreignIdFor()` or `foreignId()` call must be followed by `->constrained()` unless there is a documented exception.
---
## Reason
`foreignIdFor()` creates only the column — it does not create a foreign key constraint. Without `->constrained()`, the database has no referential integrity guarantee. An Eloquent `hasMany` relationship is a query helper, not a constraint; any code path or direct DB access can create orphan rows.
---
## Bad Example
```php
Schema::create('posts', function (Blueprint $table) {
    $table->id();
    $table->foreignIdFor(User::class); // No constraint — orphans possible
});
```
---
## Good Example
```php
Schema::create('posts', function (Blueprint $table) {
    $table->id();
    $table->foreignIdFor(User::class)->constrained();
});
```
---
## Exceptions
Temporary migration steps where the referenced table does not yet exist. Must be added in the same migration batch or immediately after.
---
## Consequences Of Violation
Orphaned child records when parent records are deleted. Silent data integrity degradation that is difficult to detect without data audits.
---
## Default to restrictOnDelete for Critical Data
---
## Category
Reliability
---
## Rule
Use `restrictOnDelete()` for foreign keys referencing financial, transactional, or audit data. Use `cascadeOnDelete()` only for dependent content (profiles, settings, user-submitted content).
---
## Reason
`cascadeOnDelete()` automates cleanup but can cause accidental mass deletion. Deleting a customer automatically deletes all their invoices, transactions, and audit logs — often irreversibly. `restrictOnDelete()` forces explicit handling of child records, preventing silent data loss.
---
## Bad Example
```php
$table->foreignIdFor(Customer::class)->constrained()->cascadeOnDelete();
// Deleting a customer silently deletes all their invoices and payments
```
---
## Good Example
```php
$table->foreignIdFor(Customer::class)->constrained()->restrictOnDelete();
// Cannot delete customer with active invoices — requires explicit handling
```
---
## Exceptions
User-generated content (posts, comments, likes) where the child has no meaning without the parent — cascade is appropriate.
---
## Consequences Of Violation
Irreversible data loss from accidental parent deletion. A single `DELETE` cascades to delete potentially millions of child rows across multiple tables.
---
## Index Foreign Key Columns on PostgreSQL and SQLite
---
## Category
Performance
---
## Rule
Add explicit `->index()` after `foreignIdFor()` on PostgreSQL and SQLite databases.
---
## Reason
Unlike MySQL (which auto-indexes foreign key columns), PostgreSQL and SQLite do not create indexes on foreign key columns automatically. Without the explicit index, JOINs between parent and child tables perform full table scans on the child table.
---
## Bad Example
```php
// On PostgreSQL or SQLite:
Schema::create('posts', function (Blueprint $table) {
    $table->foreignIdFor(User::class)->constrained();
    // No index on user_id — JOINs scan the entire posts table
});
```
---
## Good Example
```php
Schema::create('posts', function (Blueprint $table) {
    $table->foreignIdFor(User::class)->constrained()->index();
    // Indexed — JOINs use index lookups
});
```
---
## Exceptions
MySQL-only projects — MySQL auto-indexes foreign key columns, making the explicit `->index()` redundant (but harmless).
---
## Consequences Of Violation
Full table scans on every JOIN involving the foreign key column. Query times degrade linearly with table growth, from milliseconds at 1k rows to seconds at 1M rows.
---
## Audit All CASCADE Constraints Before Deployment
---
## Category
Reliability
---
## Rule
Review every `cascadeOnDelete()` constraint for cascade depth and expected row counts before deploying the migration.
---
## Reason
A single parent deletion can cascade through multiple levels (parent → children → grandchildren) and delete millions of rows. This locks tables for extended periods, causes replication lag, and may time out. Understanding the cascade graph prevents production incidents.
---
## Bad Example
```php
// No review — cascade chain unknown
$table->foreignIdFor(User::class)->constrained()->cascadeOnDelete();
// User has 100k posts, each has 10 comments, each has 5 likes
// Deleting one user deletes 100k + 1M + 5M rows
```
---
## Good Example
```php
// Reviewed: User posts cascade is acceptable (< 10k per user)
$table->foreignIdFor(User::class)->constrained()->cascadeOnDelete();
// For large cascade chains, batch-delete manually
```
---
## Exceptions
Tables guaranteed to have few child rows per parent (< 100). Document the guarantee in a comment.
---
## Consequences Of Violation
Extended table locks, replication lag in MySQL, query timeouts, and potential database unavailability during cascade operations.
---
## Never Disable FOREIGN_KEY_CHECKS in Production
---
## Category
Reliability
---
## Rule
Do not execute `SET FOREIGN_KEY_CHECKS=0` in production migrations or application code.
---
## Reason
Disabling foreign key checks opens a window for data corruption. Rows can be inserted with invalid references, or parent rows can be deleted while children reference them. Any migration that requires disabled checks can be performed safely using online schema change tools.
---
## Bad Example
```php
DB::statement('SET FOREIGN_KEY_CHECKS=0');
// Migration that could leave orphans
DB::statement('SET FOREIGN_KEY_CHECKS=1');
```
---
## Good Example
```php
// Use pt-online-schema-change or gh-ost for zero-downtime migrations
// Or restructure migration order to respect constraints
```
---
## Exceptions
Single-user maintenance mode where no concurrent operations occur. Document the maintenance window explicitly.
---
## Consequences Of Violation
Orphaned rows, broken referential integrity, and silent data corruption that may not be detected for weeks. Once constraint checks are re-enabled, existing violations prevent legitimate operations.
---
## Handle Cascade for Soft Deletes Separately
---
## Category
Maintainability
---
## Rule
Do not rely on `ON DELETE CASCADE` for soft-deleted models — implement cascade logic via model events or a dedicated package.
---
## Reason
`ON DELETE CASCADE` only triggers on hard (actual) deletes. When a parent is soft-deleted, the `deleted_at` column is set but the SQL `DELETE` never executes — so the cascade never fires. Child rows remain fully visible unless explicitly handled.
---
## Bad Example
```php
Schema::create('posts', function (Blueprint $table) {
    $table->foreignIdFor(User::class)->constrained()->cascadeOnDelete();
    // Soft-deleting User does not cascade to Posts
});
```
---
## Good Example
```php
// In User model boot()
protected static function booted(): void
{
    static::deleting(function ($user) {
        if ($user->isForceDeleting()) {
            return; // cascadeOnDelete handles hard deletes
        }
        $user->posts()->delete(); // Soft-delete children
    });
}
```
---
## Exceptions
Tables that do not use soft deletes — cascade works correctly for hard deletes.
---
## Consequences Of Violation
"Soft-deleted" parents have fully visible children. User-facing queries return posts from deleted users, reports include orphaned transaction records, and data audits show integrity violations.
