# Skill: Test Migrations in CI Against Production-Matching Database

## Purpose

Run migration tests in CI using the same database engine and version as production — not SQLite — with a container-based database service, testing both forward migration and rollback to catch engine-specific syntax issues, version-specific DDL failures, and schema drift before deployment.

## When To Use

- CI/CD pipelines for projects using MySQL-specific or PostgreSQL-specific migration features
- Teams using multiple database engines across environments
- Before deploying to production

## When NOT To Use

- Projects using only SQLite in production
- Simple migrations with zero database-specific syntax

## Prerequisites

- CI service supporting Docker-based service containers (GitHub Actions, GitLab CI)
- Database engine matching production (MySQL, PostgreSQL, MariaDB)
- Schema dump or migration files

## Inputs

- Production database engine and version
- Migration files
- CI configuration (YAML)

## Workflow

1. Configure a CI service container matching the production database engine and version (e.g., `image: mysql:8.0.36`)
2. Add a CI step that runs `php artisan migrate --force` on the container database
3. Add a CI step that seeds test data and runs the new migrations
4. Add a CI step that runs `php artisan migrate:rollback --step=1 --force` to test rollback
5. Optionally add a schema comparison step comparing the resulting schema against an expected schema file
6. Use a matrix strategy if supporting multiple database engines

## Validation Checklist

- [ ] CI database engine matches production exactly (version, storage engine, SQL mode)
- [ ] `migrate --force` runs successfully against the CI database
- [ ] Rollback is tested: `migrate:rollback` works correctly
- [ ] Database-specific features work (after(), fullText(), ALGORITHM=INSTANT)
- [ ] Data integrity is verified after migration

## Common Failures

### Using SQLite for migration tests
`after()` modifier and `fullText()` are MySQL-specific and silently ignored in SQLite. Migration passes in CI but produces incorrect schema in production. Always use the production database engine.

### Testing against wrong database version
CI runs MySQL 8.3 but production runs MySQL 5.7. Migration uses ALGORITHM=INSTANT which doesn't exist in 5.7. Match CI database version exactly to production.

## Decision Points

### SQLite vs production engine?
SQLite is fine for unit tests but NEVER for migration tests. Migration tests must run against the exact database engine and version used in production.

### Fresh migrate vs incremental?
Test both. `migrate:fresh` tests all migrations run from scratch. Incremental tests simulate production deployment by running only new migrations on a pre-existing schema.

## Performance Considerations

Database containers add 10-30s to CI job startup. Use Docker layer caching for faster image pulls. `schema:dump` reduces migration time for large histories. Matrix builds across multiple DB versions multiply compute cost.

## Security Considerations

CI database containers should not contain real production data. Use test-specific credentials. Database containers are ephemeral — destroyed after CI job completion.

## Related Rules

- Test migrations against production-matching database engine
- Test both forward migration and rollback
- Include engine-specific features in test coverage

## Related Skills

- Create Anonymous Migration Classes
- Squash Migrations with schema:dump
- Verify Data Integrity During Migrations

## Success Criteria

- CI database container matches production engine and version
- Forward migration and rollback both tested in CI
- Engine-specific features (after, fullText, INSTANT) validated
- Schema comparison detects drift between expected and actual
- Matrix builds cover multiple supported database engines
