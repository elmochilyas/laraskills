# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | CI/CD Pipeline Integration |
| Knowledge Unit | Matrix Testing (PHP x Database) |
| Difficulty | Advanced |
| Maturity | Mature |
| Priority | P2 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | GitHub Actions fundamentals, Docker basics, Database connection configuration |
| Related KUs | Parallel test sharding, Path-based triggering, GitHub Actions CI/CD |
| Source | domain-analysis.md K040 |

# Overview

Matrix testing in Laravel CI runs the same test suite across multiple PHP versions and database engine combinations, ensuring compatibility against the full range of production environments. The standard matrix covers PHP 8.2, 8.3, and 8.4 combined with MySQL 8, PostgreSQL 16, and optionally SQLite. GitHub Actions' matrix strategy enables this with minimal YAML configuration. Matrix testing catches PHP version-specific deprecations, database engine behavioral differences (JSON handling, transaction semantics, collation), and extension compatibility issues before they reach production.

# Core Concepts

- **Matrix strategy**: GitHub Actions `strategy.matrix` defines a set of variables (php, db) whose Cartesian product creates individual jobs.
- **Include/exclude**: `matrix.include` adds specific combinations; `matrix.exclude` removes combinations.
- **Service containers**: Docker containers for MySQL/PostgreSQL that start alongside the CI job.
- **PHP version impacts**: Different PHP versions have different syntax support, deprecation warnings, and extension availability.
- **Database engine impacts**: JSON operations, foreign key enforcement, transaction isolation, and date/time functions differ significantly between MySQL, PostgreSQL, and SQLite.

# When To Use

- For any Laravel application or package deployed to multiple environments
- When production uses a different database engine than local development
- For open-source packages that need broad PHP version compatibility
- Before PHP version upgrades to catch deprecation warnings
- When switching database engines (e.g., MySQL to PostgreSQL migration)

# When NOT To Use

- For simple projects with a single, well-defined production environment (use minimal matrix)
- When CI runner minute budget is extremely constrained (run production-equivalent cell only)
- For projects using only SQLite in production (rare but possible for embedded applications)
- As a gate for every PR commit — full matrix is too slow; run reduced matrix on PRs, full on merge

# Best Practices (WHY)

- **Always include the production-equivalent matrix cell**: Test against exactly the PHP version and database engine used in production. This is the minimum matrix cell that must pass before deployment.
- **Run minimal matrix on PRs, full matrix on merge**: Use a reduced matrix (production PHP + one neighbor + production DB) for pull request feedback. Run the exhaustive matrix when merging to main or on a nightly schedule.
- **Use service containers for databases, not external services**: MySQL/PostgreSQL containers start fresh for each job, ensuring clean state and version consistency. External databases introduce flakiness from shared state.
- **Test across at least two PHP minor versions**: Cover the current production version and one version ahead. This surfaces deprecation warnings early and makes PHP upgrades predictable.
- **Do not use SQLite as the only CI database**: SQLite doesn't enforce foreign keys by default, has limited JSON support, and different transaction semantics. Always include at least one production-equivalent database engine.

# Architecture Guidelines

- **Exhaustive vs targeted matrix**: Exhaustive (all PHP x all DB) for libraries/packages. Targeted (production + adjacent) for applications.
- **Include/exclude logic**: Use `include` to add production-relevant combinations. Use `exclude` sparingly — it can hide bugs in uncovered cells.
- **Parallel vs sequential**: GitHub Actions runs matrix jobs in parallel by default. Use `max-parallel: 2` for resource-constrained self-hosted runners.
- **Database version pinning**: Pin service container versions (mysql:8.0, postgres:16) to match production. Database version differences cause real behavioral changes.

# Performance Considerations

- Matrix expansion: Each job is independent and runs in parallel (up to 20 concurrent on hosted runners). Total wall time = slowest cell.
- Service container startup: MySQL 5-10s, PostgreSQL 5-10s per job.
- Database migration time: ~10-30s per migration set. Each matrix cell runs migrations independently.
- Test time per cell: PostgreSQL is typically 10-20% slower than MySQL due to transaction handling differences.
- PHP 8.4 is ~5-10% faster than PHP 8.2 for most Laravel workloads.

# Security Considerations

- Service containers are isolated per job — no cross-contamination between matrix cells.
- Database credentials passed via environment variables are visible in CI logs if not masked. Use GitHub Actions secrets for sensitive values.
- Matrix expansion does not affect security posture directly, but broader PHP version coverage catches security-relevant deprecations earlier.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using SQLite as the only CI database | Works locally; no service container needed | SQLite blind spots (foreign keys, JSON, transactions) | Always include MySQL or PostgreSQL in matrix |
| Matrix excludes that hide bugs | Excluding combinations "not in production" | Future migration or package update breaks on excluded cell | Test all combinations at least on merge to main |
| Ignoring PHP deprecation warnings in CI | Warnings don't fail CI | Deprecations accumulate; PHP upgrade becomes painful | Set error_reporting: E_ALL; fail CI on warnings for new PHP versions |
| Not cleaning up database after matrix tests | Service containers are ephemeral | May not be true for shared database | Use transient service containers; never share database across cells |
| Not pinning database versions | Using latest tag for service containers | Database update breaks CI unexpectedly | Pin exact versions matching production |

# Anti-Patterns

- **SQLite-only CI**: Running all tests on SQLite when production uses MySQL/PostgreSQL. Creates false confidence.
- **Infinite matrix growth**: Adding every PHP version and database engine without cost/benefit analysis. Limit matrix to versions/engines your project actively supports.
- **Excluding combinations because "they're not in production"**: This misses compatibility regressions that affect future migrations.
- **Identical matrix for PR and main branch**: Wastes CI minutes on PRs. Use reduced matrix for PRs, full matrix for merge.

# Examples

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        php: ['8.2', '8.3', '8.4']
        db: [mysql, pgsql]
        include:
          - php: '8.3'
            db: mysql
            db-version: '8.0'
    services:
      mysql:
        image: mysql:${{ matrix.db-version || '8.0' }}
        env:
          MYSQL_ROOT_PASSWORD: password
          MYSQL_DATABASE: testing
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with:
          php-version: ${{ matrix.php }}
          extensions: pdo_mysql, pdo_pgsql
      - run: composer install --no-interaction
      - run: php artisan test
```

# Related Topics

- **Prerequisites**: GitHub Actions fundamentals, Docker basics, Database connection configuration
- **Related**: Parallel test sharding, Path-based triggering, GitHub Actions CI/CD
- **Advanced**: Database-specific testing strategies, Conditional test execution per matrix cell, Matrix caching optimization

# AI Agent Notes

- When setting up a matrix for an existing project, first identify the production PHP version and database engine. Make this the primary matrix cell. Add one PHP version above and below for deprecation tracking.
- For packages/libraries, use a broader matrix. For applications, focus on production-relevant combinations.
- Watch out for database-specific migration syntax. MySQL-specific `CURRENT_TIMESTAMP` defaults will fail on PostgreSQL. Use DB-agnostic migrations or conditional migration files.
- Service container health is critical — add a `wait-for-it` step before running tests to avoid "connection refused" failures.

# Verification

- [ ] Production-equivalent matrix cell is always included
- [ ] SQLite is not the only CI database engine
- [ ] Matrix runs on at least 2 PHP versions
- [ ] Service containers use pinned database versions matching production
- [ ] Full matrix runs on merge to main or nightly
- [ ] Reduced matrix runs on PRs for fast feedback
- [ ] Deprecation warnings are treated as failures for new PHP versions
- [ ] Database credentials are properly secured in CI
