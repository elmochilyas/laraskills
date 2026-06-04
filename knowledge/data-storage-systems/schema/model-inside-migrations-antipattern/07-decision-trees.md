# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Schema Design & Migration Engineering
**Knowledge Unit:** 1-23 Model Inside Migrations Antipattern
**Generated:** 2026-06-03

---

# Decision Inventory

* Eloquent model vs DB::table vs raw SQL in migrations
* Model evolution vs migration immutability conflict
* Fresh install and rollback compatibility

---

# Architecture-Level Decision Trees

---

## Data Access Method in Migrations

---

## Decision Context

Choosing the safe data access method for migrations that avoids the schema-model mismatch that breaks fresh installs and rollbacks.

---

## Decision Criteria

* performance: DB::table is marginally faster than Eloquent (no hydration)
* architectural: Eloquent models evolve; migrations are immutable
* maintainability: DB::table references raw table/column names that never change
* security: no impact

---

## Decision Tree

Need to access data in a migration?
↓
Is the operation a simple INSERT/UPDATE/DELETE by raw column values?
YES → Use DB::table('table_name')
    → References table and column names directly
    → Never affected by model refactoring
NO → Is the operation a complex, database-specific transformation?
    YES → Use raw SQL: DB::statement('UPDATE ...')
        → Most stable across schema versions
    NO → Is the operation reading data for transformation?
        → Use DB::table('table_name')->select(...) ...
↓
Would using the Eloquent model be convenient?
→ RESIST THE URGE — models change after migrations are written
→ A model's global scope, accessor, or renamed column WILL break:
  - Fresh installs (migrate:fresh)
  - Rollback (migrate:rollback)
  - CI pipelines running migrations

---

## Rationale

Models are refactored freely as the application evolves. Migrations are immutable once deployed. Using a model in a migration creates a coupling between the immutable migration and the evolving model. When the model changes (renamed column, removed scope, new trait), the migration breaks. DB::table avoids this entirely.

---

## Recommended Default

**Default:** Always use DB::table() in migrations, never Eloquent models
**Reason:** DB::table references raw table/column names that remain stable. Eloquent model references break when models are refactored.

---

## Risks Of Wrong Choice

* Using model with global scopes: migration query silently filters rows incorrectly
* Using model with accessors: renamed attribute breaks migration on fresh install
* Class not found: model moved to different namespace, migration crashes
* Trait removed: model method referenced by migration no longer exists

---

## Related Rules

* Never use Eloquent models inside migration files
* Use DB::table() or raw SQL for data operations in migrations

---

## Related Skills

* Use DB::table instead of Eloquent models in migrations
