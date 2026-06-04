# Database Constraints

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | Database Constraints |
| Classification | Foundation |
| Last Updated | 2026-06-02 |

## Overview

Database constraints — foreign keys, unique constraints, check constraints, and default values — are the bedrock of data integrity. While Eloquent provides application-level validation, only database-level constraints guarantee integrity in the face of concurrent requests, bugs, or direct database access. Understanding how to define, migrate, and leverage constraints through Eloquent is essential for maintaining referential integrity under all conditions.

## Core Concepts

- **Foreign key constraints**: Enforce that a column value exists in a referenced table. Defined via `$table->foreign('user_id')->references('id')->on('users')`.
- **Cascade behavior**: `ON DELETE CASCADE` auto-deletes children when a parent is deleted. `ON DELETE SET NULL` sets the foreign key to NULL. `ON DELETE RESTRICT` prevents parent deletion if children exist.
- **Unique constraints**: Enforce unique values across a column or combination of columns. `$table->unique('email')` or `$table->unique(['user_id', 'role_id'])`.
- **`foreignIdFor()` helper**: Convention-based foreign key: `$table->foreignIdFor(User::class)->constrained()->cascadeOnDelete()`.
- **Constraint enforcement timing**: Constraints are checked at statement end (or transaction commit). PostgreSQL supports deferred constraints checked at commit time.

## When To Use

- Every foreign key relationship — always define the constraint, not just the column
- Unique email addresses, slugs, or any column that must not have duplicates
- Pivot tables — composite unique constraints prevent duplicate relationships
- Cascade deletes for dependent data (profiles, settings) where the child has no meaning without the parent

## When NOT To Use

- Bulk load operations where constraint checking overhead is unacceptable (use temporary disable with extreme caution)
- Tables where parent deletion should never cascade automatically (use `RESTRICT` to force explicit handling)
- Multi-tenant tables sharing a single schema where constraints would cross tenant boundaries (use application-level enforcement)

## Best Practices

- **Always define foreign key constraints**: An Eloquent `hasMany` is a query helper, not a constraint. Without `constrained()`, the column exists but no referential integrity is enforced. Always chain `->constrained()` after `foreignIdFor()` — this creates the actual database constraint that guarantees no orphan rows.
- **Default to `RESTRICT` for critical data**: `CASCADE` automates cleanup but can cause accidental mass deletion. Use `RESTRICT` for orders, invoices, or any data where deleting a parent should require explicit child handling. Use `CASCADE` for dependent data (profiles, settings) where orphans are meaningless.
- **Index foreign key columns on PostgreSQL/SQLite**: Unlike MySQL, these engines do not auto-index foreign key columns. Add explicit `->index()` calls after `foreignIdFor()` to avoid full table scans on join queries.
- **Audit all `CASCADE` constraints**: Before deploying a migration with `cascadeOnDelete()`, verify the cascade depth and expected row counts. A single parent delete could cascade to delete millions of child rows, locking tables for extended periods.

## Architecture Guidelines

- Define constraints in the same migration that creates the referencing table
- Use `foreignIdFor()` with `constrained()` as the standard pattern for all foreign keys
- Prefer `cascadeOnDelete()` for user-submitted content (posts, comments) and `restrictOnDelete()` for financial/transactional data
- Never disable `FOREIGN_KEY_CHECKS` in production — it opens a window for data corruption

## Performance Considerations

- Foreign key checks add ~5-10% overhead on write operations in MySQL InnoDB — negligible for most applications
- Unique constraints create an index — speeds up lookups but slows writes due to index maintenance
- Cascade deletes on large child sets can lock tables for extended periods; batch-delete manually when removing a parent with millions of children
- Adding foreign key constraints to live tables with millions of rows may lock the table — use `pt-online-schema-change` or `gh-ost` for zero-downtime migrations

## Security Considerations

- Foreign key constraints prevent orphaned records, which could otherwise expose stale authorization data
- Constraint violations leak table structure in error messages — handle gracefully in API responses

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Omitting `->constrained()` | Unaware foreignIdFor does not add constraint | Column exists but no referential integrity | Always chain `->constrained()` |
| Wrong cascade direction | Misunderstanding cascading direction | Accidental mass deletion or orphaned data | `cascadeOnDelete()` on child FK means parent delete cascades to children |
| Not indexing FK on PostgreSQL | MySQL habit | Full table scans on joins | Add explicit `->index()` |
| Disabling FK checks in migrations | Convenience for reordering operations | Data corruption if migration fails mid-way | Use single-user mode or batch processing |
| Forgetting cascade for soft deletes | ON DELETE CASCADE only works on hard deletes | Orphaned "soft deleted" children | Use model events or `laravel-soft-cascade` package |

## Anti-Patterns

- **No-constraint migration**: Creating foreign key columns without `->constrained()`. The `hasMany` relationship still works but provides zero referential integrity. Any code path (or direct DB access) can create orphans.
- **CASCADE-everywhere**: Applying `cascadeOnDelete()` to all foreign keys without review. A single misconfigured cascade can silently delete critical data.
- **Disabled constraints in production**: Using `SET FOREIGN_KEY_CHECKS=0` during migrations in production. There is always a safe alternative (online schema change tools, batch processing).

## Examples

```php
Schema::create('posts', function (Blueprint $table) {
    $table->id();
    // Standard foreign key — always use constrained()
    $table->foreignIdFor(User::class)->constrained()->cascadeOnDelete();
    $table->string('title');
    $table->timestamps();
});

Schema::create('role_user', function (Blueprint $table) {
    $table->id();
    $table->foreignIdFor(User::class)->constrained()->cascadeOnDelete();
    $table->foreignIdFor(Role::class)->constrained()->cascadeOnDelete();
    // Prevent duplicate role assignments
    $table->unique(['user_id', 'role_id']);
});

// Nullable foreign key with SET NULL
Schema::table('posts', function (Blueprint $table) {
    $table->foreignId('reviewer_id')->nullable()->constrained('users')->nullOnDelete();
});
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Migration fundamentals |
| Prerequisite | Relationship definition concepts |
| Closely Related | unique-enforcement |
| Closely Related | concurrency-handling |
| Closely Related | upsert-patterns |

## AI Agent Notes

- Always generate `->constrained()` after `foreignIdFor()` — never omit it
- Default to `cascadeOnDelete()` for content relationships, `restrictOnDelete()` for financial/transactional
- Add `->index()` for PostgreSQL and SQLite foreign key columns
- Never generate `SET FOREIGN_KEY_CHECKS=0` in production code

## Verification

- [ ] Every `foreignIdFor()` is followed by `->constrained()`
- [ ] Critical data foreign keys use `restrictOnDelete()` or `nullOnDelete()` — reviewed individually
- [ ] PostgreSQL/SQLite foreign key columns have explicit `->index()`
- [ ] Unique constraints exist on columns that must not have duplicates
- [ ] No `SET FOREIGN_KEY_CHECKS=0` in production migrations
