# Metadata

Domain: Data & Storage Systems
Subdomain: Schema Design & Migration Engineering
Knowledge Unit: 1.4 Foreign key definition (constrained, onDelete, onUpdate, cascade/restrict/set null)
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Foreign key constraints enforce referential integrity at the database level. Laravel's `constrained()` helper provides a concise, convention-based syntax for defining FKs that reduces boilerplate and eliminates type mismatch bugs. The `onDelete` and `onUpdate` options determine behavior when referenced rows are deleted or updated. Choosing the correct referential action is a data integrity decision with production implications for data loss and operational complexity.

---

# Core Concepts

- **constrained()**: Automatically infers table and column from the relationship name. `$table->foreignId('user_id')->constrained()` references `users.id`.
- **onDelete() / onUpdate()**: Defines referential action. Options: `cascade` (propagate), `restrict` (block), `set null` (nullify FK), `no action` (defer check).
- **foreignId()**: Creates an `unsignedBigInteger` column that matches the type Laravel uses for `id()` by default.
- **Key points**: `constrained()` adds both the FK constraint AND an index on the column. Manually defined FKs via `$table->foreign('col')->references('id')->on('table')` do NOT automatically add an index.

---

# Mental Models

FK constraints are guardrails for data integrity. They prevent orphaned records and ensure that relationships are structurally sound. Think of them as the database's enforcement of your Eloquent relationship definitions — the FK is the physical manifestation of `belongsTo()`.

---

# Internal Mechanics

- MySQL (InnoDB): FK constraints are enforced immediately by default (no deferral support). An index on the referencing column is required — InnoDB creates one if missing. `RESTRICT` is the default and is functionally equivalent to `NO ACTION` in InnoDB.
- PostgreSQL: Supports deferred constraints (`INITIALLY DEFERRED`), allowing validation at transaction commit time. `NO ACTION` differs from `RESTRICT` — it can be deferred.
- When a referenced row is deleted or updated, the database checks all FK constraints pointing to it. If a matching action is found (CASCADE), the operation propagates. If RESTRICT, the operation is blocked and rolled back.

---

# Patterns

**CASCADE for ownership**: When a parent record (user, order) owns its children (posts, order_items), CASCADE on delete ensures children are cleaned up automatically. This prevents orphaned records.

**RESTRICT for financial data**: Never cascade on financial records. A journal entry should never be automatically deleted — require explicit handling. RESTRICT prevents accidental mass deletion.

**SET NULL for optional relationships**: When a parent is deleted but children may remain valid (e.g., removing a sales rep but keeping their customers), SET NULL clears the FK reference.

**constrained() as default**: Always use `constrained()` instead of manual FK definitions. It reduces errors (type mismatch, missing index) and improves readability.

---

# Architectural Decisions

| Action | Use Case | Risk |
|--------|----------|------|
| CASCADE | Owned child records (post belongs to user) | Accidental mass deletion |
| RESTRICT | Financial, audit, compliance data | Blocks legitimate deletes if orphan cleanup is missing |
| SET NULL | Optional relationships, historical preservation | Orphaned nullable FKs accumulate |
| NO ACTION (deferred, PG) | Circular references, complex validation | Performance overhead of deferred checks |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Database-level integrity | FK checks add write overhead | Insert/update/delete performance impact at high throughput
CASCADE convenience | Silent deletion can cascade through multiple levels | Unexpected data loss
RESTRICT safety | Application must handle deletion failures | Complex delete orchestration
Index auto-creation (constrained) | Redundant indexes if already manually defined | Storage waste, minor write overhead

---

# Performance Considerations

- FK constraints add a read check on the parent table for every INSERT/UPDATE to the child table. High-throughput child tables incur a measurable lookup cost.
- CASCADE operations are not free — deleting a parent with 10,000 children generates 10,001 delete operations (all in one transaction).
- Index on the referencing column is required for FK performance — without it, every FK check triggers a full table scan on the child table.

---

# Production Considerations

- FK constraints block TRUNCATE. Use `DELETE` (slower) or drop constraints before TRUNCATE, then re-add.
- Adding a FK to a large production table acquires a lock. In MySQL, it requires `ALGORITHM=INPLACE, LOCK=NONE` for concurrent DML, but metadata locks still apply briefly.
- In PlanetScale/Vitess environments, FK constraints may not be supported. Application-level enforcement replaces DB-level FKs.
- FK constraint names must be explicit before renaming tables — otherwise the constraint name refers to the old table name.

---

# Common Mistakes

**Missing constrained() — manual FK without index**: `$table->unsignedBigInteger('user_id'); $table->foreign('user_id')->references('id')->on('users');` — this adds the constraint but NOT the index, causing full table scans on joins.

**unsigned mismatch**: `foreignId()` creates `unsignedBigInteger`. If the referenced PK uses `increments()` (signed integer), the FK constraint fails.

**Circular cascade**: Two tables with CASCADE in both directions create infinite loops. The database detects and blocks these.

---

# Failure Modes

- **CASCADE escalation**: Deleting a parent cascades through multiple FK chains, deleting far more data than intended. No confirmation prompt.
- **RESTRICT blocked delete**: Application tries to delete a parent that has children, gets a FK violation exception. Unhandled exceptions cause 500 errors.
- **FK check timeout**: In high-throughput inserts, FK checks on the parent table can cause lock waits or timeouts.

---

# Ecosystem Usage

Laravel's relationship definitions (`belongsTo`, `hasMany`) are the ORM-level mirror of FK constraints. Packages like `spatie/laravel-medialibrary` define their own FK constraints on polymorphic relationships. `stancl/tenancy` manages FK constraints when switching tenant database connections.

---

# Related Knowledge Units

2.2 Relationship types | 15.1 Foreign key constraints | 15.12 Foreign key cascade implications | 1.29 FK in PlanetScale/Vitess

---

# Research Notes

The `constrained()` helper is one of Laravel's best schema design improvements — it reduces FK errors from type mismatches and missing indexes. The most common production incident from FK misuse is CASCADE on financial data: deleting an invoice cascades to line items, which cascades to tax records. Always RESTRICT for financial data.
