# 1-28 Migration Testing In Ci

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Schema Design & Migration Engineering |
| Knowledge Unit ID | 1-28 |
| Knowledge Unit Title | Migration Testing In Ci |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 1.28 Migration testing | 1.8 Migration squashing | 1.7 Migration batch tracking |
| Last Updated | 2026-06-02 |

## Overview

Migrations must be tested in CI using the same database engine AND version as production. MySQL 8.0 behavior differs from MySQL 5.7; PostgreSQL 15 differs from PostgreSQL 16. A migration that works on SQLite (default test DB) may fail on PostgreSQL in production. CI migration testing must run against a database matching production configuration, including storage engine, SQL mode, and version-specific DDL behavior.

---

## Core Concepts

- **Engine mismatch**: Laravel's default test environment uses SQLite. Migrations that use MySQL-specific syntax (e.g., `after()`, `fullText()`) fail silently or produce different schemas.
- **Version-specific DDL**: `ALGORITHM=INSTANT` requires MySQL 8.0.12+. MySQL 5.7 doesn't support it. CI running on 8.0 may not catch 5.7 incompatibilities.
- **SQL mode differences**: MySQL's strict mode affects DDL validation. A migration that creates a column with an invalid default may pass in one SQL mode but fail in another.
- **Schema dump compatibility**: Schema dumps generated on one engine version may not be compatible with another (e.g., MySQL 8.0 dump syntax vs MariaDB).


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **GitHub Actions matrix**: Run migration tests against the same database service (e.g., `services: mysql:8.0.36`) used in production. Use a matrix for multiple supported databases.
- **Docker-based CI**: Spin up a production-matching database container, run `migrate --force`, then run the test suite. If the migration fails, CI fails.
- **Schema comparison test**: After running migrations, compare the resulting schema against an expected schema file to detect drift.


## Architecture Guidelines

- | CI Database | When | Risk |
- |------------|------|------|
- | SQLite (default) | Local dev, unit tests | Misses engine-specific issues |
- | MySQL 8.0 container | CI for MySQL production | Docker container may differ from managed RDS |
- | PostgreSQL 16 container | CI for PostgreSQL production | Minor version edge cases |


## Performance Considerations

- - Spinning up a database container in CI adds 10-30 seconds to job startup time. Use Docker layer caching to pre-pull database images.
- - Running `migrate:fresh` with 200+ migrations can take 30-60 seconds. Use `schema:dump` for faster initial schema loading.
- - Running migration tests in parallel across multiple database versions multiplies compute cost. Use CI matrix builds to parallelize.
- - Database container resource limits affect migration speed. Allocate sufficient CPU/memory for the container to avoid false test failures due to timeouts.

## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Using SQLite for migration tests**: `after()` modifier (MySQL-specific) silently ignored in SQLite. Migration passes in CI but produces incorrect schema in production. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Testing migrations against wrong database version**: CI runs MySQL 8.3 but production runs MySQL 5.7. Migration uses `ALGORITHM=INSTANT` which doesn't exist in 5.7. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | Not testing rollback**: CI tests `migrate --force` but not `migrate:rollback`. A migration with incorrect `down()` passes CI but fails during production rollback. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 4 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- - **SQLite blind spot**: Tests pass on SQLite (default test DB) but the migration uses MySQL-specific syntax (`after()`, `fullText()`, `ALGORITHM=INSTANT`). The migration silently produces a different schema in production. Mitigation: always run migration tests against the production database engine.
- - **Version-specific DDL failure**: A migration uses `ALGORITHM=INSTANT` tested on MySQL 8.0. Production runs MySQL 5.7. The migration fails during deployment. Mitigation: match CI database version exactly to production.
- - **Migration order dependency**: CI runs `migrate:fresh` (all migrations from scratch). Production applies migrations incrementally. A migration that works on fresh may fail when applied incrementally due to missing intermediate states. Test both fresh and incremental.
- - **Rollback untested**: CI tests `migrate --force` but never runs `migrate:rollback`. The rollback fails in production during a deploy incident. Mitigation: include rollback in CI migration tests.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Schema Design & Migration Engineering
- **Closely Related**: Other KUs within Schema Design & Migration Engineering
- **Advanced**: Expert-level KUs building on this concept
- **Cross-Domain**: Related topics from other subdomains in Data andamp; Storage Systems

## AI Agent Notes

- Apply these concepts based on specific implementation requirements
- Consider tradeoffs between different approaches
- Validate assumptions with actual measurements
- Review related KUs for additional context

## Verification

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Architecture decisions are documented with rationale
- [ ] Related KUs have been consulted for cross-cutting concerns

