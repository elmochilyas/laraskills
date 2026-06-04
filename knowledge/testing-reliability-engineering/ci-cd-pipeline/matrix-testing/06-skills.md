# Skill: Test with PHP and Database Matrix

## Purpose
Configure GitHub Actions matrix strategies to run the Laravel test suite across multiple PHP versions and database engines, ensuring compatibility with production environments.

## When To Use
- When the application is deployed to multiple PHP versions or database engines
- When production uses a different database engine than local development
- For open-source packages needing broad compatibility
- Before PHP version upgrades to catch deprecation warnings
- When switching database engines (MySQL ↔ PostgreSQL)

## When NOT To Use
- For simple projects with a single, well-defined production environment
- When CI runner minute budget is extremely constrained
- On every PR commit — run reduced matrix on PRs, full on merge
- When the project uses only SQLite in production (rare)

## Prerequisites
- GitHub Actions workflow configured
- Docker service containers for MySQL/PostgreSQL
- PHP version and database engine matching production
- Understanding of GitHub Actions matrix strategy syntax

## Inputs
- PHP versions to test (current production + 1-2 adjacent)
- Database engines to test (MySQL, PostgreSQL versions)
- Service container configurations for each database
- PR vs merge branch strategy (reduced vs full matrix)

## Workflow
1. Identify the production PHP version and database engine — make this the primary matrix cell
2. Add one PHP version above production for deprecation tracking
3. Configure service containers for MySQL and PostgreSQL with pinned versions
4. Set up the GitHub Actions matrix strategy with `php` and `db` variables
5. Use `include` to add production-specific configurations (DB version, extensions)
6. Run reduced matrix on PRs (production PHP + production DB), full matrix on merge to main
7. Add a `wait-for-it` step before tests for database readiness
8. Set `fail-fast: false` for the full matrix to see all failures
9. Add database-specific test exclusions for features that only apply to one engine

## Validation Checklist
- [ ] Production-equivalent matrix cell (PHP + DB) is always included
- [ ] SQLite is not the only CI database engine
- [ ] Matrix runs on at least 2 PHP versions
- [ ] Service containers use pinned database versions matching production
- [ ] Full matrix runs on merge to main or nightly
- [ ] Reduced matrix runs on PRs for fast feedback
- [ ] Database credentials are secured via CI secrets
- [ ] Deprecation warnings are treated as failures for new PHP versions

## Common Failures
- Using SQLite as the only CI database — foreign key, JSON, and transaction differences missed
- Matrix excludes that hide bugs — excluding "not in production" combinations misses migration regressions
- Not pinning database versions — `latest` tag breaks CI when new DB version releases
- Identical matrix for PR and main — wastes CI minutes on PRs
- Not waiting for service container readiness — database connection failures
- PHP deprecation warnings not failing CI — deprecations accumulate unnoticed

## Decision Points
- PHP versions: production + 1 ahead vs broader range — production + 1 for apps, broader for packages
- Database engines: MySQL + PostgreSQL vs only production DB — both for high-compatibility apps, production-only for internal tools
- PR matrix vs merge matrix — reduced (1 PHP + production DB) for PRs, full (3 PHP × 2 DB) for merge

## Performance Considerations
- Each matrix cell is an independent CI job — total wall time = slowest cell
- Service container startup adds 5-10s per job
- PostgreSQL is typically 10-20% slower than MySQL for Laravel tests
- Use `max-parallel` to limit concurrent jobs on self-hosted runners
- Cache Composer dependencies per PHP version

## Security Considerations
- Service containers are isolated per job — no cross-contamination
- Database credentials via environment variables — mask in CI logs
- Use CI secrets for sensitive values, not hardcoded in workflow files
- Broader PHP version coverage catches security-relevant deprecations earlier

## Related Rules
- [Rule: Always Include the Production-Equivalent Matrix Cell](./05-rules.md)
- [Rule: Run Minimal Matrix on PRs, Full Matrix on Merge](./05-rules.md)
- [Rule: Use Service Containers, Not External Databases](./05-rules.md)

## Related Skills
- Parallel Test Sharding
- Path-Based CI Triggering
- GitHub Actions CI/CD

## Success Criteria
- [ ] Matrix covers production PHP version and database engine
- [ ] At least one additional PHP version is tested for deprecation detection
- [ ] Full matrix runs on merge to main, reduced on PRs
- [ ] Service containers use pinned versions matching production
- [ ] SQLite is not the sole CI database
