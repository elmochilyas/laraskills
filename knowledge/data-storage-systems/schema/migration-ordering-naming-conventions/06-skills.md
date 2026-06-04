# Skill: Name and Order Migration Files for Dependency Resolution

## Purpose

Apply consistent timestamp prefixes and verb-based naming conventions to migration files so that FK-dependent tables are created before referencing tables, migration intent is clear from the filename, and rollback operations don't fail due to ordering issues.

## When To Use

- Creating migration files with `make:migration`
- Reordering migrations in a shared team environment
- Adding FK constraints that depend on prior migrations

## When NOT To Use

- Solo projects with fewer than 5 migrations
- Projects using `schema:dump` exclusively

## Prerequisites

- Understanding of lexicographic filename sorting in Laravel
- Knowledge of FK dependency ordering rules

## Inputs

- Migration purpose (create, alter, add, drop, change)
- Target table or column name
- FK dependency ordering requirements

## Workflow

1. Run `php artisan make:migration create_authors_table` to generate the file with a timestamp
2. Run `php artisan make:migration create_books_table` — verify the timestamp sorts after create_authors_table if books references authors
3. If ordering is incorrect, manually prepend an earlier timestamp to the dependent migration's filename
4. Follow verb prefix conventions: `create_` for new tables, `add_` for new columns, `drop_` for removals, `change_` for modifications
5. Verify ordering with `php artisan migrate:status`
6. Ensure all FK-referenced tables exist in migrations with earlier timestamps

## Validation Checklist

- [ ] Filename uses `YYYY_MM_DD_HHmmss` timestamp prefix
- [ ] Descriptive name uses verb prefix convention
- [ ] FK-referenced tables have earlier timestamps
- [ ] No duplicate timestamps across migration files
- [ ] `migrate:status` shows expected execution order

## Common Failures

### FK constraint failure
Migration references a table that doesn't exist yet. Error: `General error: 1215 Cannot add foreign key constraint`. Fix by adjusting timestamps so the referenced table's migration runs first.

### Duplicate timestamps
Two developers create migrations in the same second. Ordering becomes unpredictable. Run `migrate:status` after pulling changes to verify.

## Decision Points

### Verb prefix naming vs minimal naming?
Use verb prefixes for all team projects — `create_table`, `add_column_to_table`, `change_column_on_table`. This communicates intent without opening the file.

### Manual timestamp adjustment?
Only when FK ordering requires it or when inserting a migration between two existing ones. Most migrations use default generated timestamps.

## Performance Considerations

Not applicable directly — naming and ordering don't affect query performance. Incorrect ordering causing FK failures in CI wastes development time.

## Security Considerations

Migration filenames should not contain sensitive information (PII, secrets, internal architecture details visible in version control).

## Related Rules

- Reference tables before referencing tables via FK
- Use verb prefix naming conventions
- Check ordering with migrate:status

## Related Skills

- Create Anonymous Migration Classes
- Define Foreign Key Constraints
- Manage Migration Batch Tracking

## Success Criteria

- All FK-referenced tables have migrations with earlier timestamps
- Filenames communicate migration intent through verb prefixes
- No timestamp collisions in the migration directory
- `migrate:status` shows the expected execution order
