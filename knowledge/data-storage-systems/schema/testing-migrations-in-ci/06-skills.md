# Skill: Test Migrations in CI with Forward/Rollback Verification

## Purpose

Implement CI migration testing that runs syntax checks, dry-run SQL validation, forward migration, seed + verify, and rollback — catching syntax errors, constraint violations, and incomplete rollback methods before they reach production deployment.

## When To Use

- Any project with CI/CD pipeline
- Before deploying migrations to production
- When adding new migration tooling or raw SQL

## When NOT To Use

- Projects without CI infrastructure
- Local development (manual testing suffices)

## Prerequisites

- CI service supporting database containers (GitHub Actions, GitLab CI, Jenkins)
- Production-matching database engine in CI
- Migration test script

## Inputs

- Migration files
- CI database configuration
- Test data seeding

## Workflow

1. Add a CI step for syntax check: `php -l database/migrations/*.php`
2. Add a CI step for database container startup matching production engine
3. Add a CI step for forward migration: `php artisan migrate --force`
4. Add a CI step to seed test data
5. Add a CI step to run new migrations (if incremental) or run `migrate:fresh` (if full)
6. Add a CI step to verify data integrity: run queries against migrated schema
7. Add a CI step for rollback: `php artisan migrate:rollback --step=1 --force`
8. Add a CI step to verify rollback restored the previous state

## Validation Checklist

- [ ] Syntax check passes for all migration files
- [ ] Database container matches production engine and version
- [ ] Forward migration runs without errors
- [ ] Data integrity verified after migration
- [ ] Rollback succeeds and restores previous state
- [ ] Multi-connection migrations tested on each connection type

## Common Failures

### No rollback testing in CI
CI tests `migrate --force` but never runs `migrate:rollback`. The rollback fails in production during a deploy incident. Always test rollback in CI.

### SQLite for migration tests
Engine-specific syntax (`after()`, `fullText()`, `ALGORITHM=INSTANT`) silently fails on SQLite. Always use the production database engine for migration tests.

## Decision Points

### Fresh migrate vs incremental test?
Test both. `migrate:fresh` tests all migrations from scratch. Incremental tests simulate production deployments where only new migrations are applied on an existing schema.

### Single engine vs matrix?
Matrix for projects supporting multiple databases. Single engine for projects with a single production database. Matrix builds multiply CI compute cost.

## Performance Considerations

Database containers add 10-30s to CI startup. Large migration histories benefit from `schema:dump` to reduce test time. Matrix builds multiply compute cost but catch engine-specific issues.

## Security Considerations

CI database containers should use test-specific credentials and contain no real data. Database containers are ephemeral — destroyed after CI job completion.

## Related Rules

- Test both forward and rollback in CI
- Use production-matching database engine
- Include data integrity verification

## Related Skills

- Test Migrations in CI
- Verify Data Integrity During Migrations
- Squash Migrations for Fast Fresh Installs

## Success Criteria

- CI pipeline tests syntax, forward migration, and rollback
- Database engine matches production exactly
- Data integrity verified after migration
- Rollback tested and confirmed working
- Multi-connection migrations tested per connection type
