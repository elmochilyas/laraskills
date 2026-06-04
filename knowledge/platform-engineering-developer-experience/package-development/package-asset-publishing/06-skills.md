# Skill: Publish Frontend Assets from Laravel Packages

## Purpose
Set up tagged asset publishing for Laravel packages, shipping pre-built (compiled, minified) CSS/JS assets to the consumer's `public/` directory with versioned URLs for cache busting.

## When To Use
- Package has CSS stylesheets that need direct web server serving
- Package ships JavaScript for UI components or interactive elements
- Package includes images, icons, fonts, or other static frontend resources

## When NOT To Use
- API-only packages with no frontend resources
- Packages whose frontend is loaded entirely via CDN
- Packages using Inertia or Livewire exclusively without custom CSS/JS

## Prerequisites
- Package service provider
- Compiled assets in `resources/dist/` directory
- Build tooling (Vite, Mix, plain npm scripts)

## Inputs
- Compiled asset files (CSS, JS, images, fonts)
- Version information for cache busting

## Workflow (numbered)
1. **Build and compile assets** — Run build pipeline to produce minified CSS/JS in `resources/dist/`
2. **Set up tagged publishing** — `$this->publishes([__DIR__.'/../resources/dist/' => public_path('vendor/package-name')], 'package-name-assets')`
3. **Add version strings** — Append version (`?v=1.2.3`) or content hash to asset URLs for cache busting
4. **Document publishing step** — README includes `php artisan vendor:publish --tag=package-name-assets --force`
5. **Include source assets (optional)** — If consumers may customize the build, publish source files to `resources/` as well
6. **Test asset serving** — Verify published assets are served with correct cache headers and MIME types

## Validation Checklist
- [ ] Assets published with specific tag (`--tag=package-name-assets`)
- [ ] Pre-built (compiled, minified) assets available for zero-config setup
- [ ] Asset URLs include version strings for cache busting
- [ ] `--force` used in deployment scripts
- [ ] No unnecessary files (node_modules, tests) in published output
- [ ] Published assets minified and gzip-ready
- [ ] Fallback or error handling for missing published assets

## Common Failures
- **Publishing source files instead of compiled** — consumers get non-servable files requiring build pipeline
- **Not using --force in deploy** — new assets not copied; outdated versions remain served
- **Hardcoding paths without versioning** — browser cache never busts; consumers see stale assets
- **Publishing node_modules** — large unnecessary files increase package size

## Decision Points
- Pre-built vs source: pre-built for zero-config; source for consumers who customize
- Versioning strategy: version query string vs content hash in filename
- Publish target: `public/vendor/package-name/` for pre-built; `resources/` for source assets requiring build

## Performance/Security Considerations
- Minify all published assets; use PurgeCSS to remove unused styles
- Serve with aggressive cache headers (`max-age=31536000, immutable`) for versioned assets
- Use Subresource Integrity (SRI) hashes in asset tags
- Never include API keys, internal URLs, or credentials in published assets
- Assets to `public/` are publicly accessible; don't publish private files

## Related Rules (from 05-rules.md)
- ASSET-RULE-001: Tagged asset publishing
- ASSET-RULE-002: Pre-built assets in dist/
- ASSET-RULE-004: Versioned asset URLs
- ASSET-RULE-005: --force in deployment
- ASSET-RULE-007: Minify and compress

## Related Skills
- Implement Config File Merging and Publishing
- Set Up Migration Publishing and Discovery
- Integrate Vite with Laravel Packages

## Success Criteria
- Assets publish correctly with a single tagged command
- Pre-built assets work immediately without consumer build tooling
- Versioned URLs ensure cache busting on package updates
- `--force` deploys reliably overwrite outdated assets
- Zero sensitive data exposed in published assets

---

# Skill: Set Up Migration Publishing and Discovery for Laravel Packages

## Purpose
Register and publish database migrations for Laravel packages, providing automatic loading for mandatory schema and optional publishing for consumer customization.

## When To Use
- Package creates database tables essential for functionality
- Package adds columns to existing application tables
- Package has feature-specific optional tables

## When NOT To Use
- Package stores data in external systems (APIs, NoSQL)
- Package uses existing application tables without modification
- Package is algorithmic or config-only

## Prerequisites
- Migration files in `database/migrations/` of the package
- Package service provider

## Inputs
- Migration files with `up()` and `down()` methods
- Table naming strategy (package-prefixed)

## Workflow (numbered)
1. **Create migrations** — Place in `database/migrations/` with package-prefixed table names; implement both `up()` and `down()`
2. **Set up automatic loading** — `$this->loadMigrationsFrom(__DIR__.'/../database/migrations')` in service provider
3. **Add publishing** — `$this->publishes([__DIR__.'/../database/migrations/' => database_path('migrations')], 'package-name-migrations')`
4. **Use Spatie named migrations** — For selective publishing: `->hasMigration('create_my_table')` with deterministic timestamping
5. **Test in CI** — Run migrations against fresh SQLite in-memory database; verify correct columns and indexes
6. **Version schema changes** — Additions (nullable columns) = PATCH; removals = MAJOR

## Validation Checklist
- [ ] `loadMigrationsFrom()` called in service provider
- [ ] Migrations publishable with tagged command
- [ ] Every migration has both `up()` and `down()`
- [ ] Table names and index names prefixed with package name
- [ ] Migrations tested in CI with SQLite in-memory
- [ ] Schema changes follow SemVer
- [ ] Data migrations (if any) wrapped in transactions and chunked

## Common Failures
- **Only publishable, no automatic loading** — consumers forget to publish; tables missing
- **Forgetting down()** — can't rollback cleanly
- **Schema changes in PATCH versions** — breaking changes for consumers
- **Foreign keys across packages** — coupling and migration ordering issues

## Decision Points
- Automatic vs published: automatic for mandatory tables; published for optional feature tables
- Single file vs multiple: single for simple packages; multiple for complex schema evolution
- Timestamp strategy: Spatie deterministic (stable on re-publish) vs default (new each time)

## Performance/Security Considerations
- Package migrations only execute during `php artisan migrate`; no runtime cost
- Each index affects insert/update performance; only add indexes the package actually uses
- Data migrations must be chunked and wrapped in transactions for safety
- Idempotency preferred: `CREATE TABLE IF NOT EXISTS` where possible
- For high-traffic apps, package migrations should work with maintenance mode

## Related Rules (from 05-rules.md)
- MIG-RULE-001: Automatic loading for mandatory schema
- MIG-RULE-002: Always implement down()
- MIG-RULE-003: Package-prefixed table/index names
- MIG-RULE-004: Schema versioning
- MIG-RULE-008: Test in CI
- MIG-RULE-010: Avoid only publishable, no auto-loading

## Related Skills
- Implement Config File Merging and Publishing
- Set Up a Package Service Provider with Spatie Tools
- Test Laravel Packages with Orchestra Testbench

## Success Criteria
- Package migrations run automatically on `php artisan migrate`
- Optional migrations publishable with tagged command
- All migrations have `down()` methods for clean rollback
- No table/index name collisions with other packages
- Schema changes follow SemVer; consumers can predict upgrade impact
