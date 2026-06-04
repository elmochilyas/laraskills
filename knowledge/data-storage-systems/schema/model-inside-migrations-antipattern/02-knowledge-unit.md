# Metadata

Domain: Data & Storage Systems
Subdomain: Schema Design & Migration Engineering
Knowledge Unit: 1.23 Model usage inside migrations anti-pattern (use DB::table or raw SQL instead)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Using Eloquent models inside migrations is an anti-pattern because models evolve independently of the schema. A migration running `User::where('status', 'active')->update(...)` references the `User` model as it exists today — but the migration was written for the schema as it existed at a past point. Model changes (renamed columns, new scopes, removed attributes) can break old migrations when run on a fresh database or during rollback.

---

# Core Concepts

- **Schema-model mismatch**: Models change (columns renamed, scopes added, casts changed) after the migration was written. When the migration runs on a fresh database, it uses the current model's state, which may not match the migration's expectations.
- **CI and fresh installs**: `migrate:fresh` in CI re-runs all migrations. If any migration uses a model that references a column that was added by a later migration, it fails.
- **Rollback failures**: A model's `boot()` method may register global scopes that reference columns that no longer exist after rollback.
- **Alternative**: Use `DB::table()` or raw SQL for data transformations in migrations.

---

# Mental Models

Migrations describe schema states. Models describe today's schema. Never mix them. A migration written in January should still run correctly in December, regardless of what model changes have occurred.

---

# Internal Mechanics

When a migration uses `App\Models\User::where(...)`, Laravel:
1. Boots the model class (including all traits, global scopes, boot methods).
2. References the model's current table name, column list, casts, relationships.
3. If any of these reference columns or tables that don't exist yet (because the migration adding them hasn't run), the query fails.

---

# Patterns

**Use DB::table for data access in migrations**: `DB::table('users')->where('status', 'active')->update(...)` is safe because it references the raw table, not the model.

**Use raw SQL for complex transformations**: `DB::statement('UPDATE users SET ...')` when the operation requires database-specific syntax.

---

# Architectural Decisions

| Method | When | When Not |
|--------|------|----------|
| DB::table() | Any data access in migrations | Maintaining Eloquent relationship magic |
| Raw SQL | Database-specific transformations | Cross-database compatibility needed |
| Eloquent model | NEVER in migrations | — |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
DB::table is stable across model changes | No model scopes, accessors, casts | Must handle data transformations explicitly
Raw SQL is explicit | Database-specific syntax | Portability concern per driver

---

# Performance Considerations

DB::table() is slightly faster than Eloquent queries (no hydration overhead), but the difference is negligible in migration context.

---

# Production Considerations

- **Code review rule**: Any migration that imports an Eloquent model class should be rejected. Enforce via automated checks.
- **namespace imports**: `use App\Models\User;` at the top of a migration file is a red flag. It indicates the migration is using the model.
- **Data migration in separate files**: Any data transformation should be in its own dedicated migration or a queued job, not mixed with schema changes.

---

# Common Mistakes

**Using a model that has global scopes**: The model's `boot()` registers a `tenant_id` global scope. The migration doesn't set tenant context. The query filters by `tenant_id IS NULL` and affects no rows.

**Using a model with accessors**: `User::first()->full_name` in a migration references an accessor that concatenates `first_name` and `last_name`. If `first_name` was renamed to `given_name` in a later migration, the migration fails.

---

# Failure Modes

- **Class not found**: Model class is moved to a different namespace in a later refactor. The migration references the old namespace. Fatal error.
- **Trait removed**: Model's `SoftDeletes` trait is removed in a later version. The migration calls `User::withTrashed()` which no longer exists.
- **Column missing**: The migration uses `User::where('type', 'admin')` but the `type` column was renamed to `role` in a later migration. On fresh install, the query fails because `type` column doesn't exist yet.

---

# Related Knowledge Units

1.24 Schema and data migration separation | 1.19 Data backfill strategies

---

# Ecosystem Usage

The model-in-migrations anti-pattern is widely discussed in the Laravel community. Taylor Otwell explicitly advises against it in the Laravel documentation. Major Laravel packages like Laravel Shift's automated upgrade tools flag this pattern during migration analysis. CI platforms like Laravel Forge and Envoyer can include pre-deployment checks that scan migration files for Eloquent model usage. The pattern is particularly dangerous in teams using `migrate:fresh` in CI pipelines, as it silently breaks when model namespaces change or columns are renamed.

# Research Notes

This is one of the most frequently violated Laravel migration best practices. The violation often goes undetected because most team members run `migrate` on existing databases (where all migrations are already applied, so the problematic migration is skipped). CI environments running `migrate:fresh` reveal the issue.
