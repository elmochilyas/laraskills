# Skill: Create Anonymous Migration Classes with up/down Methods

## Purpose

Generate migration files following Laravel conventions with anonymous class syntax, properly structured `up()` and `down()` methods, and explicit `$connection` property when needed, ensuring deterministic ordering via timestamp prefixes and safe rollback capability.

## When To Use

- Creating new database tables
- Adding or modifying database columns
- Adding indexes and foreign keys
- Any schema change that must be version-controlled

## When NOT To Use

- Runtime schema changes that don't need version tracking
- Ephemeral environments where schema is managed outside Laravel

## Prerequisites

- Laravel 9+ (for anonymous class support)
- Database connection configured
- Understanding of the target database engine

## Inputs

- Migration purpose (create table, add column, modify column)
- Table name and schema details
- Connection name (for multi-DB setups)
- Conditional execution logic (if needed)

## Workflow

1. Run `php artisan make:migration create_posts_table` to generate the file
2. Open the generated file and replace the class with `return new class extends Migration`
3. Define `$connection` if using a non-default database connection
4. Implement `up()` with `Schema::create()` or `Schema::table()` using the Blueprint
5. Implement `down()` with the exact inverse — `Schema::dropIfExists()` or `Schema::table()` with `dropColumn()`
6. Add `shouldRun()` method if the migration should only apply conditionally
7. Verify the filename timestamp ensures correct ordering relative to dependencies

## Validation Checklist

- [ ] Migration uses anonymous class syntax (`return new class extends Migration`)
- [ ] `$connection` explicitly set for non-default database connections
- [ ] `up()` method contains the forward schema change
- [ ] `down()` method contains the exact inverse operation
- [ ] Filename timestamp sorts correctly relative to dependent migrations
- [ ] `shouldRun()` returns appropriate boolean for conditional migrations
- [ ] Migration runs successfully in local environment

## Common Failures

### Missing down() method
A migration without `down()` prevents rollback of the entire batch. Always implement `down()` even if it's just `Schema::dropIfExists()`.

### Editing deployed migrations
Editing a migration file after it has run is silently ignored. The `migrations` table tracks the filename — edits to a deployed migration never apply. Always create a new migration.

## Decision Points

### Anonymous vs Named Classes?
Use anonymous classes (`return new class`) for all new Laravel 9+ projects to prevent class name collisions in team environments.

### Single Connection vs $connection Override?
Default connection for simple apps. Set `$connection` explicitly when the migration targets a specific database in a multi-DB setup.

## Performance Considerations

Each migration runs in its own transaction where supported. DDL on large tables may exceed transaction timeouts. For tables with millions of rows, consider zero-downtime patterns instead of direct ALTER TABLE.

## Security Considerations

Schema definitions in migrations define column constraints, default values, and foreign keys that enforce data integrity at the database level. Review migrations for correct constraint types.

## Related Rules

- Never edit deployed migrations
- Always implement a complete down() method
- Use anonymous classes for Laravel 9+ projects
- Separate schema changes from data changes

## Related Skills

- Define Blueprint Column Types
- Configure Migration Ordering and Naming
- Manage Multi-Database Connections

## Success Criteria

- Migration files are immutable after deployment
- `up()` and `down()` are exact inverses of each other
- Anonymous class syntax prevents class collisions
- Filename timestamps enforce correct ordering
- Conditional execution via `shouldRun()` works as expected
- Multi-connection deployments target the correct databases
