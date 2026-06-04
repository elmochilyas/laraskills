# Experience Curation: Migration Publishing & Discovery

## Metadata
- **Subdomain:** Package Development & Shared Libraries
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** package-development-shared-libraries/migration-publishing-discovery
- **Maturity:** Mature
- **Related Technologies:** Laravel, Spatie Package Tools, Database Migrations, Schema
- **Difficulty:** Foundation
- **Decomposition:** Atomic

## Overview
Laravel packages that need database tables must register and publish migrations. The pattern involves three paths: (1) automatic loading (`$this->loadMigrationsFrom()`) runs migrations directly from the package's vendor directory, (2) publishing (`$this->publishes()`) copies migrations to the application's `database/migrations/` directory, and (3) Spatie tools' named migrations (`->hasMigration()`) provide selective publishing with timestamp prefixing. The key design consideration is whether the migration should run automatically or require explicit publishing. Automatic migrations are convenient but version-lock the application to the package; published migrations give the consumer control but require manual maintenance.

## Core Concepts
- **loadMigrationsFrom():** Registers a directory where Laravel should look for migration files; migrations are executed during `php artisan migrate` as if they were in the application's migrations directory
- **Migration Publishing:** Copies the package's migration files to `database/migrations/` in the application directory; published migrations can be modified by the consumer
- **Named Migrations:** Spatie tools' `->hasMigration('create_table_name')` registers a specific migration file by name, makes it publishable, and timestamps it on publication
- **Migration Timestamps:** Published migration files receive a timestamp prefix (e.g., `2024_01_01_000001_create_table_name.php`) to control execution order; timestamps change on each publication
- **Automatic vs Published as Tight vs Loose Coupling:** Automatic migrations mean the package controls schema changes tightly; published migrations give the consumer control (can modify columns, rename tables, add indexes)
- **Migration as Package Versioning:** Package MAJOR version changes may include migration changes; consumers must migrate between versions in order, applying each version's migrations

## When To Use
- Packages that create database tables essential for package functionality should use automatic loading with optional publishing
- Packages with feature-specific optional tables should use named migrations with selective publishing
- Packages that need to add columns to existing application tables should provide migrations that consumers can review before running
- Any package with mandatory schema requirements should at minimum provide automatic loading

## When NOT To Use
- Packages that store data in external systems (APIs, file storage, NoSQL) don't need migrations
- Packages that use existing application tables without adding new columns don't need migrations
- Atomic packages that are purely algorithmic or config-only don't need database migrations
- Packages where schema is defined by consumer configuration (e.g., custom fields stored as JSON) don't need package migrations

## Best Practices
- **WHY:** Always provide automatic migration loading for mandatory schema; consumers should not need to remember to publish migrations for the package to function
- **WHY:** Use Spatie tools' named migrations (`->hasMigration()`) for deterministic timestamping; this prevents duplicate migration files on re-publishing
- **WHY:** Always implement both `up()` and `down()` methods; consumers need rollback capability even for package migrations
- **WHY:** Use the package name as a prefix for table names and index names to prevent naming collisions with other packages and the application
- **WHY:** Test migrations in CI with a fresh database (SQLite in-memory) to verify tables are created with correct columns and indexes
- **WHY:** Schema additions (new nullable columns) can be PATCH releases, but schema removals require MAJOR version bumps; follow semantic versioning for schema changes

## Architecture Guidelines
- **Mandatory vs Optional Migrations:** Mandatory migrations (package doesn't function without them) should use automatic loading; optional migrations (feature-specific tables) should be published only when needed
- **Schema Customization Pattern:** Always provide automatic migration loading for out-of-box experience AND publishable migrations for consumers who need to customize the schema
- **Migration Versioning Pattern:** Store migrations in `database/migrations/` with a prefix indicating the package version they belong to (e.g., `v1_0_create_foo_table.php`)
- **Rollback Safety Pattern:** Always implement `down()` methods that drop tables or reverse column changes; include checks to prevent data loss on rollback
- **Index Naming Convention Pattern:** Use the package prefix in index names (`package_name_column_name_index`) to prevent index name collisions
- **Deterministic Timestamping:** Use Spatie's named migration approach which uses a deterministic timestamp derived from the package's registration time so that re-publishing doesn't change the timestamp

## Performance
- Package migrations should be fast; CREATE TABLE operations without indexes on large datasets are acceptable, but data migrations (moving data between tables) should be chunked
- Each index on a package table affects insert/update performance across the application; only add indexes that the package's own queries actually use
- For packages with multiple migrations, each migration is a separate batch entry; 20+ package migrations don't impact runtime performance but slow fresh migration execution
- There is no runtime performance cost for having automatic migrations registered; they only execute during `php artisan migrate`

## Security
- Package migrations run as part of `php artisan migrate --force` in deployment; ensure migrations are idempotent where possible (`CREATE TABLE IF NOT EXISTS`)
- Data migrations that move or transform data must handle failure gracefully (wrap in transaction) and provide a rollback path
- If a package migration depends on application tables, document the dependency order and test that migrations run correctly in isolation
- For high-traffic applications, package migrations should be compatible with deployment strategies that use application-level locking or maintenance mode
- Soft deletes provide safety against accidental data loss but add complexity to queries and index size

## Common Mistakes

### Not providing automatic migration loading
- **Description:** Only providing publishable migrations without automatic loading via `loadMigrationsFrom()`
- **Consequence:** Consumers must manually publish and run migrations; easy to forget, leaving the package database tables missing
- **Better Approach:** Always call `loadMigrationsFrom()` in the service provider; make migrations publishable for customization as a secondary option

### Using loadMigrationsFrom in boot() instead of register()
- **Description:** Registering migration loading in the `boot()` method instead of `register()`
- **Consequence:** Migrations registered too late may not be discovered during the migration command; inconsistent behavior
- **Better Approach:** Call `loadMigrationsFrom()` in `register()` or use Spatie tools which handle the timing correctly

### Forgetting to implement down()
- **Description:** Package migrations without `down()` methods
- **Consequence:** Rollback of the package installation fails; consumers cannot revert to a previous state
- **Better Approach:** Always implement both `up()` and `down()` for every migration; `down()` should drop tables or reverse column changes

### Schema changes in patch versions
- **Description:** Altering tables in a PATCH release (e.g., 1.0.0 to 1.0.1) by removing columns or changing column types
- **Consequence:** Breaking change for consumers who upgrade without expecting schema modifications; migration may fail on existing data
- **Better Approach:** Schema additions (new nullable columns) can be PATCH; removals and non-nullable additions require MAJOR

### Not testing migrations
- **Description:** Package migrations are never tested in CI
- **Consequence:** Schema errors (wrong column types, missing indexes, foreign key issues) are only discovered when consumers run migrations
- **Better Approach:** Test migrations in CI with a fresh SQLite in-memory database, verifying tables are created with correct columns and indexes

## Anti-Patterns
- **Only publishable, no automatic loading:** Requiring consumers to publish and run migrations manually; this creates setup friction and is error-prone
- **Modifying published migrations in package updates:** Changing the source migration file that's already been published elsewhere; consumers get confused about which version to use
- **No down() method:** Skipping rollback capability "because the package is always installed once"; this prevents clean rollbacks and testing workflows
- **One giant migration file:** Creating a single migration that creates all package tables at once; consumers cannot selectively apply schema changes
- **Foreign keys across packages:** Creating foreign key constraints from package tables to application tables or other package tables; this creates tight coupling and migration ordering issues

## Examples
- **Laravel Sanctum:** Uses automatic migration loading (`loadMigrationsFrom()`) for the personal access tokens table; migration is simple, single-file
- **Spatie/laravel-permission:** Uses Spatie tools' `hasMigration()` for named, publishable migrations; creates permissions, roles, and pivot tables
- **Spatie/laravel-medialibrary:** Complex migration pattern with multiple tables, foreign keys, and polymorphic relationships; demonstrates index naming conventions

## Related Topics
- config-file-merging-publishing (migrations follow similar merge/publish pattern as config)
- spatie-laravel-package-tools (provides `hasMigration()` for named migration registration)
- package-service-provider-patterns (migration registration happens in the service provider)
- package-testing-orchestra-testbench (test migrations with Orchestra Testbench)
- database-schema-design (broader context for schema decisions in package tables)

## AI Agent Notes
- The automatic vs published migration decision is the most important design choice for package schema; automatic is preferred for mandatory tables
- Spatie's deterministic timestamping solved a major pain point where each `vendor:publish` created a new migration file with a different timestamp
- When debugging migration issues, check for: timestamp collisions, missing `loadMigrationsFrom()`, and consumers who modified published migrations
- The `down()` method is frequently forgotten but critical for rollback support
- For packages with data migrations, always recommend chunking and transaction wrapping

## Verification
- [ ] `loadMigrationsFrom()` is called in the service provider's `register()` method
- [ ] Migrations are also publishable for consumers who need schema customization
- [ ] Every migration has both `up()` and `down()` methods
- [ ] Table names and index names are prefixed with the package name
- [ ] Migration timestamps are deterministic (Spatie pattern) or stable
- [ ] Schema changes follow semantic versioning (additions = PATCH, removals = MAJOR)
- [ ] Migrations are tested in CI with a fresh SQLite in-memory database
- [ ] Data migrations (if any) are wrapped in transactions and chunked
- [ ] Foreign key constraints don't cross package boundaries unnecessarily
- [ ] Deployment documentation includes migration steps for the package
