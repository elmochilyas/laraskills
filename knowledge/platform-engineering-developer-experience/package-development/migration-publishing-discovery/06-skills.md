# Skills: Migration Publishing & Discovery

## Metadata
- **Domain:** Platform Engineering & Developer Experience
- **Subdomain:** Package Development & Shared Libraries
- **KU:** Migration Publishing & Discovery
- **Phase:** 6 (Skill Extraction)

---

## Skill 1: Register and Publish Package Migrations with Automatic Loading

### Purpose
Configure package migrations so they run automatically via `loadMigrationsFrom()` but remain publishable for consumers who need schema customization.

### When To Use
Any Laravel package that creates database tables essential for package functionality. Packages with mandatory schema requirements.

### When NOT To Use
Packages that store data in external systems (APIs, file storage); packages using existing application tables without adding new columns; purely algorithmic or config-only packages.

### Prerequisites
- Package service provider registered
- Migration files created in `database/migrations/` within the package
- Spatie Package Tools (recommended) or manual registration

### Inputs
- List of migration file paths within the package
- Table names and index naming convention (package prefix)
- Decision: mandatory (auto-load) vs optional (publish-only)

### Workflow
1. Store migration files in `database/migrations/` within the package directory
2. In service provider `register()` method: call `$this->loadMigrationsFrom(__DIR__ . '/../database/migrations')`
3. If using Spatie tools: register named migrations with `->hasMigration('create_foo_table')` for deterministic timestamps
4. Make migrations publishable: `$this->publishes([...], 'package-name-migrations')` or Spatie's `->hasMigration()` handles this
5. Implement both `up()` and `down()` in every migration file
6. Prefix table names with package name: `package_name_table_name`
7. Prefix index names: `package_name_column_name_index`
8. Test migrations in CI with fresh SQLite in-memory database
9. Document deployment migration steps in README

### Validation Checklist
- [ ] `loadMigrationsFrom()` called in `register()` method (not `boot()`)
- [ ] Migrations also publishable for schema customization
- [ ] Every migration has both `up()` and `down()`
- [ ] Table names and index names prefixed with package name
- [ ] Migration timestamps are deterministic (Spatie pattern)
- [ ] Schema changes follow SemVer: additions = PATCH, removals = MAJOR
- [ ] Migrations tested in CI with fresh SQLite in-memory database
- [ ] Data migrations (if any) wrapped in transactions and chunked
- [ ] Foreign key constraints don't cross package boundaries unnecessarily
- [ ] Deployment documentation includes migration steps

### Common Failures
| Failure | Symptom | Solution |
|---------|---------|----------|
| No auto-loading | Consumer forgets to publish; package tables missing | Add `loadMigrationsFrom()` for mandatory tables |
| `loadMigrationsFrom()` in `boot()` | Migrations not discovered during migrate command | Move to `register()` or use Spatie tools |
| Missing `down()` | Rollback fails; cannot revert package state | Always implement both `up()` and `down()` |
| Schema changes in PATCH | Consumer upgrade breaks unexpectedly | Follow SemVer: additions PATCH, removals MAJOR |
| Untested migrations | Schema errors discovered by consumers | Test migrations in CI with SQLite in-memory |

### Decision Points
- Mandatory tables: always auto-load with `loadMigrationsFrom()`
- Optional feature tables: use Spatie's `->hasMigration()` for selective publishing
- Data migrations: wrap in transactions and chunk for large datasets
- Foreign keys: avoid cross-package foreign key constraints

### Performance Considerations
- Package migrations only run during `php artisan migrate`, no runtime cost
- Indexes on package tables affect insert/update performance across the app
- Data migrations should be chunked for large datasets
- 20+ package migrations don't impact runtime but slow fresh migration execution

### Security Considerations
- Package migrations run as part of `php artisan migrate --force` in deployment
- Ensure migrations are idempotent where possible (`CREATE TABLE IF NOT EXISTS`)
- Data migrations handling sensitive data must be wrapped in transactions
- Document dependency order if migrations depend on application tables

### Related Rules
- MIG-RULE-001 (Automatic loading for mandatory schema)
- MIG-RULE-002 (Always implement down())
- MIG-RULE-003 (Package-prefixed table/index names)
- MIG-RULE-004 (Schema versioning)
- MIG-RULE-005 (Mandatory vs optional)
- MIG-RULE-006 (Deterministic timestamping)
- MIG-RULE-008 (Test in CI)
- MIG-RULE-009 (Chunked data migrations)

### Related Skills
- Implement Install Commands for Packages
- Configure Config File Merging and Publishing
- Register Service Provider with Spatie Package Tools
- Test Package Migrations with Orchestra Testbench

### Success Criteria
- Package installs and migrations run automatically without manual steps
- Consumers can publish and customize migrations when needed
- Migration tests pass in CI with fresh database
- Re-publishing migrations produces no duplicate timestamped files
- Rollback correctly reverses all package schema changes
