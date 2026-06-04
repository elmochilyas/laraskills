# Skill: Order and Name Migration Files for Deterministic Execution

## Purpose

Apply timestamp-based lexicographic ordering and verb-prefix naming conventions to migration files, ensuring FK dependencies are resolved (referenced tables created before referencing tables), execution order is deterministic across environments, and migration intent is visible from the filename.

## When To Use

- Creating new migration files with `make:migration`
- Ensuring FK ordering in multi-developer environments
- Managing migration files in team projects

## When NOT To Use

- Solo projects with < 10 migrations
- Projects using `schema:dump` with infrequent new migrations

## Prerequisites

- Understanding of lexicographic filename sorting
- Knowledge of FK dependency ordering

## Inputs

- Migration purpose and target
- FK dependency relationships between tables
- Existing migration filenames

## Workflow

1. Run `php artisan make:migration create_users_table` — generates a file with a `YYYY_MM_DD_HHmmss` prefix
2. Run `php artisan make:migration create_posts_table` — verify the timestamp sorts after create_users_table if posts references users
3. If FK ordering is violated, manually prepend a slightly earlier timestamp to the dependent migration's filename
4. Use verb prefixes: `create_` for tables, `add_xxx_to_yyy` for new columns, `change_xxx_on_yyy` for modifications
5. Run `php artisan migrate:status` to verify the expected execution order before deployment

## Validation Checklist

- [ ] Timestamp prefix determines execution order
- [ ] FK-referenced tables have earlier timestamps than referencing tables
- [ ] Verb prefix conventions are followed for naming
- [ ] No duplicate timestamps exist in the migration directory
- [ ] `migrate:status` shows correct order

## Common Failures

### FK dependency failure
Migration references a table that doesn't exist yet. Error: `General error: 1215 Cannot add foreign key constraint`. Adjust timestamps so the referenced table's migration runs first.

### Same-second timestamp collision
Two developers create migrations at the same second. Ordering between them is unpredictable. Use `migrate:status` to verify order and adjust one timestamp if needed.

## Decision Points

### Verb prefix vs minimal naming?
Verb prefix for all team projects — `create_table`, `add_column_to_table`, `change_column_on_table`. Minimal for very small solo projects.

### Gap strategy in timestamps?
Leave gaps (e.g., 5-minute intervals) between generated timestamps to allow inserting intermediate migrations later without manual reordering.

## Performance Considerations

Not applicable directly — naming and ordering don't affect query performance. Incorrect ordering causing FK failures in CI wastes development time.

## Security Considerations

Migration filenames in version control reveal table and column names. Ensure no sensitive column names (passwords, secrets) appear in migration filenames.

## Related Rules

- Reference tables before referencing tables via FK
- Use verb prefix naming conventions
- Check migrate:status before deployment

## Related Skills

- Create Anonymous Migration Classes
- Define Foreign Key Constraints
- Manage Migration Batch Tracking

## Success Criteria

- All FK-referenced tables have migrations with earlier timestamps
- Filenames clearly communicate migration intent
- No timestamp collisions in the migration directory
- `migrate:status` shows the expected execution order
