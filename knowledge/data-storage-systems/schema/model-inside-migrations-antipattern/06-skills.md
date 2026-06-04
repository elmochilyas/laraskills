# Skill: Use DB::table Instead of Eloquent Models in Migrations

## Purpose

Avoid referencing Eloquent models inside migration files by using `DB::table()` or raw SQL for data transformations, ensuring migrations remain immune to future model changes (renamed columns, new scopes, removed traits) and run correctly on fresh database installs.

## When To Use

- Any data access or transformation inside a migration
- Referencing database rows during schema changes
- CI/CD pipelines running `migrate:fresh`

## When NOT To Use

- Application code outside migrations (use Eloquent normally)
- Data access in seeders (use Eloquent or factories)

## Prerequisites

- Understanding that models change independently of the schema
- Knowledge of the raw table structure at the time of the migration

## Inputs

- Table name
- Column names and types (as they exist at migration time)
- Data transformation logic

## Workflow

1. Instead of `User::where('status', 'active')->update(['type' => 'customer'])`, use `DB::table('users')->where('status', 'active')->update(['type' => 'customer'])`
2. For complex transformations, use `DB::statement('UPDATE users SET ...')` with raw SQL
3. Never call Eloquent model methods (scopes, accessors, mutators) within migration files
4. If a data transformation requires application logic, dispatch a queue job from the migration and implement the logic outside the migration

## Validation Checklist

- [ ] No Eloquent model references in any migration file
- [ ] All data access uses `DB::table()` or raw SQL
- [ ] `migrate:fresh` runs successfully without model-related errors
- [ ] `migrate:rollback` works after model refactors

## Common Failures

### Model with global scopes
A model boots a `tenant_id` global scope. The migration doesn't set tenant context. The query filters incorrectly and affects no rows. Use `DB::table()` to bypass all scopes.

### Model with accessors
A migration references an accessor that concatenates two columns. If one column is renamed later, the migration fails on fresh install. Use raw values with `DB::table()`.

## Decision Points

### DB::table vs raw SQL?
`DB::table()` for most operations — it provides query builder convenience without model overhead. Raw SQL for database-specific transformations (`UPDATE ... FROM ...` joins in PostgreSQL).

### Inline data migration vs queued job?
Inline `DB::table()` updates for small data changes (< 10K rows). Dispatch a queue job for large data migrations that may take minutes or hours.

## Performance Considerations

`DB::table()` is slightly faster than Eloquent (no hydration overhead). The difference is negligible in migration context. For large data migrations, use chunked processing regardless of the query method.

## Security Considerations

Migrations using `DB::table()` bypass Eloquent attribute casting and model-level security. Ensure raw values are properly typed and escaped. Use parameter binding for user-influenced data.

## Related Rules

- Never reference Eloquent models in migrations
- Use DB::table for data access
- Separate schema changes from data changes

## Related Skills

- Separate Schema and Data Migrations
- Execute Data Backfill Strategies
- Use Raw Expressions Safely

## Success Criteria

- All migrations use `DB::table()` or raw SQL for data access
- Fresh database installs succeed regardless of current model state
- Model refactors never break migration execution
- Model scopes and accessors don't affect migration behavior
