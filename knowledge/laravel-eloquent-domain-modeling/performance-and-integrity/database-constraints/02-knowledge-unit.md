# Database Constraints — Foreign Key & Cascade Behavior

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Performance & Data Integrity
- **Knowledge Unit:** Database Constraints
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Database constraints — foreign keys, unique constraints, check constraints, and default values — are the bedrock of data integrity in Eloquent applications. While Eloquent provides application-level validation, only database-level constraints guarantee integrity in the face of concurrent requests, bugs, or direct database access. Understanding how to define, migrate, and leverage constraints through Eloquent is essential for building systems that maintain referential integrity under all conditions.

---

## Core Concepts

- **Foreign key constraints:** Enforce that a column value exists in a referenced table. Defined via `$table->foreign('user_id')->references('id')->on('users')` in migrations.
- **Cascade behavior:** `ON DELETE CASCADE` automatically deletes child rows when a parent is deleted. `ON DELETE SET NULL` sets the foreign key to `NULL`. `ON DELETE RESTRICT` prevents parent deletion if children exist.
- **Unique constraints:** Enforce that a column or combination of columns has unique values across the table. `$table->unique('email')` or `$table->unique(['user_id', 'role_id'])`.
- **Foreign key indexes:** Foreign key columns should always be indexed. MySQL automatically indexes foreign key columns; PostgreSQL and SQLite do not.
- **`foreignIdFor()` helper:** Convention-based foreign key migration method: `$table->foreignIdFor(User::class)->constrained()->cascadeOnDelete()`.
- **Constraint enforcement timing:** Constraints are checked at the end of each statement (or transaction in some engines). Deferred constraints (PostgreSQL) allow deferring the check to transaction commit.

---

## Mental Models

### The Safety Net Metaphor
Application validation is a tightrope walker's balance — it requires perfect execution every time. Database constraints are the safety net below. Even if the walker falls (a bug in business logic), the net catches the data integrity violation.

### The Contract Analogy
Think of each foreign key as a contract: "Every `user_id` in the `posts` table promises to have a matching `id` in the `users` table." The database enforces this contract on every insert, update, and delete — regardless of which code path initiated the change.

---

## Internal Mechanics

- When a foreign key constraint is defined, MySQL/PostgreSQL creates an internal index on the referencing column (MySQL implicit, PostgreSQL explicit).
- On `UPDATE` or `DELETE` of a parent row, the database checks for referencing rows. The action (`CASCADE`, `SET NULL`, `RESTRICT`, `NO ACTION`) determines the behavior.
- For `CASCADE`, MySQL performs the cascading operation in the same statement — it does not fire triggers for the cascaded rows (this is engine-specific).
- Eloquent's `delete()` method executes `DELETE FROM table WHERE id = ?`. With `ON DELETE CASCADE`, the database handles child deletion automatically. Without it, Eloquent does not cascade by default — you must manually delete children or configure model events.

---

## Patterns

- **Standard foreign key migration:**
```php
$table->foreignIdFor(User::class)->constrained()->cascadeOnDelete();
```
- **Composite unique constraint:** `$table->unique(['user_id', 'role_id'])` for many-to-many pivot uniqueness.
- **Soft delete cascade:** For models using `SoftDeletes`, foreign key `ON DELETE SET NULL` can nullify foreign keys on soft delete. Or handle cascading soft deletes via model events.
- **Nullable foreign key:** `$table->foreignIdFor(User::class)->nullable()->constrained()->nullOnDelete()` for optional relationships.
- **Constrained foreign key with custom column name:** `$table->foreignId('author_id')->constrained('users')`.

---

## Architectural Decisions

- **CASCADE vs. RESTRICT:** `CASCADE` automates cleanup but can cause accidental mass deletion. `RESTRICT` prevents deletion of parent rows with children — forces explicit child management. Default to `RESTRICT` for critical data (orders, invoices) and `CASCADE` for dependent data (profiles, settings).
- **Database-level vs. application-level integrity:** Database constraints are non-negotiable for referential integrity. Application validation is for business logic errors, not referential integrity. Both are needed; they are not alternatives.
- **Deferred constraints (PostgreSQL):** Allow `INSERT` operations that temporarily violate constraints, checked only at transaction commit. Useful for complex multi-table operations where the order of operations cannot satisfy immediate constraints.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Guaranteed referential integrity | Migration overhead; constraint changes require careful planning | Test migrations with production-sized data |
| Automatic cascading behavior | Accidental cascade deletes if misconfigured | Audit all `CASCADE` constraints; prefer `RESTRICT` for critical paths |
| `foreignIdFor()` reduces boilerplate | Convention assumes singular model name | Explicitly pass table name for non-conventional names |
| Unique constraints prevent duplicates | Index overhead on insert/update | Marginal — unique indexes also speed up lookups |
| Constraints catch bugs from any code path | Can cause deadlocks in concurrent workloads | Use retry logic and transaction ordering |

---

## Performance Considerations

- Foreign key checks add overhead on every INSERT, UPDATE, and DELETE on the referencing table. For bulk operations, temporarily disabling constraint checks (not recommended in production) can improve throughput.
- Unique constraints create an index — this speeds up lookups but slows down writes due to index maintenance.
- Cascade deletes on large child sets can lock tables for extended periods. PostgreSQL handles this better than MySQL.
- Foreign key indexes are critical: the database performs a lookup on the child table's foreign key column for every parent delete/update.

---

## Production Considerations

- **Constraint additions lock tables:** Adding a foreign key constraint to a live table with millions of rows may lock the table for the duration. Use `pt-online-schema-change` (Percona) or `gh-ost` for zero-downtime migrations.
- **Cascade delete performance:** Deleting a parent with 1M child rows via `ON DELETE CASCADE` locks the child table for the duration. Batch-delete children manually before deleting parents in high-traffic environments.
- **MySQL foreign key overhead:** InnoDB's foreign key checking adds ~5-10% overhead on write operations. Measure before optimizing — usually negligible.
- **Monitor constraint violations:** Track `SQLSTATE[23000]` errors in logs to detect application bugs that bypass validation.

---

## Common Mistakes

- **Omitting `->constrained()`:** Using `foreignIdFor()` without `constrained()` creates the column but not the constraint — no referential integrity.
- **Wrong cascade direction:** `cascadeOnDelete()` on the child table's foreign key means deleting a *parent* cascades to *children*. This is usually what you want, but misunderstanding the direction can lead to data loss surprises.
- **Not indexing foreign keys on PostgreSQL/SQLite:** Unlike MySQL, these engines do not auto-index foreign keys. Add explicit `->index()` calls.
- **Forgetting cascade behavior for soft deletes:** `ON DELETE CASCADE` triggers on actual row deletion, not on soft delete. For soft delete cascading, use model events or a package like `askedio/laravel-soft-cascade`.
- **Disabling foreign key checks in production migrations:** `DB::statement('SET FOREIGN_KEY_CHECKS=0')` disables integrity — use only in single-user maintenance mode.

---

## Failure Modes

- **Cascade delete surge:** Deleting one parent cascades to delete thousands of children, locking tables and causing timeouts. Monitor cascade depth; batch-delete where possible.
- **Constraint violation during bulk insert:** A bulk insert with invalid foreign keys fails mid-way, rolling back the entire batch. Validate data before bulk insert.
- **Deadlock from cascade and concurrent writes:** Cascade deletes acquire row-level locks on child rows. Concurrent writes to the same child rows can deadlock. Keep transactions short.
- **Circular cascade:** Table A references Table B, which references Table A, both with `ON DELETE CASCADE`. Deleting a row from either table triggers infinite recursion (MySQL detects and prevents this).

---

## Ecosystem Usage

- **Laravel Jetstream / Fortify:** Uses foreign key `CASCADE` for team-user relationships and `SET NULL` for optional profile associations.
- **Spatie Laravel Permission:** Pivot tables (`model_has_roles`, `role_has_permissions`) use foreign keys with `CASCADE` for referential integrity.
- **Laravel Cashier:** Subscription tables use foreign keys with `CASCADE` to ensure orphaned subscription records are cleaned up when users are deleted.

---

## Related Knowledge Units

### Prerequisites
- Migration fundamentals (column types, table creation)
- Eloquent relationship fundamentals (for understanding relationship direction)

### Related Topics
- `unique-enforcement` (firstOrCreate, createOrFirst patterns)
- `concurrency-handling` (locking with foreign key constraints)
- `upsert-patterns` (handling unique constraint conflicts)

### Advanced Follow-up Topics
- PostgreSQL deferred constraints
- Online schema migration tools (pt-online-schema-change, gh-ost)
- Cascade behavior across distributed databases

---

## Research Notes

### Source Analysis
`Illuminate\Database\Schema\Blueprint::foreign()` at `src/Illuminate/Database/Schema/Blueprint.php` defines foreign key syntax. `Illuminate\Database\Schema\ForeignKeyDefinition` provides the fluent API (`cascadeOnDelete()`, `nullOnDelete()`, `restrictOnDelete()`).

### Key Insight
Foreign keys are often omitted by developers who believe Eloquent's relationship definitions handle integrity. They do not. A `hasMany` definition is a query helper, not a constraint. Only database-level foreign keys guarantee referential integrity.

### Version-Specific Notes
- Laravel 7: `foreignIdFor()` introduced.
- Laravel 8: `constrained()` auto-detects table/column names from model class.
- Laravel 9: `cascadeOnDelete()`, `nullOnDelete()`, `restrictOnDelete()` fluent methods added.
- Laravel 11: Foreign key definition improvements with support for PostgreSQL deferred constraints.
