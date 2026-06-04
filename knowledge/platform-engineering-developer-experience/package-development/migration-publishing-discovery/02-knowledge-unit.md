# Knowledge Unit: Migration Publishing & Discovery

## Metadata
- **Subdomain:** Package Development & Shared Libraries
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** package-development-shared-libraries/migration-publishing-discovery
- **Maturity:** Mature
- **Related Technologies:** Laravel, Spatie Package Tools, Database Migrations, Schema

## Executive Summary

Laravel packages that need database tables must register and publish migrations. The pattern involves three paths: (1) automatic loading (`$this->loadMigrationsFrom()`) runs migrations directly from the package's vendor directory, (2) publishing (`$this->publishes()`) copies migrations to the application's `database/migrations/` directory, and (3) Spatie tools' named migrations (`->hasMigration()`) provide selective publishing with timestamp prefixing. The key design consideration is whether the migration should run automatically or require explicit publishing. Automatic migrations are convenient but version-lock the application to the package; published migrations give the consumer control but require manual maintenance.

## Core Concepts

- **loadMigrationsFrom():** Registers a directory where Laravel should look for migration files; migrations are executed during `php artisan migrate` as if they were in the application's migrations directory
- **Migration Publishing:** Copies the package's migration files to `database/migrations/` in the application directory; published migrations can be modified by the consumer
- **Named Migrations:** Spatie tools' `->hasMigration('create_table_name')` registers a specific migration file by name, makes it publishable, and timestamps it on publication
- **Migration Timestamps:** Published migration files receive a timestamp prefix (e.g., `2024_01_01_000001_create_table_name.php`) to control execution order; timestamps change on each publication

## Mental Models

- **Automatic vs Published as Tight vs Loose Coupling:** Automatic migrations mean the package controls schema changes tightly; published migrations give the consumer control (can modify columns, rename tables, add indexes)
- **Migration as Package Versioning:** Package MAJOR version changes may include migration changes; consumers must migrate between versions in order, applying each version's migrations
- **Named Migration as a Contract:** A named migration (e.g., `create_settings_table`) is a contract that the package provides a migration with that specific purpose; the actual filename is irrelevant due to timestamping

## Internal Mechanics

1. **Automatic Migration Registration:** `$this->loadMigrationsFrom(__DIR__.'/../database/migrations')` registers the package migration directory; Laravel includes these migrations in the migration file discovery process during `php artisan migrate`.
2. **Migration Execution Tracking:** The `migrations` table tracks which migrations have been run (by filename); package migrations are tracked alongside application migrations, with filenames including the package path prefix in the batch.
3. **Spatie Named Migration Publishing:** When `vendor:publish --tag=package-name-migrations` is run, Spatie tools copies the specified migration file, adds a timestamp based on the package's registered date (not current time), and stores the file in the application's migrations directory.
4. **Publishing Timestamp Stability:** Spatie tools uses a deterministic timestamp derived from the package's registration time so that re-publishing doesn't change the timestamp; this prevents duplicate migration execution.

## Patterns

- **Mandatory vs Optional Migrations:** Mandatory migrations (package doesn't function without them) should use automatic loading; optional migrations (feature-specific tables) should be published only when needed.
- **Schema Customization Pattern:** Always provide automatic migration loading for out-of-box experience AND publishable migrations for consumers who need to customize the schema.
- **Migration Versioning Pattern:** Store migrations in `database/migrations/` with a prefix indicating the package version they belong to (e.g., `v1_0_create_foo_table.php`); this helps consumers understand which version introduced each migration.
- **Rollback Safety Pattern:** Always implement `down()` methods that drop tables or reverse column changes; consumers need rollback capability even for package migrations. Include checks to prevent data loss on rollback.
- **Index Naming Convention Pattern:** Use the package prefix in index names (`package_name_column_name_index`) to prevent index name collisions across packages and the application's own tables.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Migration mode | Automatic loading vs published only | Automatic loading with optional publishing for customization |
| Publishing scope | All migrations vs named individual | Named migrations for selective publishing (Spatie pattern) |
| Timestamp strategy | Deterministic (Spatie) vs current time | Deterministic for stability; current time for one-off publications |
| Schema change handling | New migration vs modify existing | New migration for additive changes; modify for destructive changes with clear documentation |

## Tradeoffs

- **Automatic Loading vs Consumer Control:** Automatic migrations are zero-touch for consumers but version-lock the application to the package's schema. Published migrations give consumers control (rename tables, add columns) but require manual management of migration files.
- **Single Migration per Table vs Multiple:** A single migration (create table) is clean for initial installs but requires consumers to create additional migrations for schema changes. Multiple incremental migrations mirror Laravel's own convention but clutter the migrations directory.
- **Soft Deletes vs Hard Deletes in Package Tables:** Soft deletes provide safety against accidental data loss but add complexity to queries and index size. Choose based on whether the data is recoverable from other sources.

## Performance Considerations

- **Migration Execution Time:** Package migrations should be fast; CREATE TABLE operations without indexes on large datasets are acceptable, but data migrations (moving data between tables) should be chunked.
- **Index Impact:** Each index on a package table affects insert/update performance across the application. Only add indexes that the package's own queries actually use.
- **Migration Batch Size:** For packages with multiple migrations, each migration is a separate batch entry; 20+ package migrations don't impact runtime performance but slow fresh migration execution.

## Production Considerations

- **Deployment Safety:** Package migrations run as part of `php artisan migrate --force` in deployment. Ensure package migrations are idempotent where possible (e.g., `CREATE TABLE IF NOT EXISTS`).
- **Data Migration Safety:** If a package migration moves or transforms data, it must handle failure gracefully (wrap in transaction) and provide a rollback path.
- **Migration Dependencies:** If a package migration depends on application tables or other package tables, document the dependency order and test that migrations run correctly in isolation.
- **Locking Considerations:** For high-traffic applications, package migrations should be compatible with deployment strategies that use application-level locking or maintenance mode.

## Common Mistakes

- **Not providing automatic migration loading:** Consumers must manually publish and run migrations, creating a setup step that can be forgotten; always load migrations automatically
- **Using loadMigrationsFrom in boot() instead of register():** Migrations registered too late may not be discovered during the migration command; register in the provider's `register()` method
- **Forgetting to implement down():** Package migrations without `down()` methods prevent rollback of the package; always implement both `up()` and `down()`
- **Schema changes in patch versions:** Altering tables in a PATCH release is a breaking change if the schema change isn't backward-compatible; schema additions (new nullable columns) can be PATCH, but removals require MAJOR
- **Not testing migrations:** Package migrations should be tested in CI with a fresh database (SQLite in-memory), verifying tables are created with correct columns and indexes

## Failure Modes

- **Migration Collision:** Two packages publish migrations with the same timestamp, causing conflicts. Mitigate: use Spatie's deterministic timestamping and unique package prefixes for migration filenames.
- **Migration Not Found After Package Update:** Package update includes a new automatic migration, but the consumer's previous publication of the migration (with modifications) conflicts. Mitigate: use automatic loading for mandatory schema; consumers should not modify package migrations.
- **Migration Rollback Deletes Data:** A consumer runs `php artisan migrate:rollback` which rolls back a package migration, dropping a table with data. Mitigate: implement safety checks in `down()` and document rollback behavior.
- **Migration Timeout:** Large data migrations (processing millions of rows) time out during deployment. Mitigate: chunk data processing and use batch migration strategies for large datasets.

## Ecosystem Usage

- **Laravel Core:** Sanctum, Horizon, Telescope, Pulse, Socialite all ship with migrations using automatic loading + optional publishing
- **Spatie Packages:** All packages with database tables use Spatie tools' `hasMigration()` for named, publishable migrations
- **Laravel Permission Package:** Example of complex migrations with pivot tables, foreign keys, and multi-tenant support
- **Laravel Auditing:** Package that tracks model changes; demonstrates migration patterns for large data tables with indexes

## Related Knowledge Units

- config-file-merging-publishing
- spatie-laravel-package-tools
- package-service-provider-patterns
- package-testing-orchestra-testbench

## Research Notes

- The deterministic timestamp approach (Spatie pattern) solved a long-standing pain point where each `vendor:publish` created a new migration file with a different timestamp
- Laravel 11 improved migration handling with cleaner batch management for package migrations
- Most package migration issues stem from consumers modifying published migration files and then encountering conflicts on package updates
- The industry trend is toward automatic loading with the option to publish; the days of "post-install commands required" are largely over in the Laravel package ecosystem
