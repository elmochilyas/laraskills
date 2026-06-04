# Metadata
Domain: Testing & Reliability Engineering
Subdomain: CI/CD Pipeline Integration
Knowledge Unit: Matrix Testing (PHP × Database)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
Matrix testing in Laravel CI runs the same test suite across multiple PHP versions and database engine combinations, ensuring compatibility against the full range of production environments. The standard matrix covers PHP 8.2, 8.3, and 8.4 combined with MySQL 8, PostgreSQL 16, and optionally SQLite. GitHub Actions' matrix strategy enables this with minimal YAML configuration. Matrix testing catches PHP version-specific deprecations, database engine behavioral differences (JSON handling, transaction semantics, collation), and extension compatibility issues before they reach production.

# Core Concepts
- **Matrix strategy**: GitHub Actions `strategy.matrix` defines a set of variables (php, db) whose Cartesian product creates individual jobs.
- **Include/exclude**: `matrix.include` adds specific combinations; `matrix.exclude` removes combinations (e.g., SQLite + PostgreSQL is nonsensical).
- **Service containers**: Docker containers for MySQL/PostgreSQL that start alongside the CI job. Configured with environment variables for database name, user, and password.
- **PHP version impacts**: Different PHP versions have different syntax support, deprecation warnings, and extension availability.
- **Database engine impacts**: JSON operations, foreign key enforcement, transaction isolation, and date/time functions differ significantly between MySQL, PostgreSQL, and SQLite.

# Mental Models
- **Matrix as production simulation**: Each matrix cell approximates a production deployment. If any cell fails, that deployment configuration would have failed in production.
- **PHP × DB = 2D quality grid**: Two independent axes of variability. The goal is to cover the intersection where your production config lives, then expand to adjacent cells.
- **Minimal viable matrix**: Start with production's PHP version + production's DB, then add one PHP version up, one PHP version down, and one alternate DB.
- **Cost vs coverage curve**: Matrix growth is multiplicative (3 PHP × 3 DB = 9 jobs). Each job costs CI minutes. Choose the cells that provide the most signal per minute.

# Internal Mechanics
- **Matrix expansion**: GitHub Actions reads the matrix definition, expands it into individual jobs with unique `strategy.matrix.php` and `strategy.matrix.db` values, and schedules them for parallel execution.
- **phpunit.xml database configuration**: Tests read `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` from environment variables (set per matrix cell). MySQL and PostgreSQL have different variable requirements.
- **Service container networking**: MySQL exposes port 3306; PostgreSQL exposes 5432. Both bound to `localhost` on the runner. The PHP test process connects to `127.0.0.1:3306` or `127.0.0.1:5432`.
- **Conditional test exclusion**: Some tests may not apply to all matrix cells (e.g., PostgreSQL-specific JSON tests). Use PHPUnit's `@requires` annotation or Pest's `skip()` for conditional exclusion.

# Patterns
- **Pattern: Production-equivalent matrix cell**
  - Purpose: Always test against exact production configuration
  - Benefits: Direct confidence in production compatibility
  - Tradeoffs: Doesn't catch future incompatibilities
  - Implementation: `include: [{ php: '8.3', db: 'mysql', db-version: '8.0' }]`

- **Pattern: Minimal matrix for PR, full matrix for merge**
  - Purpose: Fast feedback on PRs, comprehensive coverage on merge
  - Benefits: Balances speed and coverage
  - Tradeoffs: Complex workflow configuration
  - Implementation: Two workflows or conditional matrix based on event type

- **Pattern: Database-specific test tags**
  - Purpose: Run DB-specific tests only on relevant matrix cells
  - Benefits: Reduces duplicate test execution across cells
  - Tradeoffs: Test organization overhead
  - Implementation: Pest `describe('MySQL')->skip(fn () => DB::connection() !== 'mysql')`

- **Pattern: Matrix with extension variants**
  - Purpose: Test with different PHP extension combinations
  - Benefits: Catches extension-specific issues (pcov, redis, imagick)
  - Tradeoffs: Exponential matrix growth
  - Implementation: Add `extensions` to matrix variables; conditionally enable extensions via setup-php

# Architectural Decisions
- **Exhaustive vs targeted matrix**: Exhaustive (all PHP × all DB) for libraries/packages. Targeted (production + adjacent) for applications. Packages need broader compatibility.
- **Include/exclude logic**: Use `exclude` sparingly. Prefer `include` to add specific production-relevant combinations and let the Cartesian product define the rest.
- **Parallel vs sequential matrix jobs**: GitHub Actions runs matrix jobs in parallel by default. For resource-constrained environments, use `max-parallel: 2` to limit concurrency.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Catches PHP version incompatibilities | Multiplies CI runner minutes | Limit matrix on PR; full matrix on merge |
| Validates DB engine behavior | Service container startup time (+10-20s per job) | Use service containers, not external DB |
| Production confidence | Complex phpunit.xml configuration | Use environment variable templating |
| Package compatibility proof | May need database-specific assertions | Use Pest groups for conditional tests |

# Performance Considerations
- Matrix expansion: Each job is independent and runs in parallel (GitHub-hosted: up to 20 concurrent). Total wall time = slowest cell time.
- Service container startup: MySQL 5-10s, PostgreSQL 5-10s. Startup time is per job.
- Database migration time: ~10-30s per migration set (depends on migration count). Each matrix cell runs migrations independently.
- Test time per cell: Same test suite, different DB. PostgreSQL is typically 10-20% slower than MySQL due to different transaction handling.
- PHP 8.4 is ~5-10% faster than PHP 8.2 for most Laravel workloads. Matrix cells with newer PHP finish faster.

# Production Considerations
- **Database version tracking**: Production database version matters. MySQL 5.7 vs 8.0 vs 8.4 have different behaviors. Pin service container version in matrix include.
- **PHP extension availability**: Some PHP extensions have different versions or availability across PHP versions. Verify extension matrix via setup-php configuration.
- **Database-specific migration paths**: MySQL-specific migration syntax (e.g., `->default(DB::raw('CURRENT_TIMESTAMP'))`) may fail on PostgreSQL. Use DB-agnostic migrations.
- **CI cost management**: Matrix jobs consume runner minutes for each cell. For large projects, consider running full matrix only on schedule or merge to main.

# Common Mistakes
- **Mistake: Using SQLite as the only CI database**
  - Why: Works locally; no service container needed
  - Why harmful: SQLite doesn't enforce foreign keys by default, has limited JSON support, and different transaction semantics
  - Better: Always include MySQL or PostgreSQL in matrix; use SQLite only for local TDD

- **Mistake: Matrix excludes that hide bugs**
  - Why: `exclude: [{ php: 8.2, db: pgsql }]` because "it's not in production"
  - Why harmful: A future migration or package update breaks on PHP 8.2 + PgSQL; not caught until production migration
  - Better: Test all combinations at least on merge to main

- **Mistake: Ignoring PHP deprecation warnings in CI**
  - Why: Warnings don't fail CI
  - Why harmful: Deprecations accumulate; upgrade to next PHP version becomes painful
  - Better: Set `error_reporting: E_ALL` in php.ini; configure CI to fail on warnings for new PHP versions

- **Mistake: Not cleaning up database after matrix tests**
  - Why: Service containers are ephemeral
  - Why harmful: May not be true for shared database or persistent storage
  - Better: Use transient service containers; never share database across matrix cells

# Failure Modes
- **Service container health check failure**: MySQL/PostgreSQL container fails to start. Add `healthcheck` and `wait-for-it` script before test execution.
- **Matrix job timeout**: A single matrix cell hangs or runs very long. Set per-job `timeout-minutes` to avoid blocking overall workflow.
- **Resource exhaustion**: Running 9 matrix cells simultaneously may exhaust GitHub runner resources (disk space, memory). Use `max-parallel` or sequential groups.
- **Database port collision**: Multiple matrix cells on the same runner sharing a database port. Each cell gets its own runner VM in GitHub Actions; this is not an issue with hosted runners.

# Ecosystem Usage
- **Laravel core**: Laravel's own CI matrix includes PHP 8.2, 8.3, 8.4 × MySQL, MariaDB, PostgreSQL, SQLite. The matrix is defined in `.github/workflows/tests.yml`.
- **Laravel Jetstream**: Jetstream extends its matrix to test both Livewire and Inertia stacks across PHP versions.
- **Spatie packages**: Most Spatie packages maintain a matrix of PHP versions and often include a lowest-dependency and highest-dependency variant.
- **PHP community**: Matrix testing is universal across major PHP projects (Symfony, Composer, PHPUnit) and is considered a best practice for any package with multiple version support.

# Related Knowledge Units
- **Prerequisites**: GitHub Actions fundamentals, Docker basics, Database connection configuration
- **Related Topics**: Parallel test sharding, Path-based triggering, GitHub Actions CI/CD
- **Advanced Follow-up**: Database-specific testing strategies, Conditional test execution per matrix cell, Matrix caching optimization

# Research Notes
- The `shivammathur/setup-php` action supports matrix-based PHP and extension installation; the `extensions` parameter accepts comma-separated extension names that are compiled from source when needed
- GitHub Actions matrix jobs each run in isolated VMs, meaning no resource contention between matrix cells; this is a key advantage over self-hosted runners where cells share resources
- Database matrix testing identified a significant Laravel issue: PostgreSQL's `jsonb` casting differs from MySQL's `json` type, causing serialization differences in Eloquent accessors
- The Laravel community standard matrix is PHP 8.2/8.3/8.4 × MySQL 8/PostgreSQL 16; SQLite is included but only for local development reference, not as a CI gate
- Matrix include/exclude syntax is powerful but can become fragile; teams should audit their matrix configuration quarterly to remove obsolete production version excludes
